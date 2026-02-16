#!/usr/bin/env python3
"""
crawl4ai scraper for all 3 partnership lead pipelines.

Targets the top 10 foreclosure cities:
  Lakeland FL, Columbia SC, Chico CA, Cleveland OH, Ocala FL,
  Las Vegas NV, Jacksonville FL, Houston TX, Orlando FL, Miami FL

Scrapes:
  1. Title companies (foreclosure closings)
  2. Real estate investors (buy foreclosures)
  3. Attorneys (bankruptcy / foreclosure)

Inserts into Supabase via REST API (service_role key).

Usage:
  python3 scripts/crawl4ai_scrape_all.py --pipeline title
  python3 scripts/crawl4ai_scrape_all.py --pipeline investor
  python3 scripts/crawl4ai_scrape_all.py --pipeline attorney
  python3 scripts/crawl4ai_scrape_all.py --pipeline all
"""

import asyncio
import argparse
import json
import re
import os
import sys
from datetime import datetime, timezone
from urllib.parse import quote_plus

import httpx
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import LLMExtractionStrategy, JsonCssExtractionStrategy

# ── Supabase config ──────────────────────────────────────────
SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://foreclosure-db.alwaysencrypted.com"
)
SUPABASE_SERVICE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
)

# ── Target cities ────────────────────────────────────────────
CITIES = [
    {"city": "Lakeland",     "state": "Florida",      "abbr": "FL"},
    {"city": "Columbia",     "state": "South Carolina","abbr": "SC"},
    {"city": "Chico",        "state": "California",   "abbr": "CA"},
    {"city": "Cleveland",    "state": "Ohio",          "abbr": "OH"},
    {"city": "Ocala",        "state": "Florida",       "abbr": "FL"},
    {"city": "Las Vegas",    "state": "Nevada",        "abbr": "NV"},
    {"city": "Jacksonville", "state": "Florida",       "abbr": "FL"},
    {"city": "Houston",      "state": "Texas",         "abbr": "TX"},
    {"city": "Orlando",      "state": "Florida",       "abbr": "FL"},
    {"city": "Miami",        "state": "Florida",       "abbr": "FL"},
]

# ── Search queries per pipeline ──────────────────────────────
TITLE_QUERIES = [
    'title company foreclosure closings {city} {state}',
    'title insurance company near {city} {abbr}',
    'foreclosure title services {city} {state}',
    'title settlement company {city} {abbr}',
]

INVESTOR_QUERIES = [
    'real estate investor buys foreclosures {city} {state}',
    'we buy houses {city} {abbr}',
    'cash home buyer foreclosure {city} {state}',
    'real estate investment company {city} {abbr}',
    'wholesale real estate {city} {state}',
]

ATTORNEY_QUERIES = [
    'foreclosure attorney {city} {state}',
    'bankruptcy lawyer {city} {abbr}',
    'foreclosure defense attorney {city} {state}',
    'real estate attorney foreclosure {city} {abbr}',
]

# ── Helpers ──────────────────────────────────────────────────

def clean_phone(raw: str) -> str:
    """Extract 10-digit US phone from messy text."""
    if not raw:
        return ""
    digits = re.sub(r'\D', '', raw)
    if len(digits) == 11 and digits.startswith('1'):
        digits = digits[1:]
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return ""


def clean_email(raw: str) -> str:
    """Extract a valid-looking email from text."""
    if not raw:
        return ""
    match = re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', raw)
    return match.group(0).lower() if match else ""


def clean_url(raw: str) -> str:
    """Normalize website URL."""
    if not raw:
        return ""
    url = raw.strip()
    if not url.startswith("http"):
        url = "https://" + url
    return url


async def insert_to_supabase(table: str, rows: list[dict]) -> int:
    """Insert rows into Supabase via REST API. Returns count inserted."""
    if not rows:
        return 0

    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    inserted = 0
    async with httpx.AsyncClient(timeout=30) as client:
        # Batch in groups of 50
        for i in range(0, len(rows), 50):
            batch = rows[i:i+50]
            resp = await client.post(url, headers=headers, json=batch)
            if resp.status_code in (200, 201):
                inserted += len(batch)
            else:
                print(f"  [WARN] Supabase insert error ({resp.status_code}): {resp.text[:200]}")

    return inserted


async def check_existing(table: str, field: str, values: list[str]) -> set:
    """Check which values already exist in the table to avoid duplicates."""
    if not values:
        return set()

    existing = set()
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={field}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            existing = {row[field].lower() for row in data if row.get(field)}

    return existing


