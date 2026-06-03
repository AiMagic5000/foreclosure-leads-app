#!/usr/bin/env python3
"""
Discover actual excess proceeds / surplus fund URLs for every county
by probing common URL patterns on known government websites.

Uses county-directory.ts (3,271 counties with website URLs) to construct
likely URLs and tests them via HTTP HEAD/GET requests.

Outputs: JSON file of verified URLs ready to add to government_list_scraper.py

Run: python3 discover_county_urls.py --state CA --output /tmp/discovered_urls.json
"""

import os
import sys
import json
import re
import time
import logging
import argparse
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Non-judicial states
NON_JUDICIAL = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "GA", "HI", "ID", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NC",
    "OR", "SD", "TN", "TX", "UT", "VA", "WA", "WV", "WY"
}

# Common URL suffixes for excess proceeds pages
URL_PATTERNS = [
    "/excess-proceeds",
    "/excess-proceeds/",
    "/ExcessProceeds",
    "/ExcessProceeds.aspx",
    "/excess-funds",
    "/excess-funds/",
    "/ExcessFunds",
    "/surplus-funds",
    "/surplus-funds/",
    "/SurplusFunds",
    "/surplus",
    "/overages",
    "/overbid",
    "/tax-sale-excess-proceeds",
    "/tax-sales/excess-proceeds",
    "/tax-sale/excess-proceeds",
    "/treasurer/excess-proceeds",
    "/Treasurer/ExcessProceeds",
    "/treasurer/excess-funds",
    "/tax-collector/excess-proceeds",
    "/tax/excess-proceeds",
    "/Tax/ExcessProceeds",
    "/revenue-commissioner/excess-funds",
    "/tax-commissioner/excess-funds",
    "/departments/treasurer/excess-proceeds",
    "/departments/finance/surplus-funds",
    "/Property/ExcessProceeds",
    "/Pages/Excess-Proceeds.aspx",
]

# Keywords that indicate we found an actual excess proceeds page
POSITIVE_KEYWORDS = [
    "excess proceed", "excess fund", "surplus fund", "overage",
    "overbid", "unclaimed fund", "tax sale excess", "former owner",
    "property owner", "excess amount", "claim form",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
}


def parse_county_directory(ts_file: str) -> list:
    """Parse county-directory.ts to extract county contact info."""
    counties = []
    with open(ts_file, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = r'\{\s*county:\s*"([^"]+)",\s*state:\s*"([^"]+)",\s*phone:\s*"([^"]*)",\s*email:\s*"([^"]*)",\s*website:\s*"([^"]*)"\s*\}'
    for m in re.finditer(pattern, content):
        counties.append({
            "county": m.group(1),
            "state": m.group(2),
            "phone": m.group(3),
            "email": m.group(4),
            "website": m.group(5),
        })

    return counties


def check_url(url: str, timeout: int = 10) -> dict:
    """Check if a URL exists and contains excess proceeds content."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            text = resp.text.lower()
            # Check for positive keywords
            matches = sum(1 for kw in POSITIVE_KEYWORDS if kw in text)
            if matches >= 2:
                return {"url": url, "status": 200, "matches": matches, "verified": True}
            elif matches >= 1:
                return {"url": url, "status": 200, "matches": matches, "verified": False}
        return {"url": url, "status": resp.status_code, "matches": 0, "verified": False}
    except requests.exceptions.RequestException:
        return {"url": url, "status": 0, "matches": 0, "verified": False}


def discover_county_url(county_info: dict) -> dict:
    """Try to find the excess proceeds URL for a county."""
    county = county_info["county"]
    state = county_info["state"]
    website = county_info.get("website", "")

    if not website or not website.startswith("http"):
        return None

    # Extract base domain from the website URL
    parsed = urlparse(website)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    results = []
    for pattern in URL_PATTERNS:
        test_url = base_url + pattern
        result = check_url(test_url, timeout=8)
        if result["verified"]:
            return {
                "county": county,
                "state": state,
                "url": result["url"],
                "matches": result["matches"],
                "base_website": website,
            }
        elif result["matches"] > 0:
            results.append(result)

    # Return best partial match if any
    if results:
        best = max(results, key=lambda r: r["matches"])
        return {
            "county": county,
            "state": state,
            "url": best["url"],
            "matches": best["matches"],
            "base_website": website,
            "partial": True,
        }

    return None


def main():
    parser = argparse.ArgumentParser(description="Discover county excess proceeds URLs")
    parser.add_argument("--county-dir", type=str,
                       default="/mnt/c/Users/flowc/Documents/foreclosure-leads-app/src/data/county-directory.ts")
    parser.add_argument("--state", type=str, help="Process only this state")
    parser.add_argument("--output", type=str, default="/tmp/discovered_urls.json")
    parser.add_argument("--threads", type=int, default=5)
    parser.add_argument("--limit", type=int, default=0)

    args = parser.parse_args()

    counties = parse_county_directory(args.county_dir)
    logger.info(f"Loaded {len(counties)} counties")

    # Filter to non-judicial states
    counties = [c for c in counties if c["state"] in NON_JUDICIAL]
    logger.info(f"Non-judicial counties: {len(counties)}")

    if args.state:
        counties = [c for c in counties if c["state"] == args.state.upper()]
        logger.info(f"Filtered to {args.state.upper()}: {len(counties)}")

    # Only counties with websites
    counties = [c for c in counties if c.get("website") and c["website"].startswith("http")]
    logger.info(f"Counties with websites: {len(counties)}")

    if args.limit:
        counties = counties[:args.limit]

    discovered = []
    partial = []

    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {executor.submit(discover_county_url, c): c for c in counties}
        done = 0
        for future in as_completed(futures):
            done += 1
            county_info = futures[future]
            if done % 20 == 0:
                logger.info(f"Progress: {done}/{len(counties)} ({len(discovered)} verified, {len(partial)} partial)")

            try:
                result = future.result()
                if result:
                    if result.get("partial"):
                        partial.append(result)
                    else:
                        discovered.append(result)
                        logger.info(f"  VERIFIED: {result['county']}, {result['state']} -> {result['url']}")
            except Exception as e:
                logger.error(f"Error for {county_info['county']}: {e}")

    # Save results
    output = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "verified": discovered,
        "partial": partial,
        "stats": {
            "total_checked": len(counties),
            "verified_count": len(discovered),
            "partial_count": len(partial),
        }
    }

    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)

    logger.info(f"\nResults saved to {args.output}")
    logger.info(f"Verified URLs: {len(discovered)}")
    logger.info(f"Partial matches: {len(partial)}")
    logger.info(f"Total checked: {len(counties)}")

    # Print verified URLs in scraper format
    if discovered:
        print("\n# Add these to KNOWN_GOVERNMENT_URLS:")
        for d in discovered:
            key = f"{d['county'].lower().replace(' ', '_').replace('-', '_')}_{d['state'].lower()}"
            key = re.sub(r'[^a-z0-9_]', '', key)
            print(f'    "{key}": {{')
            print(f'        "url": "{d["url"]}",')
            print(f'        "type": "html", "state": "{d["state"]}", "county": "{d["county"]}"')
            print(f'    }},')


if __name__ == "__main__":
    main()
