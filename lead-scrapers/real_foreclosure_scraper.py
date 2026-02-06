#!/usr/bin/env python3
"""
Real Foreclosure Lead Scraper - FREE Sources

Scrapes actual foreclosure data from:
1. County excess funds lists (tax sale overages)
2. auction.com (mortgage foreclosures)
3. Trustee websites (Judicial Sales Corp, Stox Quickbase)
4. County assessor sites (property details from parcel numbers)

Based on Foreclosure Academy methodology.

Usage:
    python real_foreclosure_scraper.py --source auction --state CA --limit 100
    python real_foreclosure_scraper.py --source county --county "Los Angeles" --state CA
    python real_foreclosure_scraper.py --source trustee --trustee judicial_sales

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
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import quote_plus, urlencode
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
log = logging.getLogger("real_foreclosure_scraper")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

# ============================================================================
# COUNTY EXCESS FUNDS SOURCES
# Search: "county name" + "excess funds" / "overbids" / "surplus funds"
# ============================================================================

COUNTY_EXCESS_FUNDS_URLS = {
    # Georgia - Aggregator with 158 counties
    "georgia_all": {
        "url": "https://www.ealbertlaw.com/blog/excess-funds-list-georgia-counties",
        "type": "aggregator"
    },
    "fulton_ga": {
        "url": "https://fultonassessor.org/wp-content/uploads/sites/50/2021/01/unclaimedfunds.pdf",
        "type": "pdf"
    },
    "gwinnett_ga": {
        "url": "https://www.gwinnetttaxcommissioner.com/property-tax/tax-sale-excess-funds",
        "type": "html_table"
    },
    "dekalb_ga": {
        "url": "https://www.dekalbcountyga.gov/tax-commissioner/excess-funds",
        "type": "html_table"
    },
    # California
    "los_angeles_ca": {
        "url": "https://ttc.lacounty.gov/excess-proceeds/",
        "type": "pdf_list"
    },
    "orange_ca": {
        "url": "https://www.ocgov.com/gov/ttc/proptax/excessproceeds",
        "type": "html_table"
    },
    "san_diego_ca": {
        "url": "https://www.sdttc.com/content/ttc/en/tax-collection/excess-proceeds.html",
        "type": "pdf_list"
    },
    # Florida
    "miami_dade_fl": {
        "url": "https://www.miamidade.gov/global/finance/taxdeeds/excess-funds.page",
        "type": "html_table"
    },
    "broward_fl": {
        "url": "https://www.broward.org/RecordsTaxesTreasury/ExcessFunds/Pages/default.aspx",
        "type": "html_table"
    },
    "hillsborough_fl": {
        "url": "https://www.hillsclerk.com/Records-and-Tax-Services/Tax-Deeds/Tax-Deed-Surplus",
        "type": "html_table"
    },
    # Texas
    "harris_tx": {
        "url": "https://www.hctx.net/constables/pct1/excessfunds.aspx",
        "type": "html_table"
    },
    "dallas_tx": {
        "url": "https://www.dallascounty.org/departments/tax/excess-proceeds.php",
        "type": "html_table"
    },
    # Arizona
    "maricopa_az": {
        "url": "https://treasurer.maricopa.gov/excess-proceeds/",
        "type": "html_table"
    },
    # Illinois
    "cook_il": {
        "url": "https://www.cookcountytreasurer.com/scavengersales.aspx",
        "type": "html_table"
    }
}


# ============================================================================
# TRUSTEE WEBSITES
# ============================================================================

TRUSTEE_SOURCES = {
    "judicial_sales_il": {
        "name": "The Judicial Sales Corporation",
        "url": "https://www.tjsc.com",
        "sales_url": "https://www.tjsc.com/Sales/CompletedSales",
        "states": ["IL"],
        "type": "trustee"
    },
    "stox_quickbase": {
        "name": "Stox Quickbase",
        "url": "https://cds.rfrk.com",
        "sales_url": "https://cds.rfrk.com/portal/ca",
        "states": ["CA", "AZ", "NV", "WA", "OR"],
        "type": "trustee"
    },
    "auction_com": {
        "name": "Auction.com",
        "url": "https://www.auction.com",
        "api_url": "https://www.auction.com/api/v2/search/foreclosure",
        "states": ["ALL"],
        "type": "marketplace"
    }
}


def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }


def get_session() -> requests.Session:
    """Create a session with random user agent."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    })
    return session


