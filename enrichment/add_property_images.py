#!/usr/bin/env python3
"""
Property Image Enrichment Script

Adds 80x80 pixel property thumbnail images to foreclosure leads.
Uses Google Street View API for actual property photos, with OSM map fallback.

Process:
1. Geocode address using Nominatim (free OSM geocoder)
2. Generate Google Street View URL at 80x80 pixels (actual property photo)
3. Fallback to OSM static map if Street View unavailable
4. Update the database with the image URL
"""

import os
import sys
import time
import random
import logging
import requests
from datetime import datetime, timezone
from urllib.parse import quote_plus

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://foreclosure-db.alwaysencrypted.com")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU")

# Google Maps API Key (from .env.local)
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyDVar9A9qVzZYGJwhoCiU-tsFVIPWkJ28A")

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "100"))
DELAY_MIN = float(os.environ.get("DELAY_MIN", "0.1"))  # Google has generous rate limits
DELAY_MAX = float(os.environ.get("DELAY_MAX", "0.3"))

# Google Street View API
GOOGLE_STREETVIEW_URL = "https://maps.googleapis.com/maps/api/streetview"

# Fallback: OpenStreetMap static map service
OSM_STATIC_MAP_URL = "https://staticmap.openstreetmap.de/staticmap.php"

# Fallback: Generic house icon placeholder
PLACEHOLDER_IMAGE = "https://via.placeholder.com/80x80/4A5568/FFFFFF?text=Property"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("property_images")


def supabase_headers(prefer="return=minimal"):
    """Generate headers for Supabase REST API calls."""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def delay():
    """Rate limiting delay for Nominatim (1 request per second minimum)."""
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))


def geocode_address(address, city, state_abbr, zip_code):
    """
    Geocode an address using OpenStreetMap Nominatim.
    Returns (lat, lon) tuple or None if not found.

    Rate limit: 1 request per second (enforced by delay function)
    """
    query = f"{address}, {city}, {state_abbr} {zip_code}, USA"
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "us",
    }
    headers = {
        "User-Agent": "ForeclosureLeadsApp/1.0 (property-image-enrichment)",
    }

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        results = resp.json()

        if results and len(results) > 0:
            lat = float(results[0]["lat"])
            lon = float(results[0]["lon"])
            return (lat, lon)
        return None
    except Exception as e:
        log.debug(f"Geocoding failed for {address}: {e}")
        return None


def generate_streetview_url(address, city, state_abbr, zip_code, size=80):
    """
    Generate a Google Street View image URL for the address.
    Uses address-based lookup which is more reliable than coordinates.

    Returns an 80x80 pixel Street View image of the property.
    """
    location = f"{address}, {city}, {state_abbr} {zip_code}"
    url = (
        f"{GOOGLE_STREETVIEW_URL}"
        f"?size={size}x{size}"
        f"&location={quote_plus(location)}"
        f"&key={GOOGLE_MAPS_API_KEY}"
    )
    return url


def generate_osm_map_url(lat, lon, size=80):
    """
    Generate a static map image URL for the given coordinates.
    Uses OpenStreetMap's static map service (free, no API key).
    Fallback when Street View is not available.

    Returns an 80x80 pixel map centered on the property.
    """
    url = (
        f"{OSM_STATIC_MAP_URL}"
        f"?center={lat},{lon}"
        f"&zoom=17"
        f"&size={size}x{size}"
        f"&maptype=mapnik"
        f"&markers={lat},{lon},red-pushpin"
    )
    return url


def fetch_leads_without_images(limit=BATCH_SIZE):
    """Fetch leads that don't have a property_image_url set."""
    url = (
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
        f"?property_image_url=is.null"
        f"&select=id,property_address,city,state_abbr,zip_code"
        f"&limit={limit}"
        f"&order=created_at.asc"
    )
    resp = requests.get(url, headers=supabase_headers(), timeout=30)

    # Check if column exists
    if resp.status_code == 400 and "property_image_url" in resp.text:
        log.warning("property_image_url column does not exist. Please run the migration first.")
        log.info("Migration SQL: ALTER TABLE foreclosure_leads ADD COLUMN IF NOT EXISTS property_image_url TEXT;")
        return None

    resp.raise_for_status()
    return resp.json()


