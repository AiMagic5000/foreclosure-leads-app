#!/usr/bin/env python3
"""
Property Data Enrichment Script v2
Enriches foreclosure leads with property details (sqft, beds, baths, lot size,
year built, stories, APN) using county assessor APIs and Crawl4AI.

Strategy:
1. County assessor REST APIs (free, no CAPTCHA, structured JSON)
   - LA County Assessor API (covers Los Angeles area)
   - More county APIs added as discovered
2. Crawl4AI scraping of county assessor websites (gov sites, no CAPTCHA)
3. Fallback mark as attempted to avoid re-processing

Usage:
    python enrich_property.py [--batch-size 25] [--delay 2] [--max-leads 100] [--dry-run] [--state CA]

Environment Variables:
    SUPABASE_URL: Supabase project URL
    SUPABASE_SERVICE_KEY: Service role key
    CRAWL4AI_URL: Crawl4AI instance URL (for gov site scraping)
"""

import os
import re
import sys
import time
import json
import random
import logging
import argparse
from datetime import datetime, timezone
from urllib.parse import quote_plus, quote
from typing import Dict, List, Optional, Tuple

import requests

# Configuration
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://foreclosure-db.alwaysencrypted.com"
)
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
)
CRAWL4AI_URL = os.getenv(
    "CRAWL4AI_URL",
    "https://crawl4ai.alwaysencrypted.com"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("property_enrichment")


# ---- Cities to County Mapping ----
# Maps city names to the county they belong to for assessor API routing

LA_COUNTY_CITIES = {
    "los angeles", "studio city", "woodland hills", "venice", "encino",
    "north hollywood", "van nuys", "sherman oaks", "tarzana", "reseda",
    "canoga park", "chatsworth", "northridge", "sylmar", "sun valley",
    "panorama city", "arleta", "pacoima", "lake balboa", "granada hills",
    "porter ranch", "west hills", "calabasas", "hidden hills", "agoura hills",
    "westlake village", "malibu", "santa monica", "beverly hills", "west hollywood",
    "culver city", "inglewood", "hawthorne", "gardena", "torrance", "carson",
    "compton", "lynwood", "south gate", "downey", "norwalk", "whittier",
    "la mirada", "cerritos", "lakewood", "long beach", "san pedro",
    "wilmington", "harbor city", "lomita", "rancho palos verdes",
    "rolling hills", "rolling hills estates", "palos verdes estates",
    "redondo beach", "hermosa beach", "manhattan beach", "el segundo",
    "playa del rey", "marina del rey", "playa vista", "westchester",
    "ladera heights", "baldwin hills", "leimert park", "crenshaw",
    "mid city", "koreatown", "echo park", "silver lake", "los feliz",
    "atwater village", "glassell park", "highland park", "eagle rock",
    "el sereno", "lincoln heights", "boyle heights", "east los angeles",
    "monterey park", "alhambra", "san gabriel", "rosemead", "temple city",
    "arcadia", "monrovia", "duarte", "azusa", "glendora", "san dimas",
    "la verne", "pomona", "claremont", "diamond bar", "walnut",
    "rowland heights", "hacienda heights", "west covina", "covina",
    "baldwin park", "el monte", "south el monte", "industry",
    "pico rivera", "montebello", "bell", "bell gardens", "maywood",
    "huntington park", "vernon", "commerce", "east la", "west la",
    "brentwood", "pacific palisades", "bel air", "westwood",
    "century city", "cheviot hills", "rancho park", "palms", "mar vista",
    "del rey", "playa del rey", "santa clarita", "valencia", "newhall",
    "castaic", "stevenson ranch", "canyon country", "saugus",
    "acton", "agua dulce", "palmdale", "lancaster", "quartz hill",
    "littlerock", "pearblossom", "llano", "pasadena", "altadena",
    "south pasadena", "san marino", "la canada flintridge",
    "glendale", "burbank", "toluca lake", "universal city",
    "tujunga", "sunland", "la crescenta", "montrose", "la tuna canyon",
    "topanga", "malibu canyon", "agoura", "west hills", "winnetka",
    "lake view terrace", "shadow hills", "la crescenta-montrose",
    "san fernando", "mission hills", "sepulveda", "north hills",
    "lake los angeles", "little rock", "juniper hills",
}

ORANGE_COUNTY_CITIES = {
    "irvine", "anaheim", "santa ana", "huntington beach", "garden grove",
    "orange", "fullerton", "costa mesa", "mission viejo", "lake forest",
    "newport beach", "laguna beach", "laguna niguel", "laguna hills",
    "aliso viejo", "rancho santa margarita", "san clemente", "dana point",
    "san juan capistrano", "ladera ranch", "foothill ranch", "tustin",
    "yorba linda", "placentia", "brea", "buena park", "cypress",
    "la palma", "stanton", "westminster", "fountain valley",
    "seal beach", "los alamitos", "rossmoor",
}

SAN_DIEGO_COUNTY_CITIES = {
    "san diego", "chula vista", "oceanside", "escondido", "carlsbad",
    "el cajon", "vista", "san marcos", "encinitas", "national city",
    "la mesa", "santee", "poway", "imperial beach", "solana beach",
    "del mar", "coronado", "lemon grove", "fallbrook",
}

RIVERSIDE_COUNTY_CITIES = {
    "riverside", "moreno valley", "corona", "temecula", "murrieta",
    "menifee", "hemet", "perris", "lake elsinore", "indio", "palm springs",
    "palm desert", "cathedral city", "coachella", "beaumont", "banning",
    "san jacinto", "wildomar", "eastvale", "jurupa valley", "norco",
    "calimesa", "desert hot springs", "rancho mirage", "indian wells",
    "la quinta",
}

SAN_BERNARDINO_COUNTY_CITIES = {
    "san bernardino", "fontana", "rancho cucamonga", "ontario", "victorville",
    "rialto", "hesperia", "upland", "apple valley", "redlands", "chino",
    "chino hills", "colton", "highland", "yucaipa", "montclair", "loma linda",
    "barstow", "twentynine palms", "yucca valley", "big bear lake",
}

KERN_COUNTY_CITIES = {
    "bakersfield", "rosamond", "tehachapi", "ridgecrest", "delano",
    "wasco", "shafter", "california city", "mojave", "arvin",
}

SACRAMENTO_COUNTY_CITIES = {
    "sacramento", "elk grove", "rancho cordova", "citrus heights", "folsom",
    "arden arcade", "carmichael", "fair oaks", "orangevale", "north highlands",
    "antelope", "gold river", "roseville",
}

FRESNO_COUNTY_CITIES = {
    "fresno", "clovis", "sanger", "selma", "reedley", "kingsburg",
    "coalinga", "fowler", "parlier", "kerman",
}

SAN_JOAQUIN_COUNTY_CITIES = {
    "stockton", "tracy", "manteca", "lodi", "ripon", "escalon",
    "lathrop", "mountain house",
}

ALAMEDA_COUNTY_CITIES = {
    "oakland", "fremont", "hayward", "berkeley", "san leandro",
    "alameda", "union city", "pleasanton", "livermore", "dublin",
    "newark", "emeryville", "piedmont", "albany",
}

SF_COUNTY_CITIES = {
    "san francisco",
}


def get_county_for_city(city: str, state_abbr: str) -> Optional[str]:
    """Determine the county for a given city and state."""
    city_lower = city.lower().strip()

    if state_abbr == "CA":
        if city_lower in LA_COUNTY_CITIES:
            return "los_angeles"
        if city_lower in ORANGE_COUNTY_CITIES:
            return "orange"
        if city_lower in SAN_DIEGO_COUNTY_CITIES:
            return "san_diego"
        if city_lower in RIVERSIDE_COUNTY_CITIES:
            return "riverside"
        if city_lower in SAN_BERNARDINO_COUNTY_CITIES:
            return "san_bernardino"
        if city_lower in KERN_COUNTY_CITIES:
            return "kern"
        if city_lower in SACRAMENTO_COUNTY_CITIES:
            return "sacramento"
        if city_lower in FRESNO_COUNTY_CITIES:
            return "fresno"
        if city_lower in SAN_JOAQUIN_COUNTY_CITIES:
            return "san_joaquin"
        if city_lower in ALAMEDA_COUNTY_CITIES:
            return "alameda"
        if city_lower in SF_COUNTY_CITIES:
            return "san_francisco"

    return None


# ---- Supabase Operations ----

def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def fetch_leads_needing_property(limit=25, state_filter=None):
    """Fetch leads that are missing property details and haven't been attempted."""
    url = (
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
        f"?square_footage=is.null"
        f"&bedrooms=is.null"
        f"&apn_number=is.null"
        f"&owner_name=neq.Property%20Owner"
        f"&select=id,property_address,city,state,state_abbr,zip_code,owner_name,"
        f"sale_amount,mortgage_amount,estimated_market_value,lat,lng,county,enrichment_source"
        f"&limit={limit}"
        f"&order=estimated_market_value.desc.nullslast"
    )
    if state_filter:
        url += f"&state_abbr=eq.{state_filter}"

    resp = requests.get(url, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()


def update_lead_property(lead_id, data, dry_run=False):
    """Update a lead with property enrichment data."""
    if dry_run:
        log.info(f"  [DRY RUN] Would update {lead_id[:8]}... with {list(data.keys())}")
        return True

    url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}"
    payload = {
        **data,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    resp = requests.patch(url, json=payload, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return True


# ---- LA County Assessor API ----

def enrich_via_la_county_api(address: str, city: str, zip_code: str) -> Optional[Dict]:
    """
    Use LA County Assessor REST API to get property details.
    Free, no CAPTCHA, returns structured JSON.

    API: https://portal.assessor.lacounty.gov/api/
    """
    search_query = f"{address}, {city}"

    try:
        # Step 1: Search for the property to get AIN (Assessor Identification Number)
        search_url = "https://portal.assessor.lacounty.gov/api/search"
        resp = requests.get(
            search_url,
            params={"search": search_query},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        search_data = resp.json()

        parcels = search_data.get("Parcels", [])
        if not parcels:
            log.debug(f"  LA County: No parcels found for {search_query}")
            return None

        # Find best match - exact street match preferred
        addr_upper = address.upper().strip()
        best_ain = None
        for parcel in parcels[:10]:
            situs = parcel.get("SitusStreet", "").upper().strip()
            if situs == addr_upper:
                best_ain = parcel.get("AIN")
                break

        if not best_ain:
            # Take first result if no exact match
            best_ain = parcels[0].get("AIN")

        if not best_ain:
            return None

        # Step 2: Get detailed property data using AIN
        detail_url = "https://portal.assessor.lacounty.gov/api/parceldetail"
        resp2 = requests.get(
            detail_url,
            params={"ain": best_ain},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        resp2.raise_for_status()
        detail_data = resp2.json()

        parcel_detail = detail_data.get("Parcel", detail_data)
        if not parcel_detail:
            return None

        # Extract property fields
        enrichment = {}

        sqft = parcel_detail.get("SqftMain")
        if sqft and int(sqft) > 0:
            enrichment["square_footage"] = int(sqft)

        beds = parcel_detail.get("NumOfBeds")
        if beds and int(beds) > 0:
            enrichment["bedrooms"] = int(beds)

        baths = parcel_detail.get("NumOfBaths")
        if baths and int(baths) > 0:
            enrichment["bathrooms"] = int(baths)

        year = parcel_detail.get("YearBuilt")
        if year:
            try:
                yr = int(year)
                if 1800 < yr < 2027:
                    enrichment["year_built"] = yr
            except (ValueError, TypeError):
                pass

        lot = parcel_detail.get("SqftLot")
        if lot and int(lot) > 0:
            enrichment["lot_size"] = f"{int(lot):,} sq ft"

        use_type = parcel_detail.get("UseType")
        if use_type:
            enrichment["property_type"] = use_type

        # APN number
        ain = parcel_detail.get("AIN")
        if ain:
            enrichment["apn_number"] = ain

        # County
        enrichment["county"] = "Los Angeles"

        # Assessed value
        land_val = parcel_detail.get("CurrentRoll_LandValue") or 0
        imp_val = parcel_detail.get("CurrentRoll_ImpValue") or 0
        total_assessed = int(land_val) + int(imp_val)
        if total_assessed > 0:
            enrichment["assessed_value"] = total_assessed

        # Stories from SubParts
        sub_parts = parcel_detail.get("SubParts", [])
        if sub_parts:
            units = sub_parts[0].get("NumOfUnits")
            if units:
                try:
                    enrichment["stories"] = int(units)
                except (ValueError, TypeError):
                    pass

        if enrichment:
            enrichment["enrichment_source"] = "la_county_assessor"

        return enrichment if enrichment else None

    except requests.RequestException as e:
        log.debug(f"  LA County API error: {e}")
        return None
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        log.debug(f"  LA County parse error: {e}")
        return None


# ---- Crawl4AI Scraping of County Assessor Sites ----

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
]


def crawl_page(url, wait_for=None):
    """Use Crawl4AI to fetch a page. Returns markdown content or None."""
    try:
        payload = {
            "urls": [url],
            "priority": 5,
            "browser_config": {
                "headless": True,
                "user_agent": random.choice(USER_AGENTS),
            },
        }
        if wait_for:
            payload["wait_for"] = wait_for

        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json=payload,
            timeout=90,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("success") and data.get("results"):
            result = data["results"][0]
            md = result.get("markdown", {})
            if isinstance(md, dict):
                return md.get("raw_markdown", "") or md.get("markdown", "") or str(md)
            return str(md) if md else ""
        return None
    except Exception as e:
        log.debug(f"Crawl4AI error for {url}: {e}")
        return None


def parse_number(text):
    if not text:
        return None
    cleaned = str(text).replace("$", "").replace(",", "").replace(" ", "").strip()
    try:
        if "." in cleaned:
            return float(cleaned)
        return int(cleaned)
    except (ValueError, TypeError):
        return None


def extract_property_from_markdown(text: str) -> Dict:
    """Extract property data from markdown/text using regex patterns."""
    if not text:
        return {}

    lower = text.lower()
    enrichment = {}

    # Bedrooms
    for pat in [r"(\d+)\s*(?:beds?|bedrooms?|br\b)", r"(?:beds?|bedrooms?)\s*:?\s*(\d+)", r"(\d+)\s*bd\b"]:
        m = re.search(pat, lower)
        if m:
            val = int(m.group(1))
            if 0 < val < 20:
                enrichment["bedrooms"] = val
                break

    # Bathrooms
    for pat in [r"(\d+(?:\.\d+)?)\s*(?:baths?|bathrooms?|ba\b)", r"(?:baths?|bathrooms?)\s*:?\s*(\d+(?:\.\d+)?)"]:
        m = re.search(pat, lower)
        if m:
            val = float(m.group(1))
            if 0 < val < 20:
                enrichment["bathrooms"] = val
                break

    # Square footage
    for pat in [r"([\d,]+)\s*(?:sq\.?\s*(?:ft|feet)|sqft|square\s*feet)", r"(?:living\s*area|home\s*size|building\s*area)\s*:?\s*([\d,]+)"]:
        m = re.search(pat, lower)
        if m:
            val = parse_number(m.group(1))
            if val and 100 < val < 100000:
                enrichment["square_footage"] = int(val)
                break

    # Year built
    for pat in [r"(?:year\s*built|built\s*(?:in)?)\s*:?\s*(\d{4})", r"(?:built)\s*:?\s*(\d{4})"]:
        m = re.search(pat, lower)
        if m:
            val = int(m.group(1))
            if 1800 < val < 2027:
                enrichment["year_built"] = val
                break

    # Lot size
    for pat in [r"(?:lot\s*(?:size|area)?)\s*:?\s*([\d,.]+\s*(?:acres?|sq\.?\s*ft|sqft))", r"([\d,.]+)\s*(?:acres?\s*lot|lot\s*acres?)"]:
        m = re.search(pat, lower)
        if m:
            enrichment["lot_size"] = m.group(1).strip()
            break

    # Stories
    for pat in [r"(\d+)\s*(?:stories|story|floors?)", r"(?:stories|floors?)\s*:?\s*(\d+)"]:
        m = re.search(pat, lower)
        if m:
            val = int(m.group(1))
            if 0 < val < 10:
                enrichment["stories"] = val
                break

    # APN / Parcel Number
    for pat in [r"(?:apn|parcel\s*(?:number|id|#|no\.?))\s*:?\s*([A-Za-z0-9\-\.]+(?:\s[A-Za-z0-9\-\.]+)?)"]:
        m = re.search(pat, lower)
        if m:
            apn_val = m.group(1).strip()
            if 3 < len(apn_val) < 30:
                enrichment["apn_number"] = apn_val.upper()
                break

    # Property type
    ptype = re.search(
        r"(?:property\s*type|home\s*type|use\s*type|building\s*type|style)\s*:?\s*([a-z][a-z\s\-/]+?)(?:\n|,|\||;|$)",
        lower,
    )
    if ptype:
        enrichment["property_type"] = ptype.group(1).strip().title()[:50]

    # Assessed value
    assessed = re.search(r"(?:assessed|appraised|total)\s*(?:value)?\s*:?\s*\$?\s*([\d,]+)", lower)
    if assessed:
        val = parse_number(assessed.group(1))
        if val and val > 1000:
            enrichment["assessed_value"] = val

    return enrichment


def enrich_via_county_website(address: str, city: str, state_abbr: str, zip_code: str) -> Optional[Dict]:
    """
    Scrape county assessor website via Crawl4AI.
    Government sites generally don't have CAPTCHAs.
    """
    # Try CountyOffice.org as universal aggregator
    search_url = (
        f"https://www.countyoffice.org/property-records-search/"
        f"?q={quote_plus(f'{address}, {city}, {state_abbr} {zip_code}')}"
    )
    markdown = crawl_page(search_url)
    if markdown and len(markdown) > 200:
        enrichment = extract_property_from_markdown(markdown)
        if enrichment:
            enrichment["enrichment_source"] = "county_website"
            return enrichment

    return None


def enrich_via_realtor(address: str, city: str, state_abbr: str, zip_code: str) -> Optional[Dict]:
    """Search Realtor.com for property details via Crawl4AI."""
    addr_slug = re.sub(r"[^a-z0-9]+", "-", address.lower()).strip("-")
    city_slug = city.lower().replace(" ", "-")
    url = f"https://www.realtor.com/realestateandhomes-detail/{addr_slug}_{city_slug}_{state_abbr}"

    markdown = crawl_page(url)
    if markdown and len(markdown) > 200:
        enrichment = extract_property_from_markdown(markdown)
        if enrichment:
            enrichment["enrichment_source"] = "realtor"
            return enrichment

    return None


# ---- Main Enrichment Logic ----

def enrich_single_lead(lead: Dict, dry_run: bool = False, use_crawl4ai: bool = True) -> Tuple[bool, str]:
    """
    Enrich a single lead with property data.
    Returns (success, source) tuple.
    """
    lead_id = lead["id"]
    address = lead["property_address"]
    city = lead["city"]
    state_abbr = lead.get("state_abbr", "")
    zip_code = lead.get("zip_code", "")

    log.info(f"Enriching: {address}, {city}, {state_abbr} {zip_code}")

    combined = {}
    source = "none"

    # Strategy 1: County Assessor REST APIs (fastest, most reliable)
    county = get_county_for_city(city, state_abbr)

    if county == "los_angeles":
        data = enrich_via_la_county_api(address, city, zip_code)
        if data:
            combined.update(data)
            source = "la_county_assessor"
            log.info(f"  LA County API: {len(data)} fields - {list(data.keys())}")

    # Strategy 2: Crawl4AI scraping of county/aggregator sites
    if use_crawl4ai and not combined:
        # Try CountyOffice.org
        data = enrich_via_county_website(address, city, state_abbr, zip_code)
        if data:
            combined.update(data)
            source = "county_website"
            log.info(f"  CountyOffice: {len(data)} fields - {list(data.keys())}")

        # Try Realtor.com if still missing key fields
        if "square_footage" not in combined or "bedrooms" not in combined:
            time.sleep(random.uniform(1, 2))
            data = enrich_via_realtor(address, city, state_abbr, zip_code)
            if data:
                for k, v in data.items():
                    if k not in combined or combined[k] is None:
                        combined[k] = v
                source = data.get("enrichment_source", source)
                log.info(f"  Realtor: {len(data)} fields - {list(data.keys())}")

    if not combined:
        log.warning(f"  No property data found for {address}")
        update_lead_property(lead_id, {"enrichment_source": "property_attempted"}, dry_run)
        return False, "none"

    # Recalculate overage if we got new assessed value
    sale_amount = lead.get("sale_amount") or 0
    assessed_val = combined.get("assessed_value", 0)
    market_value = lead.get("estimated_market_value") or 0

    if sale_amount > 0 and assessed_val > 0 and not market_value:
        # Use assessed value as market value estimate
        combined["estimated_market_value"] = assessed_val
        overage = max(0, sale_amount - assessed_val * 0.8)
        if overage > 0:
            combined["overage_amount"] = round(overage)

    # Ensure enrichment_source set
    if "enrichment_source" not in combined:
        combined["enrichment_source"] = source

    # Update DB
    try:
        update_lead_property(lead_id, combined, dry_run)
        log.info(f"  Updated {lead_id[:8]}... with {len(combined)} fields: {list(combined.keys())}")
        return True, source
    except Exception as e:
        log.error(f"  Failed to update {lead_id}: {e}")
        return False, "error"


def run(args):
    """Main entry point."""
    start = datetime.now(timezone.utc)
    log.info(f"=== Property Enrichment v2 started at {start.isoformat()} ===")
    log.info(f"Batch size: {args.batch_size}, Delay: {args.delay}s, "
             f"Max leads: {args.max_leads}, Dry run: {args.dry_run}, "
             f"State filter: {args.state or 'ALL'}")

    # Check Crawl4AI health (optional - script works without it for API-based enrichment)
    crawl4ai_ok = False
    if not args.api_only:
        try:
            health = requests.get(f"{CRAWL4AI_URL}/health", timeout=10)
            crawl4ai_ok = health.status_code == 200
            log.info(f"Crawl4AI: {'OK' if crawl4ai_ok else 'UNHEALTHY'}")
        except Exception as e:
            log.warning(f"Crawl4AI unreachable: {e} (will use API-only mode)")
    else:
        log.info("API-only mode: skipping Crawl4AI")

    total_enriched = 0
    total_failed = 0
    total_processed = 0
    source_counts = {}

    while total_processed < args.max_leads:
        remaining = args.max_leads - total_processed
        batch_size = min(args.batch_size, remaining)

        try:
            leads = fetch_leads_needing_property(batch_size, state_filter=args.state)
        except Exception as e:
            log.error(f"Failed to fetch leads: {e}")
            break

        if not leads:
            log.info("No more leads needing property enrichment")
            break

        log.info(f"\nProcessing batch of {len(leads)} leads...")

        for i, lead in enumerate(leads, 1):
            total_processed += 1
            owner = lead.get("owner_name", "Unknown")
            city = lead.get("city", "")
            state = lead.get("state_abbr", "")
            log.info(f"Processing lead {i}/{len(leads)}: {owner} ({city}, {state})")

            try:
                success, source = enrich_single_lead(
                    lead,
                    dry_run=args.dry_run,
                    use_crawl4ai=crawl4ai_ok and not args.api_only,
                )
                if success:
                    total_enriched += 1
                    source_counts[source] = source_counts.get(source, 0) + 1
                else:
                    total_failed += 1
            except Exception as e:
                log.error(f"Error processing lead {lead['id']}: {e}")
                total_failed += 1

            if total_processed >= args.max_leads:
                break

            # Small delay between leads for API rate limiting
            time.sleep(random.uniform(0.5, 1.5))

        # Delay between batches
        if total_processed < args.max_leads and leads:
            log.info(f"Batch complete. Sleeping for {args.delay} seconds...")
            time.sleep(args.delay)

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    log.info(f"\n=== Property Enrichment v2 complete ===")
    log.info(f"Processed: {total_processed}, Enriched: {total_enriched}, "
             f"Failed: {total_failed}, Time: {elapsed:.0f}s")
    log.info(f"Sources: {source_counts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Property data enrichment for foreclosure leads")
    parser.add_argument("--batch-size", type=int, default=25, help="Leads per batch")
    parser.add_argument("--delay", type=float, default=3.0, help="Delay between batches (seconds)")
    parser.add_argument("--max-leads", type=int, default=100, help="Max leads to process")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to database")
    parser.add_argument("--state", type=str, default=None, help="Filter by state (e.g. CA)")
    parser.add_argument("--api-only", action="store_true", help="Only use REST APIs, skip Crawl4AI")
    args = parser.parse_args()
    run(args)