def solve_captcha(site_key: str, page_url: str, captcha_type: str = "recaptcha") -> Optional[str]:
    """Solve CAPTCHA using 2captcha API."""
    if not TWOCAPTCHA_API_KEY:
        log.warning("No 2captcha API key configured")
        return None

    try:
        # Submit captcha
        if captcha_type == "recaptcha":
            submit_url = f"http://2captcha.com/in.php?key={TWOCAPTCHA_API_KEY}&method=userrecaptcha&googlekey={site_key}&pageurl={page_url}&json=1"
        else:
            submit_url = f"http://2captcha.com/in.php?key={TWOCAPTCHA_API_KEY}&method=hcaptcha&sitekey={site_key}&pageurl={page_url}&json=1"

        resp = requests.get(submit_url, timeout=30)
        result = resp.json()

        if result.get("status") != 1:
            log.error(f"Captcha submit failed: {result}")
            return None

        captcha_id = result["request"]
        log.info(f"Captcha submitted, ID: {captcha_id}")

        # Poll for result
        for _ in range(30):  # Max 2.5 minutes
            time.sleep(5)
            result_url = f"http://2captcha.com/res.php?key={TWOCAPTCHA_API_KEY}&action=get&id={captcha_id}&json=1"
            resp = requests.get(result_url, timeout=30)
            result = resp.json()

            if result.get("status") == 1:
                log.info("Captcha solved successfully")
                return result["request"]
            elif result.get("request") != "CAPCHA_NOT_READY":
                log.error(f"Captcha solve failed: {result}")
                return None

        log.error("Captcha solve timeout")
        return None

    except Exception as e:
        log.error(f"Captcha error: {e}")
        return None


# ============================================================================
# AUCTION.COM SCRAPER
# ============================================================================

def scrape_auction_com(state: str, limit: int = 100) -> List[Dict]:
    """
    Scrape foreclosure listings from auction.com

    Returns completed/sold properties with third-party bidders (potential overages)
    """
    leads = []
    session = get_session()

    # auction.com API endpoint
    api_url = "https://www.auction.com/api/v2/search"

    params = {
        "assetTypes": "foreclosure",
        "state": state,
        "status": "sold",  # completed sales
        "sortField": "eventDate",
        "sortDir": "desc",
        "page": 1,
        "pageSize": min(limit, 50)
    }

    try:
        log.info(f"Fetching auction.com foreclosures for {state}...")

        # They may require different headers
        session.headers.update({
            "Accept": "application/json",
            "Referer": f"https://www.auction.com/residential/{state.lower()}/foreclosure/",
        })

        resp = session.get(api_url, params=params, timeout=30)

        if resp.status_code == 403:
            log.warning("auction.com blocked request, trying Crawl4AI...")
            return scrape_auction_com_via_crawl4ai(state, limit)

        resp.raise_for_status()
        data = resp.json()

        for item in data.get("results", [])[:limit]:
            # Only interested in third-party sales (not back to bank)
            if item.get("soldToBank", False):
                continue

            opening_bid = item.get("openingBid", 0)
            sale_price = item.get("salePrice", 0)

            if sale_price > opening_bid:
                overage = sale_price - opening_bid

                lead = {
                    "property_address": item.get("address", {}).get("street", ""),
                    "city": item.get("address", {}).get("city", ""),
                    "state": state,
                    "state_abbr": state,
                    "zip_code": item.get("address", {}).get("zip", ""),
                    "county": item.get("address", {}).get("county", ""),
                    "sale_date": item.get("eventDate"),
                    "sale_amount": sale_price,
                    "opening_bid": opening_bid,
                    "overage_amount": overage,
                    "foreclosure_type": "mortgage",
                    "trustee_name": item.get("trusteeName", ""),
                    "case_number": item.get("fileNumber", ""),
                    "source": "auction.com",
                    "source_url": f"https://www.auction.com/details/{item.get('id', '')}",
                    "lat": item.get("address", {}).get("latitude"),
                    "lng": item.get("address", {}).get("longitude"),
                }
                leads.append(lead)
                log.info(f"  Found: {lead['property_address']} - ${overage:,.0f} overage")

        log.info(f"Found {len(leads)} leads with overages from auction.com")
        return leads

    except Exception as e:
        log.error(f"auction.com scrape error: {e}")
        return []