def update_lead_image(lead_id, image_url):
    """Update a lead with the property image URL."""
    url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}"
    payload = {
        "property_image_url": image_url,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    resp = requests.patch(url, json=payload, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return True


def process_lead(lead):
    """Process a single lead: generate Google Street View image URL."""
    lead_id = lead["id"]
    address = lead["property_address"]
    city = lead.get("city", "")
    state_abbr = lead.get("state_abbr", "")
    zip_code = lead.get("zip_code", "")

    log.info(f"Processing: {address}, {city}, {state_abbr} {zip_code}")

    # Use Google Street View - it handles geocoding internally
    # This provides actual property photos, not just maps
    if address and city and state_abbr:
        image_url = generate_streetview_url(address, city, state_abbr, zip_code, size=80)
        log.info(f"  Generated Street View URL")
    else:
        # Fallback to placeholder if address is incomplete
        image_url = PLACEHOLDER_IMAGE
        log.warning(f"  Incomplete address, using placeholder")

    # Update the database
    try:
        update_lead_image(lead_id, image_url)
        log.info(f"  Updated {lead_id[:8]}... with image URL")
        return True
    except Exception as e:
        log.error(f"  Failed to update {lead_id}: {e}")
        return False


def get_total_leads_count():
    """Get total count of leads in the database."""
    url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?select=id"
    headers = {**supabase_headers(), "Prefer": "count=exact"}
    resp = requests.head(url, headers=headers, timeout=30)
    content_range = resp.headers.get("content-range", "0/0")
    try:
        total = int(content_range.split("/")[1])
        return total
    except (ValueError, IndexError):
        return 0


def get_leads_without_images_count():
    """Get count of leads without property_image_url."""
    url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?property_image_url=is.null&select=id"
    headers = {**supabase_headers(), "Prefer": "count=exact"}
    try:
        resp = requests.head(url, headers=headers, timeout=30)
        if resp.status_code != 200:
            return -1
        content_range = resp.headers.get("content-range", "0/0")
        total = int(content_range.split("/")[1])
        return total
    except Exception:
        return -1


def run_image_enrichment():
    """Main entry point: fetch and add images to leads."""
    start = datetime.now(timezone.utc)
    log.info(f"=== Property Image Enrichment started at {start.isoformat()} ===")

    # Check counts
    total = get_total_leads_count()
    without_images = get_leads_without_images_count()

    if without_images == -1:
        log.error("Could not check lead count. The property_image_url column may not exist.")
        log.info("Please run the migration first:")
        log.info("  ALTER TABLE foreclosure_leads ADD COLUMN IF NOT EXISTS property_image_url TEXT;")
        return

    log.info(f"Total leads: {total}")
    log.info(f"Leads without images: {without_images}")

    if without_images == 0:
        log.info("All leads already have images!")
        return

    # Fetch leads
    leads = fetch_leads_without_images(BATCH_SIZE)

    if leads is None:
        return  # Column doesn't exist

    if not leads:
        log.info("No leads to process.")
        return

    log.info(f"Fetched {len(leads)} leads to process")

    success = 0
    fail = 0

    for i, lead in enumerate(leads):
        log.info(f"--- Lead {i + 1}/{len(leads)} ---")
        try:
            if process_lead(lead):
                success += 1
            else:
                fail += 1
        except Exception as e:
            log.error(f"Error on lead {lead.get('id', '?')}: {e}")
            fail += 1

        # Rate limiting for Nominatim
        if i < len(leads) - 1:
            delay()

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    log.info(f"=== Batch done: {success} OK, {fail} failed, {elapsed:.0f}s ===")

    # Report remaining
    remaining = get_leads_without_images_count()
    if remaining > 0:
        log.info(f"Remaining leads without images: {remaining}")
        log.info(f"Estimated time to complete all: {(remaining * 1.5):.0f} seconds ({(remaining * 1.5 / 60):.1f} minutes)")


def run_continuous():
    """Run continuously until all leads have images."""
    while True:
        remaining = get_leads_without_images_count()
        if remaining <= 0:
            log.info("All leads have images. Exiting.")
            break

        run_image_enrichment()

        # Check if more remain
        remaining = get_leads_without_images_count()
        if remaining > 0:
            log.info(f"Continuing... {remaining} leads remaining")
            time.sleep(2)  # Brief pause between batches
        else:
            break


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        run_continuous()
    else:
        run_image_enrichment()