# ── DuckDuckGo search + crawl ────────────────────────────────

async def search_web(query: str, crawler: AsyncWebCrawler) -> list[str]:
    """Use crawl4ai to search DuckDuckGo HTML and extract result URLs."""
    encoded = quote_plus(query)
    search_url = f"https://html.duckduckgo.com/html/?q={encoded}"

    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        page_timeout=15000,
    )

    try:
        result = await crawler.arun(url=search_url, config=config)
        if not result.success:
            return []

        urls = []
        html = result.html or ""

        # DDG HTML uses class="result__a" with uddg redirect param
        from urllib.parse import unquote
        for match in re.finditer(r'class="result__a"[^>]*href="([^"]+)"', html):
            raw_url = match.group(1)
            # Extract actual URL from DDG redirect
            actual = re.search(r'uddg=([^&]+)', raw_url)
            if actual:
                raw_url = unquote(actual.group(1))
            if raw_url.startswith("http") and raw_url not in urls:
                # Skip social media, directories we handle separately
                if any(skip in raw_url for skip in [
                    'facebook.com', 'twitter.com', 'instagram.com',
                    'linkedin.com/company', 'pinterest.com',
                    'yelp.com', 'bbb.org', 'yellowpages.com',
                    'mapquest.com', 'tripadvisor.com',
                ]):
                    continue
                urls.append(raw_url)

        return urls[:12]
    except Exception as e:
        print(f"  [ERR] Search failed: {e}")
        return []


def _extract_from_text(text: str, html: str) -> dict:
    """Pull phone, email, address, and name from raw text/html."""
    # Extract phone numbers
    phones = re.findall(r'[\(]?\d{3}[\)\-.\s]?\s*\d{3}[\-.\s]\d{4}', text)
    phone = clean_phone(phones[0]) if phones else ""

    # Extract emails
    emails = re.findall(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)
    emails = [e for e in emails if not any(skip in e.lower() for skip in [
        'example.com', 'sentry.io', 'wixpress', 'googleapis',
        'schema.org', 'noreply', 'no-reply', '.png', '.jpg', '.svg',
        'wix.com', 'squarespace', 'wordpress',
    ])]
    email = clean_email(emails[0]) if emails else ""

    # Extract address
    addr_patterns = re.findall(
        r'\d{1,5}\s+[A-Z][a-zA-Z\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Way|Ct|Court|Pkwy|Parkway|Pl|Place|Suite|Ste)[.,\s]',
        text
    )
    address = addr_patterns[0].strip().rstrip('.,') if addr_patterns else ""

    # Extract business name from <title>
    name = ""
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.I)
    if title_match:
        name = title_match.group(1).strip()
        for suffix in [' - Home', ' | Home', ' - About', ' | About',
                       ' - Google', '- Google', ' - Contact', ' | Contact']:
            name = name.replace(suffix, '')
        name = name.strip()[:100]

    return {"name": name, "phone": phone, "email": email, "address": address}


async def extract_contact_info(url: str, crawler: AsyncWebCrawler) -> dict | None:
    """Crawl a business page and extract contact info.
    If no phone/email found on main page, also tries /contact."""
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        page_timeout=12000,
        word_count_threshold=10,
    )

    try:
        result = await crawler.arun(url=url, config=config)
        if not result.success or not result.markdown:
            return None

        text = result.markdown[:8000]
        html = (result.html or "")[:15000]
        info = _extract_from_text(text, html)

        # If no phone AND no email, try the /contact page
        if not info["phone"] and not info["email"]:
            # Find contact page link in html
            contact_url = None
            for pattern in [
                r'href="(/contact[^"]*)"',
                r'href="(/about[^"]*)"',
                r'href="(https?://[^"]*contact[^"]*)"',
            ]:
                m = re.search(pattern, html, re.I)
                if m:
                    found = m.group(1)
                    if found.startswith("/"):
                        # Build absolute URL
                        from urllib.parse import urlparse
                        parsed = urlparse(url)
                        contact_url = f"{parsed.scheme}://{parsed.netloc}{found}"
                    else:
                        contact_url = found
                    break

            # Fallback: try common /contact path
            if not contact_url:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                contact_url = f"{parsed.scheme}://{parsed.netloc}/contact"

            try:
                contact_result = await crawler.arun(url=contact_url, config=config)
                if contact_result.success and contact_result.markdown:
                    c_text = contact_result.markdown[:8000]
                    c_html = (contact_result.html or "")[:15000]
                    c_info = _extract_from_text(c_text, c_html)
                    # Merge contact info
                    if c_info["phone"]:
                        info["phone"] = c_info["phone"]
                    if c_info["email"]:
                        info["email"] = c_info["email"]
                    if c_info["address"] and not info["address"]:
                        info["address"] = c_info["address"]
            except Exception:
                pass

        if not info["name"] and not info["phone"] and not info["email"]:
            return None

        return {
            "name": info["name"],
            "phone": info["phone"],
            "email": info["email"],
            "website": url,
            "address": info["address"],
        }
    except Exception as e:
        print(f"  [ERR] Crawl failed {url[:60]}: {e}")
        return None


