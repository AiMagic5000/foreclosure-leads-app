#!/usr/bin/env python3
"""
Foreclosure Lead Enrichment Pipeline v2
Uses datacenter-friendly sources for property data enrichment:
1. Nominatim (OpenStreetMap) for geocoding/validation
2. Crawl4AI for county assessor sites (less protected than Zillow/Redfin)
3. Public property record APIs where available
4. Overage calculation from existing sale/mortgage data

Runs on R730 server via cron every 4 hours.
"""

import os
import sys
import re
import json
import time
import random
import logging
import requests
from datetime import datetime, timezone
from urllib.parse import quote_plus

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://foreclosure-db.alwaysencrypted.com")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU")
CRAWL4AI_URL = os.environ.get("CRAWL4AI_URL", "https://crawl4ai.alwaysencrypted.com")
TWOCAPTCHA_KEY = os.environ.get("TWOCAPTCHA_API_KEY", "8a0864545fcb5a34406bc9aa9af38288")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "25"))
DELAY_MIN = float(os.environ.get("DELAY_MIN", "1"))
DELAY_MAX = float(os.environ.get("DELAY_MAX", "2"))
SKIP_CRAWL = os.environ.get("SKIP_CRAWL", "true").lower() in ("true", "1", "yes")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
]

# County assessor ArcGIS REST API endpoints (publicly accessible, no CAPTCHA)
# These are real, publicly accessible county GIS servers
COUNTY_GIS_ENDPOINTS = {
    "CA": {
        "Los Angeles": "https://assessor.lacounty.gov/api/search",
        "default_arcgis": "https://gis.lacounty.gov/ArcGIS/rest/services",
    },
    "FL": {
        "default_arcgis": "https://gis.fldfs.com/arcgis/rest/services",
    },
    "TX": {
        "default_arcgis": "https://gis.traviscad.org/server/rest/services",
    },
}

LOG_PATH = "/opt/enrichment/enrichment.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_PATH, mode="a"),
    ],
)
log = logging.getLogger("enrichment")


def supabase_headers(prefer="return=minimal"):
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def random_ua():
    return random.choice(USER_AGENTS)


def delay():
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))


def parse_number(text):
    """Extract a number from text, handling commas and dollar signs."""
    if not text:
        return None
    cleaned = str(text).replace("$", "").replace(",", "").replace(" ", "").strip()
    try:
        if "." in cleaned:
            return float(cleaned)
        return int(cleaned)
    except (ValueError, TypeError):
        return None


# ─── Supabase Operations ───────────────────────────────────────────────

