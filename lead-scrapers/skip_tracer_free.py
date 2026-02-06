#!/usr/bin/env python3
"""
Free Skip Tracing - Based on Foreclosure Academy Secrets

Uses FREE sources to find contact info:
1. TruePeopleSearch (truepeoplesearch.com) - primary
2. FastPeopleSearch (fastpeoplesearch.com) - backup
3. FindAGrave (findagrave.com) - for deceased owners

Finds: phone numbers, current address, relatives, associates

Usage:
    python skip_tracer_free.py --name "John Smith" --address "123 Main St" --state CA
    python skip_tracer_free.py --batch --limit 50

Environment:
    SUPABASE_URL, SUPABASE_SERVICE_KEY, TWOCAPTCHA_API_KEY
"""

import os
import re
import sys
import json
import time
import random
import logging
import argparse
from datetime import datetime, timezone
from urllib.parse import quote_plus, quote
from typing import Dict, List, Optional, Tuple, Any

import requests
from bs4 import BeautifulSoup

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://foreclosure-db.alwaysencrypted.com")
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
)
TWOCAPTCHA_API_KEY = os.getenv("TWOCAPTCHA_API_KEY", "8a0864545fcb5a34406bc9aa9af38288")
CRAWL4AI_URL = os.getenv("CRAWL4AI_URL", "https://crawl4ai.alwaysencrypted.com")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("skip_tracer")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }


def get_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    })
    return session


# ============================================================================
# TRUE PEOPLE SEARCH
# ============================================================================

def search_truepeoplesearch(name: str, city: str = None, state: str = None, address: str = None) -> Dict:
    """
    Search TruePeopleSearch.com for person info.

    Returns: {
        name, current_address, phone_numbers[], emails[],
        relatives[], associates[], previous_addresses[]
    }
    """
    result = {
        "source": "truepeoplesearch",
        "name": name,
        "current_address": None,
        "phone_numbers": [],
        "emails": [],
        "relatives": [],
        "associates": [],
        "previous_addresses": []
    }

    try:
        # First try name + location search
        search_url = build_tps_search_url(name, city, state)
        log.info(f"Searching TruePeopleSearch: {name}")

        # Use Crawl4AI to handle JavaScript rendering
        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={
                "urls": [search_url],
                "wait_for": "body",
                "js": True,
                "bypass_cache": True,
                "word_count_threshold": 50
            },
            timeout=60
        )

        if resp.status_code != 200:
            log.warning(f"Crawl4AI returned {resp.status_code}")
            return result

        data = resp.json()
        # Crawl4AI returns results array
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        if not html:
            log.warning("No HTML returned from Crawl4AI")
            return result

        soup = BeautifulSoup(html, "html.parser")

        # Check if we got search results or a profile page
        if "Search Results" in soup.get_text():
            # Multiple results - find the matching one
            result_links = soup.find_all("a", href=re.compile(r"/find/person/", re.I))

            for link in result_links:
                link_text = link.get_text(strip=True)
                if name.lower().split()[0] in link_text.lower():
                    # Match by first name at minimum
                    profile_url = "https://www.truepeoplesearch.com" + link.get("href")
                    result = scrape_tps_profile(profile_url, address)
                    break
        else:
            # Direct profile page
            result = parse_tps_profile(soup, address)

        return result

    except Exception as e:
        log.error(f"TruePeopleSearch error: {e}")
        return result


def build_tps_search_url(name: str, city: str = None, state: str = None) -> str:
    """Build TruePeopleSearch URL."""
    base = "https://www.truepeoplesearch.com/results"
    name_encoded = quote_plus(name)

    if city and state:
        return f"{base}?name={name_encoded}&citystatezip={quote_plus(city)}%2C+{state}"
    elif state:
        return f"{base}?name={name_encoded}&citystatezip={state}"
    else:
        return f"{base}?name={name_encoded}"