def scrape_auction_com_via_crawl4ai(state: str, limit: int = 100) -> List[Dict]:
    """Scrape auction.com using Crawl4AI to bypass blocks."""
    leads = []

    url = f"https://www.auction.com/residential/{state.lower()}/foreclosure/?status=sold"

    try:
        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={
                "urls": [url],  # Crawl4AI requires array format
                "word_count_threshold": 10,
                "bypass_cache": True,
                "js_code": "window.scrollTo(0, document.body.scrollHeight);",
                "wait_for": "css:.property-card"
            },
            timeout=120
        )

        if resp.status_code == 200:
            data = resp.json()
            # Parse the extracted data
            extracted = data.get("result", {}).get("extracted_content", [])
            for item in extracted[:limit]:
                # Process and add to leads
                pass

    except Exception as e:
        log.error(f"Crawl4AI auction.com error: {e}")

    return leads


# ============================================================================
# COUNTY EXCESS FUNDS SCRAPER
# ============================================================================

def scrape_county_excess_funds(county_key: str) -> List[Dict]:
    """
    Scrape excess funds list from a county website.

    Returns list of tax sale overages with property info.
    """
    if county_key not in COUNTY_EXCESS_FUNDS_URLS:
        log.error(f"Unknown county: {county_key}")
        return []

    config = COUNTY_EXCESS_FUNDS_URLS[county_key]
    url = config["url"]
    page_type = config["type"]

    leads = []
    session = get_session()

    try:
        log.info(f"Scraping {county_key} excess funds from {url}")

        resp = session.get(url, timeout=30)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        if page_type == "html_table":
            leads = parse_html_table_excess_funds(soup, county_key)
        elif page_type == "pdf_list":
            # Find PDF links and download/parse them
            pdf_links = soup.find_all("a", href=re.compile(r"\.pdf", re.I))
            for link in pdf_links[:3]:  # Limit to recent PDFs
                pdf_url = link.get("href")
                if not pdf_url.startswith("http"):
                    pdf_url = url.rsplit("/", 1)[0] + "/" + pdf_url
                leads.extend(scrape_pdf_excess_funds(pdf_url, county_key))

        log.info(f"Found {len(leads)} excess funds leads from {county_key}")
        return leads

    except Exception as e:
        log.error(f"County excess funds scrape error: {e}")
        return []