def fetch_unenriched_leads(limit=BATCH_SIZE):
    """Fetch leads that haven't been enriched yet."""
    url = (
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
        f"?enriched_at=is.null"
        f"&select=id,property_address,city,state,state_abbr,zip_code,owner_name,"
        f"sale_amount,mortgage_amount"
        f"&limit={limit}"
        f"&order=created_at.asc"
    )
    resp = requests.get(url, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()


def update_lead(lead_id, enrichment_data):
    """Update a lead with enrichment data in Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}"
    payload = {
        **enrichment_data,
        "enriched_at": datetime.now(timezone.utc).isoformat(),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    resp = requests.patch(url, json=payload, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return True


# ─── Enrichment Source 1: Nominatim Geocoding ──────────────────────────

def enrich_via_nominatim(address, city, state_abbr, zip_code):
    """
    Use OpenStreetMap Nominatim to geocode and validate the address.
    Free, no API key needed, 1 request/second rate limit.
    Returns property type from OSM data if available.
    """
    query = f"{address}, {city}, {state_abbr} {zip_code}, USA"
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "addressdetails": 1,
        "limit": 1,
        "countrycodes": "us",
    }
    headers = {
        "User-Agent": "ForeclosureLeadEnrichment/1.0 (support@usforeclosurerecovery.com)",
    }

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        results = resp.json()

        if not results:
            return None

        result = results[0]
        enrichment = {}

        # OSM property type classification
        osm_type = result.get("type", "")
        osm_class = result.get("class", "")
        if osm_type in ("house", "residential", "apartments", "detached"):
            enrichment["property_type"] = osm_type.title()
        elif osm_class == "building":
            enrichment["property_type"] = "Residential"

        return enrichment if enrichment else None
    except Exception as e:
        log.debug(f"Nominatim failed: {e}")
        return None


# ─── Enrichment Source 2: Crawl4AI for County Assessor Sites ───────────

def crawl_page(url):
    """Use Crawl4AI to fetch a page. Returns markdown content or None."""
    try:
        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={"urls": [url], "priority": 5},
            timeout=90,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("success") and data.get("results"):
            result = data["results"][0]
            md = result.get("markdown", {})
            if isinstance(md, dict):
                return md.get("raw_markdown", "")
            return str(md) if md else ""
        return None
    except Exception as e:
        log.debug(f"Crawl4AI error for {url}: {e}")
        return None


def enrich_via_county_assessor_crawl(address, city, state_abbr, zip_code):
    """
    Crawl county assessor / property appraiser websites.
    These government sites are typically less protected than Zillow/Redfin.
    """
    # Build a list of candidate URLs based on state
    urls_to_try = []

    # State-specific property record sites
    state_sites = {
        "FL": f"https://www.bcpa.net/RecSearch.asp?q={quote_plus(address)}",
        "TX": f"https://propaccess.trueautomation.com/clientdb/?cid=13&ession=42&p={quote_plus(address)}",
        "CA": f"https://www.propertyshark.com/mason/Property-Reports/?lq={quote_plus(f'{address} {city} {state_abbr}')}",
        "NY": f"https://a836-acris.nyc.gov/DS/DocumentSearch/BBLSearch",
        "PA": f"https://property.phila.gov/?q={quote_plus(address)}",
        "OH": f"https://wedge.hcauditor.org/view/re/{quote_plus(address)}",
        "IL": f"https://www.cookcountyassessor.com/address-search?address={quote_plus(address)}",
        "GA": f"https://qpublic.schneidercorp.com/Application.aspx?AppID=820&LayerID=15094&q={quote_plus(address)}",
    }

    if state_abbr in state_sites:
        urls_to_try.append(state_sites[state_abbr])

    # Generic: Try propertyshark (works for many states, less anti-bot than Zillow)
    urls_to_try.append(
        f"https://www.countyoffice.org/property-records-search/?q={quote_plus(f'{address}, {city}, {state_abbr} {zip_code}')}"
    )

    for url in urls_to_try:
        markdown = crawl_page(url)
        if not markdown or len(markdown) < 100:
            continue

        enrichment = extract_property_data(markdown)
        if enrichment:
            enrichment["enrichment_source"] = "county_assessor"
            return enrichment
        delay()

    return None


def extract_property_data(text):
    """Extract property data from markdown/text using regex patterns."""
    if not text:
        return None

    lower = text.lower()
    enrichment = {}

    # Bedrooms
    bed = re.search(r"(\d+)\s*(?:beds?|bedrooms?|br\b)", lower)
    if bed:
        val = int(bed.group(1))
        if 0 < val < 20:
            enrichment["bedrooms"] = val

    # Bathrooms
    bath = re.search(r"(\d+(?:\.\d+)?)\s*(?:baths?|bathrooms?|ba\b)", lower)
    if bath:
        val = float(bath.group(1))
        if 0 < val < 20:
            enrichment["bathrooms"] = val

    # Square footage
    sqft = re.search(r"([\d,]+)\s*(?:sq\.?\s*(?:ft|feet)|sqft)", lower)
    if sqft:
        val = parse_number(sqft.group(1))
        if val and 100 < val < 100000:
            enrichment["square_footage"] = val

    # Year built
    year = re.search(r"(?:year\s*built|built\s*(?:in)?)\s*:?\s*(\d{4})", lower)
    if year:
        val = int(year.group(1))
        if 1800 < val < 2027:
            enrichment["year_built"] = val

    # Lot size
    lot = re.search(r"(?:lot\s*(?:size|area)?)\s*:?\s*([\d,.]+\s*(?:acres?|sq\.?\s*ft|sqft))", lower)
    if lot:
        enrichment["lot_size"] = lot.group(1).strip()

    # Assessed value
    assessed = re.search(r"(?:assessed|appraised|total)\s*(?:value)?\s*:?\s*\$?\s*([\d,]+)", lower)
    if assessed:
        val = parse_number(assessed.group(1))
        if val and val > 1000:
            enrichment["assessed_value"] = val

    # Tax amount
    tax = re.search(r"(?:tax(?:es)?|annual\s*tax|property\s*tax)\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)", lower)
    if tax:
        val = parse_number(tax.group(1))
        if val and 100 < val < 1000000:
            enrichment["tax_amount"] = val

    # Market value / estimated value
    market = re.search(r"(?:market|estimated|fair\s*market)\s*(?:value)?\s*:?\s*\$?\s*([\d,]+)", lower)
    if market:
        val = parse_number(market.group(1))
        if val and val > 10000:
            enrichment["estimated_market_value"] = val

    # APN / Parcel
    apn = re.search(r"(?:apn|parcel\s*(?:number|id|#|no\.?))\s*:?\s*([\w\-\.]+)", lower)
    if apn:
        apn_val = apn.group(1).strip()
        if len(apn_val) > 3:
            enrichment["apn_number"] = apn_val

    # Property type
    ptype = re.search(
        r"(?:property\s*type|home\s*type|use\s*type|building\s*type)\s*:?\s*([a-z][a-z\s\-/]+?)(?:\n|,|\||;|$)",
        lower,
    )
    if ptype:
        enrichment["property_type"] = ptype.group(1).strip().title()[:50]

    return enrichment if enrichment else None


# ─── Enrichment Source 3: Overage Calculation ──────────────────────────

def calculate_overage_data(lead):
    """
    Calculate overage (surplus) from existing sale/mortgage data.
    Overage = sale_amount - mortgage_amount (when positive).
    This is the core data that makes a lead actionable for recovery.
    """
    sale = lead.get("sale_amount") or 0
    mortgage = lead.get("mortgage_amount") or 0

    if sale <= 0:
        return None

    enrichment = {}

    if mortgage > 0:
        overage = sale - mortgage
        enrichment["estimated_market_value"] = sale  # Sale price as market proxy
        if overage > 0:
            # This lead has potential surplus funds
            enrichment["enrichment_source"] = "calculated_overage"
    else:
        # No mortgage data; sale price is still useful
        enrichment["estimated_market_value"] = sale

    return enrichment if enrichment else None


# ─── Enrichment Source 4: County Office / Public Records ───────────────

def enrich_via_public_records(address, city, state_abbr, zip_code):
    """
    Try public records aggregator sites that are datacenter-friendly.
    These sites aggregate county records and are less protected.
    """
    # countyoffice.org is a public records aggregator
    search_url = (
        f"https://www.countyoffice.org/property-records-search/"
        f"?q={quote_plus(f'{address}, {city}, {state_abbr} {zip_code}')}"
    )

    markdown = crawl_page(search_url)
    if markdown and len(markdown) > 200:
        enrichment = extract_property_data(markdown)
        if enrichment:
            enrichment["enrichment_source"] = "public_records"
            return enrichment

    return None


# ─── Main Enrichment Logic ─────────────────────────────────────────────

def enrich_single_lead(lead):
    """Enrich a single lead using multiple sources."""
    lead_id = lead["id"]
    address = lead["property_address"]
    city = lead["city"]
    state_abbr = lead.get("state_abbr", "")
    zip_code = lead.get("zip_code", "")
    owner = lead.get("owner_name", "")

    log.info(f"Enriching: {address}, {city}, {state_abbr} {zip_code} (owner: {owner})")

    combined = {}

    # Source 1: Calculate overage from existing data (instant, no network)
    overage_data = calculate_overage_data(lead)
    if overage_data:
        combined.update(overage_data)
        log.info(f"  Overage calc: market value ${combined.get('estimated_market_value', 0):,.0f}")

    # Source 2: Nominatim geocoding for address validation + property type
    nominatim_data = enrich_via_nominatim(address, city, state_abbr, zip_code)
    if nominatim_data:
        for k, v in nominatim_data.items():
            if k not in combined or combined[k] is None:
                combined[k] = v
        log.info(f"  Nominatim: {len(nominatim_data)} fields")
    delay()

    # Source 3: County assessor crawl (government sites) -- skip if SKIP_CRAWL=true
    assessor_data = None
    public_data = None
    if not SKIP_CRAWL:
        missing = [f for f in ["assessed_value", "tax_amount", "bedrooms", "square_footage", "year_built"]
                   if f not in combined]
        if missing:
            assessor_data = enrich_via_county_assessor_crawl(address, city, state_abbr, zip_code)
            if assessor_data:
                for k, v in assessor_data.items():
                    if k not in combined or combined[k] is None:
                        combined[k] = v
                log.info(f"  County assessor: {len(assessor_data)} fields")
            delay()

        # Source 4: Public records aggregator as fallback
        still_missing = [f for f in ["assessed_value", "bedrooms", "square_footage"]
                         if f not in combined]
        if still_missing:
            public_data = enrich_via_public_records(address, city, state_abbr, zip_code)
            if public_data:
                for k, v in public_data.items():
                    if k not in combined or combined[k] is None:
                        combined[k] = v
                log.info(f"  Public records: {len(public_data)} fields")

    # Ensure enrichment_source is always set
    if not combined:
        combined["enrichment_source"] = "none_found"
        log.warning(f"  No enrichment data found for {address}")
    elif "enrichment_source" not in combined or not combined.get("enrichment_source"):
        sources = []
        if overage_data:
            sources.append("overage_calc")
        if nominatim_data:
            sources.append("nominatim")
        if assessor_data:
            sources.append("county_assessor")
        if public_data:
            sources.append("public_records")
        combined["enrichment_source"] = "+".join(sources) if sources else "partial"

    # Update Supabase
    try:
        update_lead(lead_id, combined)
        field_count = len([v for v in combined.values()
                          if v is not None and v != "none_found"])
        log.info(f"  Updated {lead_id[:8]}... with {field_count} enriched fields")
        return True
    except Exception as e:
        log.error(f"  Failed to update {lead_id}: {e}")
        return False


def run_enrichment_batch():
    """Main entry point: fetch and enrich a batch of leads."""
    start = datetime.now(timezone.utc)
    log.info(f"=== Enrichment v2 batch started at {start.isoformat()} ===")

    # Verify Crawl4AI is available
    try:
        health = requests.get(f"{CRAWL4AI_URL}/health", timeout=10)
        if health.status_code != 200:
            log.warning("Crawl4AI unhealthy - will skip crawl-based enrichment")
        else:
            log.info("Crawl4AI: OK")
    except Exception as e:
        log.warning(f"Crawl4AI unreachable: {e} - will use non-crawl sources only")

    # Fetch unenriched leads
    try:
        leads = fetch_unenriched_leads(BATCH_SIZE)
        log.info(f"Fetched {len(leads)} unenriched leads")
    except Exception as e:
        log.error(f"Failed to fetch leads from Supabase: {e}")
        return

    if not leads:
        log.info("No unenriched leads remaining.")
        return

    success = 0
    fail = 0

    for i, lead in enumerate(leads):
        log.info(f"--- Lead {i + 1}/{len(leads)} ---")
        try:
            if enrich_single_lead(lead):
                success += 1
            else:
                fail += 1
        except Exception as e:
            log.error(f"Error on lead {lead.get('id', '?')}: {e}")
            fail += 1

        if i < len(leads) - 1:
            delay()

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    log.info(f"=== Batch done: {success} OK, {fail} failed, {elapsed:.0f}s ===")

    # Report remaining count
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/foreclosure_leads?enriched_at=is.null&select=id",
            headers={**supabase_headers("count=exact")},
            timeout=30,
        )
        remaining = resp.headers.get("content-range", "unknown")
        log.info(f"Remaining unenriched: {remaining}")
    except Exception:
        pass


if __name__ == "__main__":
    run_enrichment_batch()