def scrape_tps_profile(profile_url: str, address_to_match: str = None) -> Dict:
    """Scrape a TruePeopleSearch profile page."""
    result = {
        "source": "truepeoplesearch",
        "current_address": None,
        "phone_numbers": [],
        "emails": [],
        "relatives": [],
        "associates": [],
        "previous_addresses": []
    }

    try:
        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={
                "urls": [profile_url],
                "wait_for": "body",
                "js": True,
                "bypass_cache": True
            },
            timeout=60
        )

        if resp.status_code != 200:
            return result

        data = resp.json()
        # Crawl4AI returns results array
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        soup = BeautifulSoup(html, "html.parser")
        return parse_tps_profile(soup, address_to_match)

    except Exception as e:
        log.error(f"TPS profile scrape error: {e}")
        return result


def parse_tps_profile(soup: BeautifulSoup, address_to_match: str = None) -> Dict:
    """Parse TruePeopleSearch profile page."""
    result = {
        "source": "truepeoplesearch",
        "name": "",
        "age": None,
        "current_address": None,
        "phone_numbers": [],
        "emails": [],
        "relatives": [],
        "associates": [],
        "previous_addresses": []
    }

    try:
        # Name
        name_elem = soup.find("h1", class_=re.compile(r"name", re.I))
        if name_elem:
            result["name"] = name_elem.get_text(strip=True)

        # Age
        age_elem = soup.find(text=re.compile(r"Age\s*\d+", re.I))
        if age_elem:
            age_match = re.search(r"Age\s*(\d+)", str(age_elem))
            if age_match:
                result["age"] = int(age_match.group(1))

        # Current Address
        addr_section = soup.find("div", class_=re.compile(r"current.?address", re.I))
        if addr_section:
            result["current_address"] = addr_section.get_text(strip=True)
        else:
            # Try finding address near "Lives in" or "Current Address"
            for label in ["Lives in", "Current Address", "Address"]:
                elem = soup.find(text=re.compile(label, re.I))
                if elem:
                    parent = elem.find_parent("div")
                    if parent:
                        result["current_address"] = parent.get_text(strip=True).replace(label, "").strip()
                        break

        # Phone Numbers
        phone_section = soup.find_all(text=re.compile(r"\(\d{3}\)\s*\d{3}-\d{4}"))
        for phone_text in phone_section:
            phone_match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", str(phone_text))
            if phone_match:
                phone = phone_match.group(0)
                # Check if wireless or landline
                parent_text = phone_text.find_parent().get_text() if phone_text.find_parent() else ""
                phone_type = "wireless" if "wireless" in parent_text.lower() else "landline"
                result["phone_numbers"].append({
                    "number": phone,
                    "type": phone_type
                })

        # Email Addresses
        email_pattern = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
        email_matches = soup.find_all(text=email_pattern)
        for email_text in email_matches:
            emails = email_pattern.findall(str(email_text))
            result["emails"].extend(emails)
        result["emails"] = list(set(result["emails"]))

        # Relatives
        relatives_section = soup.find(text=re.compile(r"Possible Relatives", re.I))
        if relatives_section:
            parent = relatives_section.find_parent("div")
            if parent:
                relative_links = parent.find_all("a")
                for link in relative_links[:10]:
                    rel_name = link.get_text(strip=True)
                    if rel_name and len(rel_name) > 3:
                        result["relatives"].append(rel_name)

        # Associates
        assoc_section = soup.find(text=re.compile(r"Possible Associates", re.I))
        if assoc_section:
            parent = assoc_section.find_parent("div")
            if parent:
                assoc_links = parent.find_all("a")
                for link in assoc_links[:10]:
                    assoc_name = link.get_text(strip=True)
                    if assoc_name and len(assoc_name) > 3:
                        result["associates"].append(assoc_name)

        # Previous Addresses
        prev_addr_section = soup.find(text=re.compile(r"Previous Addresses", re.I))
        if prev_addr_section:
            parent = prev_addr_section.find_parent("div")
            if parent:
                addr_items = parent.find_all("div", class_=re.compile(r"address", re.I))
                for addr in addr_items[:10]:
                    addr_text = addr.get_text(strip=True)
                    if addr_text:
                        result["previous_addresses"].append(addr_text)

        # Verify we found the right person by matching address
        if address_to_match:
            all_addresses = [result["current_address"]] + result["previous_addresses"]
            address_lower = address_to_match.lower()

            matched = False
            for addr in all_addresses:
                if addr and address_lower[:20] in addr.lower():
                    matched = True
                    break

            if not matched:
                log.warning(f"Address {address_to_match} not found in profile addresses")

        return result

    except Exception as e:
        log.error(f"TPS profile parse error: {e}")
        return result