# ── Pipeline scrapers ────────────────────────────────────────

async def scrape_title_companies(crawler: AsyncWebCrawler):
    """Scrape title companies across target cities."""
    print("\n=== TITLE COMPANY PIPELINE ===")
    table = "title_company_leads"

    # Check existing to avoid duplicates
    existing_websites = await check_existing(table, "website", [])

    all_leads = []

    for city_info in CITIES:
        city = city_info["city"]
        state = city_info["state"]
        abbr = city_info["abbr"]
        print(f"\n  Searching: {city}, {abbr}")

        for query_template in TITLE_QUERIES:
            query = query_template.format(city=city, state=state, abbr=abbr)
            urls = await search_web(query, crawler)
            print(f"    Query: {query[:50]}... -> {len(urls)} URLs")

            for url in urls:
                if url.lower() in existing_websites:
                    continue

                info = await extract_contact_info(url, crawler)
                if not info:
                    continue

                # Must have at least a name and one contact method
                if not info["name"] or (not info["phone"] and not info["email"]):
                    continue

                lead = {
                    "company_name": info["name"],
                    "contact_name": "",
                    "email": info["email"],
                    "phone": info["phone"],
                    "website": info["website"],
                    "address": info["address"],
                    "city": city,
                    "state": state,
                    "state_abbr": abbr,
                    "specialty": "foreclosure closings",
                    "source": f"crawl4ai-{city.lower().replace(' ', '-')}",
                    "status": "new",
                }

                all_leads.append(lead)
                existing_websites.add(url.lower())
                print(f"      + {info['name'][:40]} | {info['phone']} | {info['email']}")

            # Rate limit between queries
            await asyncio.sleep(2)

    # Deduplicate by website
    seen = set()
    unique_leads = []
    for lead in all_leads:
        key = lead["website"].lower()
        if key not in seen:
            seen.add(key)
            unique_leads.append(lead)

    print(f"\n  Total unique title leads: {len(unique_leads)}")

    if unique_leads:
        inserted = await insert_to_supabase(table, unique_leads)
        print(f"  Inserted into DB: {inserted}")

    return unique_leads


async def scrape_real_estate_investors(crawler: AsyncWebCrawler):
    """Scrape real estate investors across target cities."""
    print("\n=== REAL ESTATE INVESTOR PIPELINE ===")
    table = "real_estate_investor_leads"

    existing_websites = await check_existing(table, "website", [])

    all_leads = []

    for city_info in CITIES:
        city = city_info["city"]
        state = city_info["state"]
        abbr = city_info["abbr"]
        print(f"\n  Searching: {city}, {abbr}")

        for query_template in INVESTOR_QUERIES:
            query = query_template.format(city=city, state=state, abbr=abbr)
            urls = await search_web(query, crawler)
            print(f"    Query: {query[:50]}... -> {len(urls)} URLs")

            for url in urls:
                if url.lower() in existing_websites:
                    continue

                info = await extract_contact_info(url, crawler)
                if not info:
                    continue

                if not info["name"] or (not info["phone"] and not info["email"]):
                    continue

                # Determine investor type from URL/name
                investor_type = "general"
                name_lower = info["name"].lower()
                if any(w in name_lower for w in ["wholesale", "flip"]):
                    investor_type = "wholesaler"
                elif any(w in name_lower for w in ["buy house", "cash buyer", "we buy"]):
                    investor_type = "cash_buyer"
                elif any(w in name_lower for w in ["invest", "capital", "fund", "equity"]):
                    investor_type = "investment_company"

                lead = {
                    "investor_name": info["name"],
                    "company_name": info["name"],
                    "email": info["email"],
                    "phone": info["phone"],
                    "website": info["website"],
                    "address": info["address"],
                    "city": city,
                    "state": state,
                    "state_abbr": abbr,
                    "investor_type": investor_type,
                    "source": f"crawl4ai-{city.lower().replace(' ', '-')}",
                    "status": "new",
                }

                all_leads.append(lead)
                existing_websites.add(url.lower())
                print(f"      + {info['name'][:40]} | {info['phone']} | {info['email']}")

            await asyncio.sleep(2)

    seen = set()
    unique_leads = []
    for lead in all_leads:
        key = lead["website"].lower()
        if key not in seen:
            seen.add(key)
            unique_leads.append(lead)

    print(f"\n  Total unique investor leads: {len(unique_leads)}")

    if unique_leads:
        inserted = await insert_to_supabase(table, unique_leads)
        print(f"  Inserted into DB: {inserted}")

    return unique_leads