def scrape_georgia_aggregator(limit: int = 20) -> List[Dict]:
    """
    Scrape the E. Albert Law Georgia Excess Funds aggregator page.
    This page links to 158 county excess funds lists.
    Extracts actual county government URLs (not anchor links).
    """
    leads = []
    url = "https://www.ealbertlaw.com/blog/excess-funds-list-georgia-counties"

    try:
        log.info("Scraping Georgia excess funds aggregator...")

        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={"urls": [url], "word_count_threshold": 5},
            timeout=120
        )

        if resp.status_code != 200:
            log.warning(f"Aggregator crawl failed: {resp.status_code}")
            return leads

        data = resp.json()
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        soup = BeautifulSoup(html, "html.parser")

        # Find actual county government links (not ealbertlaw.com anchors)
        # These are the real county excess funds pages
        county_links = []
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            # Skip internal anchors and ealbertlaw links
            if "ealbertlaw.com" in href or href.startswith("#"):
                continue
            # Look for government sites, county sites, or PDFs
            if any(domain in href.lower() for domain in [".gov", "county", ".pdf", "assessor", "clerk", "treasurer", "tax"]):
                county_name = link.get_text(strip=True)
                if county_name and len(county_name) > 2:
                    county_links.append((county_name, href))

        log.info(f"Found {len(county_links)} actual county URLs")

        seen_urls = set()
        processed = 0

        for county_name, href in county_links:
            if processed >= limit:
                break
            if href in seen_urls:
                continue
            seen_urls.add(href)

            log.info(f"  [{processed+1}/{min(limit, len(county_links))}] {county_name}: {href[:60]}...")

            if ".pdf" in href.lower():
                # PDF link - note for later processing
                leads.append({
                    "county": county_name,
                    "state": "Georgia",
                    "state_abbr": "GA",
                    "source": "georgia_aggregator",
                    "source_url": href,
                    "type": "pdf_link"
                })
                processed += 1
            else:
                # HTML page - try to scrape it
                county_leads = scrape_county_page_for_excess_funds(href, county_name)
                if county_leads:
                    leads.extend(county_leads)
                    processed += 1
                else:
                    # No data found, but record the source
                    leads.append({
                        "county": county_name,
                        "state": "Georgia",
                        "state_abbr": "GA",
                        "source": "georgia_county",
                        "source_url": href,
                        "type": "empty_page"
                    })
                    processed += 1

            # Rate limit
            time.sleep(random.uniform(0.5, 1.5))

        log.info(f"Found {len(leads)} items from Georgia aggregator")
        return leads

    except Exception as e:
        log.error(f"Georgia aggregator error: {e}")
        return leads


def scrape_county_page_for_excess_funds(url: str, county_name: str) -> List[Dict]:
    """Scrape a single county's excess funds page."""
    leads = []

    try:
        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={"urls": [url], "word_count_threshold": 5},
            timeout=60
        )

        if resp.status_code != 200:
            return leads

        data = resp.json()
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        soup = BeautifulSoup(html, "html.parser")

        # Look for tables or PDFs on this page
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")
            headers = []

            for row in rows:
                cells = row.find_all(["th", "td"])

                if not headers:
                    headers = [c.get_text(strip=True).lower() for c in cells]
                    continue

                if len(cells) >= 2:
                    data_row = {headers[i]: cells[i].get_text(strip=True)
                               for i in range(min(len(headers), len(cells)))}

                    lead = {
                        "property_address": data_row.get("property", data_row.get("address", "")),
                        "parcel_id": data_row.get("parcel", data_row.get("parcel number", "")),
                        "owner_name": data_row.get("owner", data_row.get("defendant", "")),
                        "overage_amount": parse_money(
                            data_row.get("excess", data_row.get("surplus", data_row.get("amount", "0")))
                        ),
                        "sale_date": data_row.get("sale date", data_row.get("date", "")),
                        "county": county_name,
                        "state": "Georgia",
                        "state_abbr": "GA",
                        "foreclosure_type": "tax_sale",
                        "source": "georgia_county",
                        "source_url": url,
                    }

                    if lead["overage_amount"] > 0 or lead["owner_name"]:
                        leads.append(lead)

        # Also check for PDF links on the page
        pdf_links = soup.find_all("a", href=re.compile(r"\.pdf", re.I))
        for pdf_link in pdf_links[:3]:
            pdf_url = pdf_link.get("href", "")
            if not pdf_url.startswith("http"):
                pdf_url = url.rsplit("/", 1)[0] + "/" + pdf_url
            leads.append({
                "county": county_name,
                "state_abbr": "GA",
                "source": "georgia_county_pdf",
                "source_url": pdf_url,
                "type": "pdf_link"
            })

    except Exception as e:
        log.debug(f"County page scrape error for {county_name}: {e}")

    return leads


