#!/usr/bin/env python3
"""
Real Estate Property Enrichment Script v3

Enriches foreclosure leads with property details using free APIs:
1. Florida Statewide Cadastral ArcGIS API (covers all 67 FL counties)
2. LA County Assessor API (Los Angeles area)
3. NYC PLUTO Socrata API (all 5 NYC boroughs)
4. Philadelphia CARTO API

Fields extracted:
- bedrooms (int) - where available
- bathrooms (float) - where available
- square_footage (int)
- year_built (int)
- lot_size (string, e.g., "0.25 acres")
- property_type (string)
- stories (int)
- assessed_value (int)
- apn_number (string)

Usage:
    python scrape_realestate.py [--batch-size 25] [--max-leads 100] [--dry-run] [--state FL]

Note: Real estate sites (Zillow, Redfin, Realtor.com) block automated requests.
This script uses free government/assessor APIs instead.
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
from urllib.parse import quote_plus
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("property_enrichment")

# Florida county name to CO_NO mapping (from Florida DOR)
FLORIDA_COUNTY_CODES = {
    "alachua": 1, "baker": 2, "bay": 3, "bradford": 4, "brevard": 5,
    "broward": 6, "calhoun": 7, "charlotte": 8, "citrus": 9, "clay": 10,
    "collier": 11, "columbia": 12, "desoto": 13, "dixie": 14, "duval": 15,
    "escambia": 16, "flagler": 17, "franklin": 18, "gadsden": 19, "gilchrist": 20,
    "glades": 21, "gulf": 22, "hamilton": 23, "hardee": 24, "hendry": 25,
    "hernando": 26, "highlands": 27, "hillsborough": 28, "holmes": 29, "indian river": 30,
    "jackson": 31, "jefferson": 32, "lafayette": 33, "lake": 34, "lee": 35,
    "leon": 36, "levy": 37, "liberty": 38, "madison": 39, "manatee": 40,
    "marion": 41, "martin": 42, "miami-dade": 43, "monroe": 44, "nassau": 45,
    "okaloosa": 46, "okeechobee": 47, "orange": 48, "osceola": 49, "palm beach": 50,
    "pasco": 51, "pinellas": 52, "polk": 53, "putnam": 54, "santa rosa": 55,
    "sarasota": 56, "seminole": 57, "st. johns": 58, "st. lucie": 59, "sumter": 60,
    "suwannee": 61, "taylor": 62, "union": 63, "volusia": 64, "wakulla": 65,
    "walton": 66, "washington": 67,
}

# Florida city to county mapping
FLORIDA_CITIES = {
    # Miami-Dade (43)
    "miami": "miami-dade", "miami beach": "miami-dade", "hialeah": "miami-dade",
    "coral gables": "miami-dade", "homestead": "miami-dade", "doral": "miami-dade",
    "kendall": "miami-dade", "miami gardens": "miami-dade", "north miami": "miami-dade",
    "aventura": "miami-dade", "cutler bay": "miami-dade", "miami lakes": "miami-dade",
    "sunny isles beach": "miami-dade", "pinecrest": "miami-dade", "key biscayne": "miami-dade",
    # Broward (6)
    "fort lauderdale": "broward", "hollywood": "broward", "pembroke pines": "broward",
    "coral springs": "broward", "pompano beach": "broward", "davie": "broward",
    "plantation": "broward", "sunrise": "broward", "miramar": "broward",
    "deerfield beach": "broward", "weston": "broward", "lauderhill": "broward",
    "tamarac": "broward", "margate": "broward", "coconut creek": "broward",
    # Palm Beach (50)
    "west palm beach": "palm beach", "boca raton": "palm beach", "boynton beach": "palm beach",
    "delray beach": "palm beach", "palm beach gardens": "palm beach", "jupiter": "palm beach",
    "wellington": "palm beach", "royal palm beach": "palm beach", "lake worth": "palm beach",
    "palm beach": "palm beach", "greenacres": "palm beach", "riviera beach": "palm beach",
    # Hillsborough (28) - Tampa
    "tampa": "hillsborough", "plant city": "hillsborough", "temple terrace": "hillsborough",
    "brandon": "hillsborough", "riverview": "hillsborough", "carrollwood": "hillsborough",
    # Orange (48) - Orlando
    "orlando": "orange", "winter park": "orange", "apopka": "orange",
    "ocoee": "orange", "winter garden": "orange", "maitland": "orange",
    # Duval (15) - Jacksonville
    "jacksonville": "duval", "jacksonville beach": "duval", "atlantic beach": "duval",
    "neptune beach": "duval",
    # Pinellas (52)
    "st petersburg": "pinellas", "st. petersburg": "pinellas", "clearwater": "pinellas", "largo": "pinellas",
    "palm harbor": "pinellas", "dunedin": "pinellas", "tarpon springs": "pinellas",
    # Lee (35) - Fort Myers
    "fort myers": "lee", "cape coral": "lee", "lehigh acres": "lee",
    "bonita springs": "lee", "estero": "lee",
    # Polk (53) - Lakeland
    "lakeland": "polk", "winter haven": "polk", "bartow": "polk",
    # Brevard (5) - Space Coast
    "melbourne": "brevard", "palm bay": "brevard", "titusville": "brevard",
    "cocoa": "brevard", "cocoa beach": "brevard", "rockledge": "brevard",
    # Volusia (64)
    "daytona beach": "volusia", "port orange": "volusia", "deltona": "volusia",
    "ormond beach": "volusia", "new smyrna beach": "volusia",
    # Sarasota (56)
    "sarasota": "sarasota", "venice": "sarasota", "north port": "sarasota",
    # Collier (11) - Naples
    "naples": "collier", "marco island": "collier", "immokalee": "collier",
    # Seminole (57)
    "sanford": "seminole", "lake mary": "seminole", "longwood": "seminole",
    "oviedo": "seminole", "winter springs": "seminole",
    # Osceola (49)
    "kissimmee": "osceola", "st cloud": "osceola", "celebration": "osceola",
    # Pasco (51)
    "new port richey": "pasco", "port richey": "pasco", "land o lakes": "pasco",
    "wesley chapel": "pasco", "hudson": "pasco", "zephyrhills": "pasco",
    # Manatee (40)
    "bradenton": "manatee", "palmetto": "manatee", "lakewood ranch": "manatee",
    # St Lucie (59)
    "port st lucie": "st. lucie", "fort pierce": "st. lucie",
    # Marion (41)
    "ocala": "marion",
    # Escambia (16)
    "pensacola": "escambia", "perdido key": "escambia",
    # Leon (36)
    "tallahassee": "leon",
    # Alachua (1)
    "gainesville": "alachua",
}

# LA County cities
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
    "pasadena", "glendale", "burbank", "arcadia", "monrovia", "pomona",
}

# NYC boroughs
NYC_BOROUGHS = {
    "brooklyn": "BK", "new york": "MN", "manhattan": "MN",
    "queens": "QN", "bronx": "BX", "the bronx": "BX", "staten island": "SI",
}

# Philadelphia
PHILADELPHIA_CITIES = {"philadelphia"}


def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def fetch_leads_needing_property(limit=25, state_filter=None):
    """Fetch leads missing property details."""
    url = (
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
        f"?square_footage=is.null"
        f"&bedrooms=is.null"
        f"&enrichment_source=not.in.(property_enriched,property_attempted,api_attempted)"
        f"&select=id,property_address,city,state,state_abbr,zip_code,owner_name,lat,lng"
        f"&limit={limit}"
        f"&order=estimated_market_value.desc.nullslast"
    )
    if state_filter:
        url += f"&state_abbr=eq.{state_filter}"

    resp = requests.get(url, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()


def update_lead(lead_id, data, dry_run=False):
    """Update a lead with enrichment data."""
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


def get_county_info(city: str, state_abbr: str) -> Tuple[Optional[str], Optional[str]]:
    """Get county name and API type for a city."""
    city_lower = city.lower().strip()

    if state_abbr == "FL":
        county = FLORIDA_CITIES.get(city_lower)
        if county:
            return county, "florida_arcgis"

    if state_abbr == "CA":
        if city_lower in LA_COUNTY_CITIES:
            return "los_angeles", "la_county"

    if state_abbr == "NY":
        if city_lower in NYC_BOROUGHS:
            return city_lower, "nyc_pluto"

    if state_abbr == "PA":
        if city_lower in PHILADELPHIA_CITIES:
            return "philadelphia", "philadelphia_carto"

    return None, None


def enrich_via_florida_arcgis(address: str, city: str, zip_code: str, county: str) -> Optional[Dict]:
    """
    Use Florida Statewide Cadastral ArcGIS API.
    Free, no API key required, covers all 67 Florida counties.
    """
    try:
        county_code = FLORIDA_COUNTY_CODES.get(county)
        if not county_code:
            log.debug(f"  Unknown FL county: {county}")
            return None

        # Clean address for matching
        addr_upper = address.upper().strip()
        match = re.match(r"(\d+)\s+(.+)", addr_upper)
        if not match:
            return None
        street_num = match.group(1)

        # Query Florida statewide parcels - use city name for better matching
        # City names are mixed case in database, use upper() for case-insensitive match
        city_upper = city.upper()
        url = "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query"
        params = {
            "where": f"upper(PHY_CITY)='{city_upper}' AND PHY_ADDR1 LIKE '{street_num}%'",
            "outFields": "PHY_ADDR1,PHY_CITY,PHY_ZIPCD,PARCEL_ID,TOT_LVG_AR,LND_SQFOOT,ACT_YR_BLT,EFF_YR_BLT,JV,NO_RES_UNT",
            "returnGeometry": "false",
            "resultRecordCount": 10,
            "f": "json"
        }

        resp = requests.get(url, params=params, timeout=60)
        resp.raise_for_status()
        data = resp.json()

        if data.get("error"):
            log.debug(f"  FL API error: {data['error']}")
            return None

        features = data.get("features", [])
        if not features:
            return None

        # Find best match
        best = None
        for feat in features:
            attrs = feat["attributes"]
            phy_addr = attrs.get("PHY_ADDR1", "").upper()
            if phy_addr.startswith(street_num) and attrs.get("TOT_LVG_AR", 0) > 0:
                best = attrs
                break
        if not best:
            best = features[0]["attributes"]

        enrichment = {}

        # Square footage
        sqft = best.get("TOT_LVG_AR")
        if sqft and sqft > 100:
            enrichment["square_footage"] = int(sqft)

        # Lot size
        lot = best.get("LND_SQFOOT")
        if lot and lot > 0:
            if lot > 43560:
                enrichment["lot_size"] = f"{lot / 43560:.2f} acres"
            else:
                enrichment["lot_size"] = f"{int(lot):,} sq ft"

        # Year built
        year = best.get("ACT_YR_BLT") or best.get("EFF_YR_BLT")
        if year and 1800 < year < 2027:
            enrichment["year_built"] = int(year)

        # APN
        parcel = best.get("PARCEL_ID")
        if parcel:
            enrichment["apn_number"] = str(parcel).strip()

        # Assessed value
        jv = best.get("JV")
        if jv and jv > 0:
            enrichment["assessed_value"] = int(jv)

        # Property type based on residential units
        res_units = best.get("NO_RES_UNT", 0)
        if res_units == 1:
            enrichment["property_type"] = "Single Family"
        elif res_units == 2:
            enrichment["property_type"] = "Duplex"
        elif res_units and res_units > 2:
            enrichment["property_type"] = f"Multi-Family ({int(res_units)} units)"

        # County name
        enrichment["county"] = county.replace("-", " ").title()

        if enrichment:
            enrichment["enrichment_source"] = "florida_arcgis"

        return enrichment if enrichment else None

    except Exception as e:
        log.debug(f"  FL ArcGIS error: {e}")
        return None


def enrich_via_la_county(address: str, city: str, zip_code: str) -> Optional[Dict]:
    """Use LA County Assessor REST API."""
    try:
        search_query = f"{address}, {city}"
        search_url = "https://portal.assessor.lacounty.gov/api/search"

        resp = requests.get(search_url, params={"search": search_query}, timeout=15)
        resp.raise_for_status()
        search_data = resp.json()

        parcels = search_data.get("Parcels", [])
        if not parcels:
            return None

        # Find best match
        addr_upper = address.upper().strip()
        best_ain = None
        for parcel in parcels[:10]:
            situs = parcel.get("SitusStreet", "").upper().strip()
            if situs == addr_upper:
                best_ain = parcel.get("AIN")
                break
        if not best_ain:
            best_ain = parcels[0].get("AIN")
        if not best_ain:
            return None

        # Get detailed property data
        detail_url = "https://portal.assessor.lacounty.gov/api/parceldetail"
        resp2 = requests.get(detail_url, params={"ain": best_ain}, timeout=15)
        resp2.raise_for_status()
        detail_data = resp2.json()

        parcel_detail = detail_data.get("Parcel", detail_data)
        if not parcel_detail:
            return None

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

        ain = parcel_detail.get("AIN")
        if ain:
            enrichment["apn_number"] = ain

        enrichment["county"] = "Los Angeles"

        land_val = parcel_detail.get("CurrentRoll_LandValue") or 0
        imp_val = parcel_detail.get("CurrentRoll_ImpValue") or 0
        total = int(land_val) + int(imp_val)
        if total > 0:
            enrichment["assessed_value"] = total

        if enrichment:
            enrichment["enrichment_source"] = "la_county_assessor"

        return enrichment if enrichment else None

    except Exception as e:
        log.debug(f"  LA County API error: {e}")
        return None


def enrich_via_nyc_pluto(address: str, city: str, zip_code: str) -> Optional[Dict]:
    """Use NYC PLUTO Socrata API."""
    try:
        city_lower = city.lower().strip()
        borough_code = NYC_BOROUGHS.get(city_lower)
        if not borough_code:
            return None

        addr_upper = address.upper().strip()
        match = re.match(r"(\d+)\s+(.+)", addr_upper)
        if not match:
            return None
        street_num = match.group(1)
        street_name = match.group(2)[:10].replace(" ", "%")

        url = "https://data.cityofnewyork.us/resource/64uk-42ks.json"
        params = {
            "$where": f"borough = '{borough_code}' AND upper(address) like '%{street_num}%'",
            "$limit": 5,
            "$select": "address,zipcode,bldgarea,lotarea,numfloors,yearbuilt,bbl,assesstot,bldgclass"
        }
        if zip_code:
            params["$where"] += f" AND zipcode = '{zip_code}'"

        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        if not data:
            return None

        best = data[0]
        enrichment = {}

        sqft = best.get("bldgarea")
        if sqft:
            val = int(float(sqft))
            if val > 0:
                enrichment["square_footage"] = val

        lot = best.get("lotarea")
        if lot:
            val = int(float(lot))
            if val > 0:
                enrichment["lot_size"] = f"{val:,} sq ft"

        floors = best.get("numfloors")
        if floors:
            val = int(float(floors))
            if 0 < val < 200:
                enrichment["stories"] = val

        year = best.get("yearbuilt")
        if year:
            yr = int(year)
            if 1800 < yr < 2027:
                enrichment["year_built"] = yr

        assessed = best.get("assesstot")
        if assessed:
            enrichment["assessed_value"] = int(float(assessed))

        bbl = best.get("bbl")
        if bbl:
            enrichment["apn_number"] = str(bbl).replace(".00000000", "")

        borough_names = {"BK": "Brooklyn", "MN": "Manhattan", "QN": "Queens", "BX": "Bronx", "SI": "Staten Island"}
        enrichment["county"] = borough_names.get(borough_code, "New York City")

        bldg_class = best.get("bldgclass", "")
        if bldg_class:
            class_map = {"A": "Single Family", "B": "Two Family", "C": "Walk-up Apartment",
                         "D": "Elevator Apartment", "R": "Condo", "S": "Residence"}
            ptype = class_map.get(bldg_class[0].upper() if bldg_class else "", "")
            if ptype:
                enrichment["property_type"] = ptype

        if enrichment:
            enrichment["enrichment_source"] = "nyc_pluto"

        return enrichment if enrichment else None

    except Exception as e:
        log.debug(f"  NYC PLUTO error: {e}")
        return None


def enrich_via_philadelphia_carto(address: str, city: str, zip_code: str) -> Optional[Dict]:
    """Use Philadelphia OPA CARTO API."""
    try:
        addr_clean = address.upper().strip().replace("'", "''")
        sql = f"SELECT * FROM opa_properties_public WHERE upper(location) LIKE '%{addr_clean[:20]}%' LIMIT 5"
        if zip_code:
            sql = f"SELECT * FROM opa_properties_public WHERE zip_code = '{zip_code}' AND upper(location) LIKE '%{addr_clean[:15]}%' LIMIT 5"

        url = "https://phl.carto.com/api/v2/sql"
        resp = requests.get(url, params={"q": sql}, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        rows = data.get("rows", [])
        if not rows:
            return None

        row = rows[0]
        enrichment = {}

        beds = row.get("number_of_bedrooms")
        if beds and int(beds) > 0:
            enrichment["bedrooms"] = int(beds)

        baths = row.get("number_of_bathrooms")
        if baths and int(baths) > 0:
            enrichment["bathrooms"] = int(baths)

        sqft = row.get("total_livable_area") or row.get("total_area")
        if sqft:
            enrichment["square_footage"] = int(float(sqft))

        year = row.get("year_built")
        if year and 1800 < int(year) < 2027:
            enrichment["year_built"] = int(year)

        stories = row.get("number_stories")
        if stories:
            enrichment["stories"] = int(float(stories))

        parcel = row.get("parcel_number")
        if parcel:
            enrichment["apn_number"] = str(parcel)

        market_val = row.get("market_value")
        if market_val:
            enrichment["assessed_value"] = int(float(market_val))

        enrichment["county"] = "Philadelphia"

        cat = row.get("category_code_description") or row.get("building_code_description")
        if cat:
            enrichment["property_type"] = cat[:50]

        if enrichment:
            enrichment["enrichment_source"] = "philadelphia_carto"

        return enrichment if enrichment else None

    except Exception as e:
        log.debug(f"  Philadelphia CARTO error: {e}")
        return None


def enrich_single_lead(lead: Dict, dry_run: bool = False) -> Tuple[bool, str]:
    """Enrich a single lead with property data."""
    lead_id = lead["id"]
    address = lead["property_address"]
    city = lead["city"]
    state_abbr = lead.get("state_abbr", "")
    zip_code = lead.get("zip_code", "")

    log.info(f"Enriching: {address}, {city}, {state_abbr} {zip_code}")

    county, api_type = get_county_info(city, state_abbr)

    if not county:
        log.info(f"  No API coverage for {city}, {state_abbr}")
        update_lead(lead_id, {"enrichment_source": "api_attempted"}, dry_run)
        return False, "no_api"

    enrichment = None

    if api_type == "florida_arcgis":
        log.info(f"  Using Florida ArcGIS API (county: {county})")
        enrichment = enrich_via_florida_arcgis(address, city, zip_code, county)

    elif api_type == "la_county":
        log.info(f"  Using LA County Assessor API")
        enrichment = enrich_via_la_county(address, city, zip_code)

    elif api_type == "nyc_pluto":
        log.info(f"  Using NYC PLUTO API")
        enrichment = enrich_via_nyc_pluto(address, city, zip_code)

    elif api_type == "philadelphia_carto":
        log.info(f"  Using Philadelphia CARTO API")
        enrichment = enrich_via_philadelphia_carto(address, city, zip_code)

    if not enrichment:
        log.warning(f"  No property data found")
        update_lead(lead_id, {"enrichment_source": "property_attempted"}, dry_run)
        return False, "no_data"

    # Add timestamp
    enrichment["enriched_at"] = datetime.now(timezone.utc).isoformat()

    # Update database
    try:
        update_lead(lead_id, enrichment, dry_run)
        fields = [k for k in enrichment.keys() if k not in ("enrichment_source", "enriched_at")]
        log.info(f"  Updated with {len(fields)} fields: {', '.join(fields)}")
        return True, enrichment.get("enrichment_source", "unknown")
    except Exception as e:
        log.error(f"  Failed to update {lead_id}: {e}")
        return False, "error"


def run(args):
    """Main entry point."""
    start = datetime.now(timezone.utc)
    log.info(f"=== Property Enrichment v3 started at {start.isoformat()} ===")
    log.info(f"Batch size: {args.batch_size}, Max leads: {args.max_leads}, "
             f"Dry run: {args.dry_run}, State: {args.state or 'ALL'}")

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
            log.info(f"\nLead {i}/{len(leads)} (Total: {total_processed}/{args.max_leads}): {owner[:25]} ({city}, {state})")

            try:
                success, source = enrich_single_lead(lead, dry_run=args.dry_run)
                if success:
                    total_enriched += 1
                    source_counts[source] = source_counts.get(source, 0) + 1
                else:
                    total_failed += 1
                    source_counts[source] = source_counts.get(source, 0) + 1
            except Exception as e:
                log.error(f"Error processing lead {lead['id']}: {e}")
                total_failed += 1

            if total_processed >= args.max_leads:
                break

            # Small delay between leads
            time.sleep(random.uniform(0.3, 0.8))

        # Delay between batches
        if total_processed < args.max_leads and leads:
            log.info(f"\nBatch complete. Waiting 2 seconds...")
            time.sleep(2)

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    log.info(f"\n{'='*60}")
    log.info(f"Property Enrichment v3 Complete")
    log.info(f"{'='*60}")
    log.info(f"Processed: {total_processed}")
    log.info(f"Enriched:  {total_enriched} ({total_enriched/max(1,total_processed)*100:.1f}%)")
    log.info(f"Failed:    {total_failed}")
    log.info(f"Time:      {elapsed:.0f}s ({elapsed/max(1,total_processed):.1f}s per lead)")
    log.info(f"Results:   {source_counts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enrich foreclosure leads with property data")
    parser.add_argument("--batch-size", type=int, default=25, help="Leads per batch")
    parser.add_argument("--max-leads", type=int, default=100, help="Max leads to process")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to database")
    parser.add_argument("--state", type=str, default=None, help="Filter by state (e.g. FL)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger("property_enrichment").setLevel(logging.DEBUG)

    run(args)