async def scrape_attorneys(crawler: AsyncWebCrawler):
    """Scrape foreclosure/bankruptcy attorneys across target cities."""
    print("\n=== ATTORNEY PIPELINE ===")
    table = "attorney_leads"

    existing_websites = await check_existing(table, "website", [])

    all_leads = []

    for city_info in CITIES:
        city = city_info["city"]
        state = city_info["state"]
        abbr = city_info["abbr"]
        print(f"\n  Searching: {city}, {abbr}")

        for query_template in ATTORNEY_QUERIES:
            query = query_template.format(city=city, state=state, abbr=abbr)
            urls = await search_web(query, crawler)
            print(f"    Query: {query[:50]}... -> {len(urls)} URLs")

            for url in urls:
                if url.lower() in existing_websites:
                    continue

                info = await extract_contact_info(url, crawler)
                if not info:
                    continue

                if not info["name"] or (not info["phone"] and not info["email"]):
                    continue

                # Determine practice area
                practice_areas = "foreclosure"
                name_lower = info["name"].lower()
                if "bankruptcy" in name_lower:
                    practice_areas = "bankruptcy, foreclosure"
                elif "real estate" in name_lower:
                    practice_areas = "real estate, foreclosure"
                elif "defense" in name_lower:
                    practice_areas = "foreclosure defense"

                lead = {
                    "attorney_name": info["name"],
                    "firm_name": info["name"],
                    "email": info["email"],
                    "phone": info["phone"],
                    "website": info["website"],
                    "address": info["address"],
                    "city": city,
                    "state": state,
                    "state_abbr": abbr,
                    "practice_areas": practice_areas,
                    "source": f"crawl4ai-{city.lower().replace(' ', '-')}",
                    "status": "new",
                }

                all_leads.append(lead)
                existing_websites.add(url.lower())
                print(f"      + {info['name'][:40]} | {info['phone']} | {info['email']}")

            await asyncio.sleep(2)

    seen = set()
    unique_leads = []
    for lead in all_leads:
        key = lead["website"].lower()
        if key not in seen:
            seen.add(key)
            unique_leads.append(lead)

    print(f"\n  Total unique attorney leads: {len(unique_leads)}")

    if unique_leads:
        inserted = await insert_to_supabase(table, unique_leads)
        print(f"  Inserted into DB: {inserted}")

    return unique_leads


# ── Directory scrapers (higher quality, structured data) ─────