def parse_html_table_excess_funds(soup: BeautifulSoup, county_key: str) -> List[Dict]:
    """Parse HTML table of excess funds."""
    leads = []

    # Find tables with excess funds data
    tables = soup.find_all("table")

    for table in tables:
        rows = table.find_all("tr")
        headers = []

        for row in rows:
            cells = row.find_all(["th", "td"])

            if not headers:
                headers = [c.get_text(strip=True).lower() for c in cells]
                continue

            if len(cells) >= 3:
                data = {headers[i]: cells[i].get_text(strip=True) for i in range(min(len(headers), len(cells)))}

                # Map common field names
                lead = {
                    "property_address": data.get("property address", data.get("address", data.get("property", ""))),
                    "parcel_id": data.get("parcel", data.get("parcel number", data.get("apn", ""))),
                    "owner_name": data.get("owner", data.get("owner name", data.get("defendant", ""))),
                    "overage_amount": parse_money(data.get("excess", data.get("surplus", data.get("amount", "0")))),
                    "sale_date": data.get("sale date", data.get("date", "")),
                    "case_number": data.get("case", data.get("case number", data.get("tax sale number", ""))),
                    "county": county_key.replace("_", " ").title().rsplit(" ", 1)[0],
                    "state_abbr": county_key.split("_")[-1].upper(),
                    "foreclosure_type": "tax_sale",
                    "source": f"county_{county_key}",
                }

                if lead["overage_amount"] > 0:
                    leads.append(lead)

    return leads


def scrape_pdf_excess_funds(pdf_url: str, county_key: str) -> List[Dict]:
    """Download and parse PDF excess funds list."""
    # This would require PyPDF2 or pdfplumber
    # For now, return empty - implement later
    log.info(f"PDF parsing not yet implemented: {pdf_url}")
    return []


def parse_money(text: str) -> float:
    """Parse money string to float."""
    if not text:
        return 0.0
    cleaned = re.sub(r"[^\d.]", "", str(text))
    try:
        return float(cleaned)
    except:
        return 0.0


# ============================================================================
# JUDICIAL SALES CORPORATION SCRAPER (Illinois)
# ============================================================================

def scrape_judicial_sales(limit: int = 100) -> List[Dict]:
    """
    Scrape completed foreclosure sales from The Judicial Sales Corporation.

    Illinois mortgage foreclosure trustee - covers Cook County and surrounding area.
    Table format: Sale ID, Case #, Law Firm, Address, City, County, ZIP, Sale Date, Sale Amount
    """
    leads = []
    session = get_session()

    base_url = "https://www.tjsc.com"
    sales_url = f"{base_url}/Sales/CompletedSales"

    try:
        log.info("Scraping Judicial Sales Corporation completed sales...")

        resp = session.get(sales_url, timeout=30)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Find the completed sales table
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")

            for row in rows[:limit]:
                cells = row.find_all("td")

                # Need at least 7 cells for valid data row
                if len(cells) < 7:
                    continue

                try:
                    # Extract data from cells
                    # Actual format: Date | Time | Sale ID | Case # | Law Firm | Address | City | County | ZIP | TBD | # | Sale Amount | empty | empty
                    sale_date = cells[0].get_text(strip=True) if len(cells) > 0 else ""
                    sale_time = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    sale_id = cells[2].get_text(strip=True) if len(cells) > 2 else ""
                    case_number = cells[3].get_text(strip=True) if len(cells) > 3 else ""
                    law_firm = cells[4].get_text(strip=True) if len(cells) > 4 else ""

                    # Address is in cell 5 (index 5), often in a link
                    address_cell = cells[5] if len(cells) > 5 else None
                    address = ""
                    if address_cell:
                        link = address_cell.find("a")
                        address = link.get_text(strip=True) if link else address_cell.get_text(strip=True)

                    city = cells[6].get_text(strip=True) if len(cells) > 6 else ""
                    county = cells[7].get_text(strip=True) if len(cells) > 7 else ""
                    zip_code = cells[8].get_text(strip=True) if len(cells) > 8 else ""

                    # Sale amount is in cell 11 (index 11)
                    sale_amount = 0
                    if len(cells) > 11:
                        sale_amount = parse_money(cells[11].get_text(strip=True))

                    # Skip if no valid address
                    if not address or not re.search(r"\d+.*(?:St|Ave|Dr|Rd|Blvd|Ln|Ct|Way|Pl|Ter|Cir)", address, re.I):
                        continue

                    lead = {
                        "property_address": address,
                        "city": city,
                        "county": county,
                        "state": "Illinois",
                        "state_abbr": "IL",
                        "zip_code": zip_code,
                        "case_number": case_number,
                        "sale_date": sale_date,
                        "sale_amount": sale_amount,
                        "foreclosure_type": "auction",  # Completed trustee sale
                        "trustee_name": law_firm or "The Judicial Sales Corporation",
                        "source": "judicial_sales_corp",
                        "source_url": sales_url,
                    }
                    leads.append(lead)
                    log.info(f"  Found: {address}, {city} {zip_code}")

                except Exception as e:
                    log.debug(f"Error parsing sale row: {e}")
                    continue

        log.info(f"Found {len(leads)} leads from Judicial Sales Corporation")
        return leads

    except Exception as e:
        log.error(f"Judicial Sales scrape error: {e}")
        return []


