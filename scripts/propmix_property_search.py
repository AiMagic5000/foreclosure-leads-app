#!/usr/bin/env python3
"""
PropMix PropertySearch - Bulk APN/Parcel -> Property Address Lookup
===================================================================
Uses PropMix PROPERTYSEARCH API to fill in missing property addresses.
Only targets the highest service fee leads to conserve the 1,000 call limit.

Usage:
  python3 propmix_property_search.py                    # Run on top 100 leads
  python3 propmix_property_search.py --limit 50         # Limit batch
  python3 propmix_property_search.py --min-surplus 57000  # Only $20K+ service fee leads
  python3 propmix_property_search.py --dry-run           # Preview without API calls
"""

import os
import re
import sys
import json
import time
import logging
import argparse
from datetime import datetime

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

PROPMIX_TOKEN = "90ac87bffd53d2e41f6c40277b1c8b8e9f20a04df0b4a4929ca774e5e79f8265"
PROPMIX_SEARCH_URL = "https://api.propmix.io/propertysearch/v1/Search"

SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"

DB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

PM_HEADERS = {"access-token": PROPMIX_TOKEN}


def get_leads_needing_addresses(min_surplus=20000, limit=100):
    """Get leads with parcel_id but no property address, sorted by surplus desc."""
    params = {
        "select": "id,owner_name,parcel_id,county,state,state_abbr,overage_amount,city,zip_code",
        "or": "(property_address.is.null,property_address.eq.,property_address.eq.No Street Address)",
        "parcel_id": "not.is.null",
        "status": "not.in.(senior_lead,business_entity,dead)",
        "overage_amount": f"gte.{min_surplus}",
        "order": "overage_amount.desc",
        "limit": str(limit),
    }
    # Filter out parcel_ids that are actually owner names (bad data)
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/foreclosure_leads", headers=DB_HEADERS, params=params)
    if not resp.ok:
        logger.error(f"DB query failed: {resp.status_code} {resp.text[:200]}")
        return []
    leads = resp.json()
    # Filter out bad parcel_ids (contain spaces + look like names, or are empty)
    clean = []
    for lead in leads:
        pid = (lead.get("parcel_id") or "").strip()
        name = (lead.get("owner_name") or "").strip()
        if not pid or pid == name or len(pid) < 3:
            continue
        # Skip if parcel_id looks like a name (all letters + spaces)
        if re.match(r'^[A-Za-z\s,&]+$', pid):
            continue
        clean.append(lead)
    return clean


def search_by_apn(apn, state, county=None):
    """Search PropMix PropertySearch by APN/parcel number."""
    params = {"APN": apn, "State": state}
    if county:
        params["County"] = county
    try:
        resp = requests.get(PROPMIX_SEARCH_URL, headers=PM_HEADERS, params=params, timeout=15)
        if resp.status_code == 503:
            return {"error": "503_not_ready", "message": "PropertySearch API still provisioning"}
        if resp.status_code == 200:
            return resp.json()
        return {"error": resp.status_code, "message": resp.text[:200]}
    except Exception as e:
        return {"error": "exception", "message": str(e)[:200]}


def search_by_owner(owner_name, state, county=None):
    """Search PropMix PropertySearch by owner name."""
    params = {"OwnerName": owner_name, "State": state}
    if county:
        params["County"] = county
    try:
        resp = requests.get(PROPMIX_SEARCH_URL, headers=PM_HEADERS, params=params, timeout=15)
        if resp.status_code == 503:
            return {"error": "503_not_ready", "message": "PropertySearch API still provisioning"}
        if resp.status_code == 200:
            return resp.json()
        return {"error": resp.status_code, "message": resp.text[:200]}
    except Exception as e:
        return {"error": "exception", "message": str(e)[:200]}


def extract_address_from_result(result):
    """Extract property address from PropMix response."""
    if not isinstance(result, dict):
        return None
    data = result.get("Data", result.get("data", {}))
    if isinstance(data, list) and data:
        data = data[0]
    if not isinstance(data, dict):
        return None

    # Try common field names
    for addr_key in ["StreetAddress", "PropertyAddress", "Address", "SitusAddress", "SitusStreetAddress"]:
        addr = data.get(addr_key, "")
        if addr and len(addr) > 5:
            city = data.get("City", data.get("SitusCity", ""))
            state = data.get("State", data.get("SitusState", ""))
            zipcode = data.get("PostalCode", data.get("ZipCode", data.get("SitusZip", "")))
            return {
                "property_address": addr,
                "city": city,
                "state": state or data.get("StateAbbreviation", ""),
                "zip_code": zipcode,
            }
    return None