async def scrape_directory_page(url: str, crawler: AsyncWebCrawler) -> list[dict]:
    """Scrape a directory/listing page for multiple business entries."""
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        page_timeout=15000,
    )

    try:
        result = await crawler.arun(url=url, config=config)
        if not result.success:
            return []

        text = result.markdown or ""
        entries = []

        # Look for structured business entries
        # Common patterns: name + phone + address blocks
        blocks = re.split(r'\n(?=#{1,3}\s|\*\*[A-Z])', text)

        for block in blocks:
            if len(block) < 30:
                continue

            phones = re.findall(r'[\(]?\d{3}[\)\-.\s]?\s*\d{3}[\-.\s]\d{4}', block)
            emails = re.findall(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', block)
            emails = [e for e in emails if 'example.com' not in e.lower()]

            if not phones and not emails:
                continue

            # Try to extract name from bold text or heading
            name_match = re.search(r'(?:#{1,3}\s*|\*\*)(.*?)(?:\*\*|\n)', block)
            name = name_match.group(1).strip() if name_match else ""

            if name and (phones or emails):
                entries.append({
                    "name": name[:100],
                    "phone": clean_phone(phones[0]) if phones else "",
                    "email": clean_email(emails[0]) if emails else "",
                })

        return entries
    except Exception:
        return []


# Directory URLs for bulk scraping
TITLE_DIRECTORIES = [
    "https://www.yelp.com/search?find_desc=title+company&find_loc={city}%2C+{abbr}",
    "https://www.bbb.org/search?find_text=title+company&find_loc={city}%2C+{abbr}",
]

INVESTOR_DIRECTORIES = [
    "https://www.biggerpockets.com/member-search?utf8=%E2%9C%93&location={city}%2C+{abbr}",
    "https://www.yelp.com/search?find_desc=we+buy+houses&find_loc={city}%2C+{abbr}",
]

ATTORNEY_DIRECTORIES = [
    "https://www.avvo.com/search/lawyer_search?q=foreclosure&loc={city}%2C+{abbr}",
    "https://www.justia.com/lawyers/{state_lower}/foreclosure-law",
    "https://www.martindale.com/results?term=foreclosure&loc={city}%2C+{abbr}",
]


async def scrape_directories(pipeline: str, crawler: AsyncWebCrawler):
    """Scrape directory sites for structured business listings."""
    print(f"\n--- Scraping directories for: {pipeline} ---")

    if pipeline == "title":
        dirs = TITLE_DIRECTORIES
        table = "title_company_leads"
    elif pipeline == "investor":
        dirs = INVESTOR_DIRECTORIES
        table = "real_estate_investor_leads"
    else:
        dirs = ATTORNEY_DIRECTORIES
        table = "attorney_leads"

    total_from_dirs = 0

    for city_info in CITIES:
        city = city_info["city"]
        state = city_info["state"]
        abbr = city_info["abbr"]

        for dir_template in dirs:
            dir_url = dir_template.format(
                city=city,
                state=state,
                abbr=abbr,
                state_lower=state.lower().replace(' ', '-'),
            )

            entries = await scrape_directory_page(dir_url, crawler)
            if entries:
                leads = []
                for entry in entries:
                    if pipeline == "title":
                        leads.append({
                            "company_name": entry["name"],
                            "email": entry["email"],
                            "phone": entry["phone"],
                            "city": city,
                            "state": state,
                            "state_abbr": abbr,
                            "source": f"directory-{city.lower().replace(' ', '-')}",
                            "status": "new",
                        })
                    elif pipeline == "investor":
                        leads.append({
                            "investor_name": entry["name"],
                            "company_name": entry["name"],
                            "email": entry["email"],
                            "phone": entry["phone"],
                            "city": city,
                            "state": state,
                            "state_abbr": abbr,
                            "source": f"directory-{city.lower().replace(' ', '-')}",
                            "status": "new",
                        })
                    else:
                        leads.append({
                            "attorney_name": entry["name"],
                            "firm_name": entry["name"],
                            "email": entry["email"],
                            "phone": entry["phone"],
                            "city": city,
                            "state": state,
                            "state_abbr": abbr,
                            "practice_areas": "foreclosure",
                            "source": f"directory-{city.lower().replace(' ', '-')}",
                            "status": "new",
                        })

                if leads:
                    inserted = await insert_to_supabase(table, leads)
                    total_from_dirs += inserted
                    print(f"    {city}, {abbr} | {dir_url[:50]}... -> {len(entries)} entries, {inserted} inserted")

            await asyncio.sleep(3)

    print(f"  Total from directories: {total_from_dirs}")
    return total_from_dirs


# ── Main ─────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="crawl4ai partnership lead scraper")
    parser.add_argument(
        "--pipeline",
        choices=["title", "investor", "attorney", "all"],
        default="all",
        help="Which pipeline to scrape",
    )
    parser.add_argument(
        "--directories-only",
        action="store_true",
        help="Only scrape directory sites (faster, more structured)",
    )
    args = parser.parse_args()

    print(f"crawl4ai Partnership Lead Scraper")
    print(f"Pipeline: {args.pipeline}")
    print(f"Target cities: {len(CITIES)}")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")

    async with AsyncWebCrawler(
        headless=True,
        verbose=False,
    ) as crawler:
        if args.pipeline in ("title", "all"):
            if not args.directories_only:
                await scrape_title_companies(crawler)
            await scrape_directories("title", crawler)

        if args.pipeline in ("investor", "all"):
            if not args.directories_only:
                await scrape_real_estate_investors(crawler)
            await scrape_directories("investor", crawler)

        if args.pipeline in ("attorney", "all"):
            if not args.directories_only:
                await scrape_attorneys(crawler)
            await scrape_directories("attorney", crawler)

    print(f"\nCompleted: {datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    asyncio.run(main())