# ============================================================================
# STOX QUICKBASE SCRAPER (West Coast)
# ============================================================================

def scrape_stox_quickbase(state: str = "CA", limit: int = 100) -> List[Dict]:
    """
    Scrape foreclosure sales from Stox Quickbase (CDS).

    States: CA, AZ, NV, WA, OR
    """
    leads = []
    session = get_session()

    base_url = f"https://cds.rfrk.com/portal/{state.lower()}"

    try:
        log.info(f"Scraping Stox Quickbase for {state}...")

        resp = session.get(base_url, timeout=30)

        if resp.status_code != 200:
            log.warning(f"Stox Quickbase returned {resp.status_code}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")

        # Find the 60 days sales link
        sales_link = soup.find("a", text=re.compile(r"60 days", re.I))

        if sales_link:
            sales_url = sales_link.get("href")
            if not sales_url.startswith("http"):
                sales_url = "https://cds.rfrk.com" + sales_url

            resp = session.get(sales_url, timeout=30)
            soup = BeautifulSoup(resp.text, "html.parser")

        # Parse sales table
        table = soup.find("table")
        if table:
            rows = table.find_all("tr")[1:]  # Skip header

            for row in rows[:limit]:
                cells = row.find_all("td")
                if len(cells) >= 5:
                    # Check if sold to third party (not beneficiary)
                    result = cells[-1].get_text(strip=True).lower()
                    if "beneficiary" in result or "bank" in result:
                        continue

                    address = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    opening_bid = parse_money(cells[2].get_text()) if len(cells) > 2 else 0
                    sale_amount = parse_money(cells[3].get_text()) if len(cells) > 3 else 0

                    if sale_amount > opening_bid:
                        overage = sale_amount - opening_bid

                        lead = {
                            "property_address": address,
                            "state_abbr": state,
                            "opening_bid": opening_bid,
                            "sale_amount": sale_amount,
                            "overage_amount": overage,
                            "foreclosure_type": "mortgage",
                            "source": "stox_quickbase",
                        }
                        leads.append(lead)
                        log.info(f"  Found: {address} - ${overage:,.0f} overage")

        log.info(f"Found {len(leads)} leads from Stox Quickbase")
        return leads

    except Exception as e:
        log.error(f"Stox Quickbase scrape error: {e}")
        return []


# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def save_leads_to_db(leads: List[Dict], dry_run: bool = False) -> int:
    """Save scraped leads to database."""
    if not leads:
        return 0

    saved = 0

    for lead in leads:
        try:
            # Clean and prepare data (match existing DB schema)
            # Get values with fallbacks
            state_val = lead.get("state", "")
            state_abbr_val = lead.get("state_abbr", "")[:2] if lead.get("state_abbr") else ""
            county_val = lead.get("county", "")

            # Derive county from state if not provided (for IL it's usually Cook)
            if not county_val and state_abbr_val == "IL":
                county_val = "Cook"  # Default for Illinois - most foreclosures
            if not county_val and state_abbr_val == "GA":
                county_val = "Unknown"

            payload = {
                "id": str(uuid.uuid4()),  # Generate UUID for new record
                "property_address": lead.get("property_address", "Unknown")[:255],
                "city": lead.get("city", "Unknown")[:100],
                "state": state_val if state_val else "Unknown",
                "state_abbr": state_abbr_val if state_abbr_val else "XX",
                "zip_code": lead.get("zip_code", "00000")[:10],
                "county": county_val if county_val else None,  # Allow null
                "owner_name": lead.get("owner_name") or "Unknown Owner",  # Required NOT NULL
                "parcel_id": lead.get("parcel_id") or None,
                "sale_date": lead.get("sale_date"),
                "sale_amount": lead.get("sale_amount", 0) or 0,
                "overage_amount": lead.get("overage_amount", 0) or 0,
                # Valid types: pre-foreclosure, bank-owned, auction
                "foreclosure_type": lead.get("foreclosure_type", "auction"),
                "case_number": lead.get("case_number") or None,
                "trustee_name": lead.get("trustee_name") or None,
                "source": lead.get("source", "scraper"),
                "source_type": "county_surplus",  # DB uses source_type, not source_url
                "batch_id": f"batch-{datetime.now().strftime('%Y-%m-%d')}-surplus",
                "lat": lead.get("lat"),
                "lng": lead.get("lng"),
                "status": "new",
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None and v != ""}

            if dry_run:
                log.info(f"[DRY RUN] Would save: {payload.get('property_address')}")
                saved += 1
                continue

            # Insert to database (new record with UUID)
            url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
            headers = supabase_headers()
            headers["Prefer"] = "return=minimal"

            resp = requests.post(url, json=payload, headers=headers, timeout=30)

            if resp.status_code in (200, 201, 204):
                saved += 1
                log.debug(f"Saved: {payload.get('property_address')}")
            else:
                log.warning(f"Failed to save lead: {resp.status_code} - {resp.text[:300]}")

        except Exception as e:
            log.error(f"Error saving lead: {e}")

    return saved


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Scrape real foreclosure leads from free sources")
    parser.add_argument("--source", choices=["auction", "county", "trustee", "georgia", "all"], default="all")
    parser.add_argument("--state", default="CA", help="State abbreviation")
    parser.add_argument("--county", help="County key (e.g., los_angeles_ca)")
    parser.add_argument("--trustee", choices=["judicial_sales", "stox"], help="Trustee source")
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    log.info(f"=== Real Foreclosure Scraper started at {datetime.now(timezone.utc).isoformat()} ===")
    log.info(f"Source: {args.source}, State: {args.state}, Limit: {args.limit}")

    all_leads = []

    if args.source in ("georgia", "all"):
        leads = scrape_georgia_aggregator(limit=args.limit)
        all_leads.extend(leads)

    if args.source in ("auction", "all"):
        leads = scrape_auction_com(args.state, args.limit)
        all_leads.extend(leads)

    if args.source in ("county", "all"):
        if args.county:
            leads = scrape_county_excess_funds(args.county)
        else:
            # Scrape all counties for the state
            for county_key in COUNTY_EXCESS_FUNDS_URLS:
                if county_key.endswith(f"_{args.state.lower()}"):
                    leads = scrape_county_excess_funds(county_key)
                    all_leads.extend(leads)

    if args.source in ("trustee", "all"):
        if args.trustee == "judicial_sales" or args.source == "all":
            leads = scrape_judicial_sales(args.limit)
            all_leads.extend(leads)

        if args.trustee == "stox" or args.source == "all":
            leads = scrape_stox_quickbase(args.state, args.limit)
            all_leads.extend(leads)

    log.info(f"\n=== Total leads found: {len(all_leads)} ===")

    if all_leads:
        saved = save_leads_to_db(all_leads, args.dry_run)
        log.info(f"Saved {saved} leads to database")

    return len(all_leads)


if __name__ == "__main__":
    sys.exit(0 if main() > 0 else 1)