# ============================================================================
# FAST PEOPLE SEARCH (Backup)
# ============================================================================

def search_fastpeoplesearch(name: str, city: str = None, state: str = None) -> Dict:
    """
    Search FastPeopleSearch.com as backup.
    Similar structure to TruePeopleSearch.
    """
    result = {
        "source": "fastpeoplesearch",
        "phone_numbers": [],
        "emails": [],
        "relatives": [],
        "current_address": None
    }

    try:
        name_encoded = quote_plus(name)
        if city and state:
            url = f"https://www.fastpeoplesearch.com/name/{name_encoded}_{city.replace(' ', '-')}_{state}"
        else:
            url = f"https://www.fastpeoplesearch.com/name/{name_encoded}"

        log.info(f"Searching FastPeopleSearch: {name}")

        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={
                "urls": [url],
                "word_count_threshold": 10,
                "bypass_cache": True
            },
            timeout=60
        )

        if resp.status_code != 200:
            return result

        data = resp.json()
        # Crawl4AI returns results array
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        soup = BeautifulSoup(html, "html.parser")

        # Similar parsing logic
        phone_pattern = re.compile(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
        for text in soup.find_all(text=phone_pattern):
            matches = phone_pattern.findall(str(text))
            for phone in matches:
                result["phone_numbers"].append({"number": phone, "type": "unknown"})

        email_pattern = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
        for text in soup.find_all(text=email_pattern):
            matches = email_pattern.findall(str(text))
            result["emails"].extend(matches)

        return result

    except Exception as e:
        log.error(f"FastPeopleSearch error: {e}")
        return result


# ============================================================================
# FIND A GRAVE (Deceased Owners)
# ============================================================================

def search_findagrave(name: str, state: str = None) -> Dict:
    """
    Search FindAGrave.com for deceased owner's relatives/heirs.
    """
    result = {
        "source": "findagrave",
        "deceased": False,
        "death_date": None,
        "relatives": [],
        "cemetery": None
    }

    try:
        # Build search URL
        name_encoded = quote_plus(name)
        url = f"https://www.findagrave.com/memorial/search?firstname={name_encoded.split('+')[0]}&lastname={name_encoded.split('+')[-1]}"

        if state:
            url += f"&stateid={get_state_id(state)}"

        log.info(f"Searching FindAGrave: {name}")

        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={
                "urls": [url],
                "word_count_threshold": 10,
                "bypass_cache": True
            },
            timeout=60
        )

        if resp.status_code != 200:
            return result

        data = resp.json()
        # Crawl4AI returns results array
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        soup = BeautifulSoup(html, "html.parser")

        # Check if we found results
        memorial_links = soup.find_all("a", href=re.compile(r"/memorial/\d+"))

        if memorial_links:
            result["deceased"] = True

            # Get first memorial details
            memorial_url = "https://www.findagrave.com" + memorial_links[0].get("href")

            # Scrape memorial page for relatives
            resp2 = requests.post(
                f"{CRAWL4AI_URL}/crawl",
                json={"urls": [memorial_url], "word_count_threshold": 10},
                timeout=60
            )

            if resp2.status_code == 200:
                mem_data = resp2.json()
                mem_results = mem_data.get("results", [])
                mem_html = mem_results[0].get("html", "") if mem_results else ""
                mem_soup = BeautifulSoup(mem_html, "html.parser")

                # Find family members
                family_section = mem_soup.find(text=re.compile(r"Family Members", re.I))
                if family_section:
                    parent = family_section.find_parent("section")
                    if parent:
                        family_links = parent.find_all("a")
                        for link in family_links[:10]:
                            rel_name = link.get_text(strip=True)
                            if rel_name and len(rel_name) > 3:
                                result["relatives"].append(rel_name)

        return result

    except Exception as e:
        log.error(f"FindAGrave error: {e}")
        return result