def update_lead_address(lead_id, address_data):
    """Update lead in DB with property address."""
    update = {k: v for k, v in address_data.items() if v}
    if not update:
        return False
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}",
        headers=DB_HEADERS,
        json=update,
    )
    return resp.ok


def main():
    parser = argparse.ArgumentParser(description="PropMix PropertySearch bulk lookup")
    parser.add_argument("--limit", type=int, default=100, help="Max leads to process")
    parser.add_argument("--min-surplus", type=int, default=20000, help="Min overage amount")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--retry-503", type=int, default=3, help="Retries if API returns 503")
    args = parser.parse_args()

    logger.info(f"=== PropMix PropertySearch - {datetime.now().isoformat()} ===")
    logger.info(f"Params: limit={args.limit}, min_surplus={args.min_surplus}, dry_run={args.dry_run}")

    leads = get_leads_needing_addresses(min_surplus=args.min_surplus, limit=args.limit)
    logger.info(f"Found {len(leads)} leads needing property addresses (${args.min_surplus}+ surplus)")

    if not leads:
        logger.info("No leads to process")
        return

    # Show top leads
    for i, lead in enumerate(leads[:5]):
        logger.info(f"  [{i+1}] {lead['owner_name']} | ${lead.get('overage_amount', 0):,.0f} | "
                     f"Parcel: {lead.get('parcel_id', 'N/A')[:30]} | {lead.get('county', '?')}, {lead.get('state', '?')}")

    if args.dry_run:
        logger.info("DRY RUN - no API calls made")
        return

    # Check if API is ready
    test = search_by_apn("test", "GA")
    if test.get("error") == "503_not_ready":
        logger.warning("PropertySearch API returning 503 - still provisioning. Retrying...")
        for attempt in range(args.retry_503):
            time.sleep(30)
            test = search_by_apn("test", "GA")
            if test.get("error") != "503_not_ready":
                break
            logger.info(f"  Retry {attempt+1}/{args.retry_503}...")
        if test.get("error") == "503_not_ready":
            logger.error("API still not ready. Try again later.")
            return

    stats = {"total": len(leads), "searched": 0, "found": 0, "not_found": 0, "errors": 0, "api_calls": 0}

    for i, lead in enumerate(leads):
        lead_id = lead["id"]
        name = lead.get("owner_name", "")
        parcel = lead.get("parcel_id", "")
        county = lead.get("county", "")
        state = lead.get("state") or lead.get("state_abbr") or ""

        logger.info(f"[{i+1}/{len(leads)}] {name} | Parcel: {parcel[:25]} | {county}, {state}")

        # Try APN search first
        result = search_by_apn(parcel, state, county)
        stats["api_calls"] += 1
        stats["searched"] += 1

        addr = extract_address_from_result(result)

        # If APN didn't work, try owner name search
        if not addr and name and len(name) >= 4:
            result = search_by_owner(name, state, county)
            stats["api_calls"] += 1
            addr = extract_address_from_result(result)

        if addr:
            logger.info(f"  FOUND: {addr['property_address']}, {addr.get('city', '')}, {addr.get('state', '')}")
            if update_lead_address(lead_id, addr):
                stats["found"] += 1
            else:
                logger.warning(f"  DB update failed for {lead_id}")
                stats["errors"] += 1
        else:
            error_msg = result.get("message", result.get("error", "unknown"))[:80]
            logger.info(f"  Not found: {error_msg}")
            stats["not_found"] += 1

        # Rate limit: 2 calls/sec max
        time.sleep(0.5)

    logger.info("=" * 60)
    logger.info("PROPMIX PROPERTY SEARCH RESULTS")
    logger.info("=" * 60)
    logger.info(f"Total Leads:    {stats['total']}")
    logger.info(f"Searched:       {stats['searched']}")
    logger.info(f"Addresses Found:{stats['found']}")
    logger.info(f"Not Found:      {stats['not_found']}")
    logger.info(f"Errors:         {stats['errors']}")
    logger.info(f"API Calls Used: {stats['api_calls']} of 1,000")
    logger.info(f"Success Rate:   {stats['found']/max(stats['searched'],1)*100:.1f}%")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