def get_state_id(state_abbr: str) -> str:
    """Get FindAGrave state ID from abbreviation."""
    state_ids = {
        "AL": "1", "AK": "2", "AZ": "3", "AR": "4", "CA": "5", "CO": "6",
        "CT": "7", "DE": "8", "FL": "9", "GA": "10", "HI": "11", "ID": "12",
        "IL": "13", "IN": "14", "IA": "15", "KS": "16", "KY": "17", "LA": "18",
        "ME": "19", "MD": "20", "MA": "21", "MI": "22", "MN": "23", "MS": "24",
        "MO": "25", "MT": "26", "NE": "27", "NV": "28", "NH": "29", "NJ": "30",
        "NM": "31", "NY": "32", "NC": "33", "ND": "34", "OH": "35", "OK": "36",
        "OR": "37", "PA": "38", "RI": "39", "SC": "40", "SD": "41", "TN": "42",
        "TX": "43", "UT": "44", "VT": "45", "VA": "46", "WA": "47", "WV": "48",
        "WI": "49", "WY": "50"
    }
    return state_ids.get(state_abbr.upper(), "")


# ============================================================================
# MAIN SKIP TRACE FUNCTION
# ============================================================================

def skip_trace(name: str, address: str = None, city: str = None, state: str = None) -> Dict:
    """
    Complete skip trace using all free sources.

    Returns combined results from TruePeopleSearch, FastPeopleSearch, and FindAGrave.
    """
    log.info(f"Skip tracing: {name}")

    combined = {
        "name": name,
        "current_address": None,
        "phone_numbers": [],
        "emails": [],
        "relatives": [],
        "associates": [],
        "previous_addresses": [],
        "deceased": False,
        "sources_used": []
    }

    # 1. Try TruePeopleSearch first
    tps_result = search_truepeoplesearch(name, city, state, address)

    if tps_result.get("phone_numbers") or tps_result.get("current_address"):
        combined["sources_used"].append("truepeoplesearch")
        combined["current_address"] = tps_result.get("current_address")
        combined["phone_numbers"].extend(tps_result.get("phone_numbers", []))
        combined["emails"].extend(tps_result.get("emails", []))
        combined["relatives"].extend(tps_result.get("relatives", []))
        combined["associates"].extend(tps_result.get("associates", []))
        combined["previous_addresses"].extend(tps_result.get("previous_addresses", []))
        combined["age"] = tps_result.get("age")

    # 2. If no results, try FastPeopleSearch
    if not combined["phone_numbers"] and not combined["current_address"]:
        fps_result = search_fastpeoplesearch(name, city, state)

        if fps_result.get("phone_numbers"):
            combined["sources_used"].append("fastpeoplesearch")
            combined["phone_numbers"].extend(fps_result.get("phone_numbers", []))
            combined["emails"].extend(fps_result.get("emails", []))
            combined["current_address"] = fps_result.get("current_address")
            combined["relatives"].extend(fps_result.get("relatives", []))

    # 3. If still no results, check if deceased
    if not combined["phone_numbers"] and not combined["current_address"]:
        grave_result = search_findagrave(name, state)

        if grave_result.get("deceased"):
            combined["sources_used"].append("findagrave")
            combined["deceased"] = True
            combined["relatives"].extend(grave_result.get("relatives", []))

    # Deduplicate
    combined["emails"] = list(set(combined["emails"]))
    combined["relatives"] = list(set(combined["relatives"]))
    combined["associates"] = list(set(combined["associates"]))
    combined["previous_addresses"] = list(set(combined["previous_addresses"]))

    # Deduplicate phone numbers by number
    seen_phones = set()
    unique_phones = []
    for p in combined["phone_numbers"]:
        num = re.sub(r"\D", "", p["number"])
        if num not in seen_phones:
            seen_phones.add(num)
            unique_phones.append(p)
    combined["phone_numbers"] = unique_phones

    log.info(f"  Found: {len(combined['phone_numbers'])} phones, {len(combined['emails'])} emails, "
             f"{len(combined['relatives'])} relatives")

    return combined


# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def fetch_leads_needing_skip_trace(limit: int = 50) -> List[Dict]:
    """Fetch leads without phone numbers."""
    url = (
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
        f"?primary_phone=is.null"
        f"&owner_name=not.is.null"
        f"&select=id,owner_name,property_address,city,state_abbr"
        f"&limit={limit}"
        f"&order=overage_amount.desc.nullslast"
    )

    resp = requests.get(url, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()


def update_lead_with_skip_trace(lead_id: str, trace_data: Dict, dry_run: bool = False) -> bool:
    """Update lead with skip trace results."""
    payload = {}

    # Primary phone
    if trace_data.get("phone_numbers"):
        phone = trace_data["phone_numbers"][0]
        payload["primary_phone"] = phone["number"]
        if len(trace_data["phone_numbers"]) > 1:
            payload["secondary_phone"] = trace_data["phone_numbers"][1]["number"]

    # Email
    if trace_data.get("emails"):
        payload["primary_email"] = trace_data["emails"][0]
        if len(trace_data["emails"]) > 1:
            payload["secondary_email"] = trace_data["emails"][1]

    # Current/mailing address
    if trace_data.get("current_address"):
        payload["mailing_address"] = trace_data["current_address"]

    # Store relatives in JSON field
    if trace_data.get("relatives"):
        payload["relatives"] = json.dumps(trace_data["relatives"][:10])

    # Mark as skip traced
    payload["skip_trace_status"] = "completed"
    payload["skip_trace_date"] = datetime.now(timezone.utc).isoformat()
    payload["enrichment_source"] = ",".join(trace_data.get("sources_used", ["free_skip_trace"]))

    if not payload:
        log.info(f"  No data to update for {lead_id[:8]}")
        return False

    if dry_run:
        log.info(f"  [DRY RUN] Would update {lead_id[:8]} with: {list(payload.keys())}")
        return True

    url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}"
    resp = requests.patch(url, json=payload, headers=supabase_headers(), timeout=30)

    return resp.status_code == 204


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Free skip tracing for foreclosure leads")
    parser.add_argument("--name", help="Person name to search")
    parser.add_argument("--address", help="Property address (to verify)")
    parser.add_argument("--city", help="City")
    parser.add_argument("--state", help="State abbreviation")
    parser.add_argument("--batch", action="store_true", help="Process leads from database")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    log.info(f"=== Free Skip Tracer started at {datetime.now(timezone.utc).isoformat()} ===")

    if args.name:
        # Single search
        result = skip_trace(args.name, args.address, args.city, args.state)
        print(json.dumps(result, indent=2))
        return 0

    if args.batch:
        # Batch process from database
        leads = fetch_leads_needing_skip_trace(args.limit)
        log.info(f"Found {len(leads)} leads needing skip trace")

        success = 0
        for i, lead in enumerate(leads):
            log.info(f"\nLead {i+1}/{len(leads)}: {lead['owner_name']}")

            result = skip_trace(
                name=lead["owner_name"],
                address=lead.get("property_address"),
                city=lead.get("city"),
                state=lead.get("state_abbr")
            )

            if result.get("phone_numbers") or result.get("emails"):
                if update_lead_with_skip_trace(lead["id"], result, args.dry_run):
                    success += 1

            # Rate limit
            time.sleep(random.uniform(2, 5))

        log.info(f"\n=== Completed: {success}/{len(leads)} leads updated ===")
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
