#!/usr/bin/env python3
"""
Waterfall Lead Enrichment Pipeline
====================================
Layer 1: PropMix → Get correct owner name + APN from property address
Layer 2: BatchData → Skip trace with APN + owner name → phone, email, current address
Layer 3: MillionVerifier → Verify emails before outreach
Layer 4: Update DB with enriched data

Usage:
  python3 waterfall_enrichment.py --limit 50
  python3 waterfall_enrichment.py --limit 50 --min-surplus 20000
  python3 waterfall_enrichment.py --dry-run --limit 10
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
log = logging.getLogger(__name__)

# API Keys
PROPMIX_TOKEN = "90ac87bffd53d2e41f6c40277b1c8b8e9f20a04df0b4a4929ca774e5e79f8265"
BATCHDATA_KEY = "4LVIbfF4pXF9Ejg6gsfkq2Xa2VyglgPYCPKjIHuX"
MILLIONVERIFIER_KEY = "OmAwrEQRicATEtyyyGyWkig5"

SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"

DB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def get_leads(min_surplus=5000, limit=50):
    """Get leads with property address but missing phone/email."""
    r = requests.get(f"{SUPABASE_URL}/rest/v1/foreclosure_leads", headers={**DB_HEADERS, "Prefer": ""},
        params={
            "select": "id,owner_name,property_address,city,state,county,overage_amount,parcel_id,apn_number",
            "or": "(primary_phone.is.null,primary_phone.eq.)",
            "property_address": "not.is.null",
            "status": "not.in.(senior_lead,business_entity,dead)",
            "overage_amount": f"gte.{min_surplus}",
            "order": "overage_amount.desc",
            "limit": str(limit),
        })
    if not r.ok:
        log.error(f"DB query failed: {r.status_code}")
        return []
    leads = r.json()
    # Filter out "No Street Address" and garbage
    return [l for l in leads if l.get("property_address", "").strip()
            and l["property_address"].strip() != "No Street Address"
            and len(l.get("owner_name", "").split()) >= 2]


def propmix_lookup(address, city, state):
    """Layer 1: Get property details from PropMix."""
    params = {"StreetAddress": address, "State": state, "OrderID": f"wf-{int(time.time())}"}
    if city:
        params["City"] = city
    try:
        r = requests.get("https://api.propmix.io/pubrec/assessor/v1/GetPropertyDetails",
            headers={"Access-Token": PROPMIX_TOKEN}, params=params, timeout=15)
        if r.ok:
            data = r.json().get("Data", {}).get("Listing", {})
            return {
                "apn": data.get("ParcelNumber", ""),
                "owner_name": data.get("OwnerName", ""),
                "county": data.get("County", ""),
                "fips": data.get("FIPS", ""),
                "mailing_address": data.get("MailingUnparsedAddress", ""),
                "mailing_city": data.get("MailingCity", ""),
                "mailing_state": data.get("MailingStateOrProvince", ""),
                "mailing_zip": data.get("MailingPostalCode", ""),
                "year_built": data.get("YearBuilt", ""),
                "sq_ft": data.get("LivingArea", ""),
                "assessed_value": data.get("AssessedValue", ""),
                "market_value": data.get("MarketValue", ""),
                "last_sale_seller": data.get("LastSaleSellerName", ""),
            }
    except Exception as e:
        log.warning(f"PropMix error: {e}")
    return None


def batchdata_skip_trace(first_name, last_name, apn, county, state):
    """Layer 2: Skip trace via BatchData using APN."""
    payload = {"firstName": first_name, "lastName": last_name}
    if apn and county and state:
        payload["apn"] = apn
        payload["county"] = county
        payload["state"] = state
    elif apn:
        payload["apn"] = apn
        payload["state"] = state
    else:
        return None

    try:
        r = requests.post("https://api.batchdata.com/api/v1/property/skip-trace",
            headers={"Authorization": f"Bearer {BATCHDATA_KEY}", "Content-Type": "application/json"},
            json={"requests": [payload]}, timeout=15)
        if r.ok:
            persons = r.json().get("results", {}).get("persons", [])
            if persons and persons[0].get("meta", {}).get("matched"):
                p = persons[0]
                phones = p.get("phoneNumbers", [])
                emails = p.get("emails", [])
                mailing = p.get("mailingAddress", {})
                name = p.get("name", {})
                dnc = p.get("dnc", {})
                best_phone = None
                for ph in phones:
                    if ph.get("type") == "Mobile" and ph.get("score", 0) >= 50:
                        best_phone = ph
                        break
                if not best_phone and phones:
                    best_phone = max(phones, key=lambda x: x.get("score", 0))
                return {
                    "name": name.get("full", ""),
                    "phone": best_phone["number"] if best_phone else "",
                    "phone_type": best_phone.get("type", "") if best_phone else "",
                    "phone_score": best_phone.get("score", 0) if best_phone else 0,
                    "email": emails[0].get("email", "") if emails else "",
                    "mailing_street": mailing.get("street", ""),
                    "mailing_city": mailing.get("city", ""),
                    "mailing_state": mailing.get("state", ""),
                    "mailing_zip": mailing.get("zip", ""),
                    "on_dnc": dnc.get("tcpa", False),
                    "is_litigator": p.get("litigator", False),
                }
    except Exception as e:
        log.warning(f"BatchData error: {e}")
    return None


def verify_email(email):
    """Layer 3: Verify email via MillionVerifier."""
    if not email:
        return False
    try:
        r = requests.get(f"https://api.millionverifier.com/api/v3/",
            params={"api": MILLIONVERIFIER_KEY, "email": email}, timeout=10)
        if r.ok:
            data = r.json()
            result = data.get("result", "")
            return result in ("ok", "catch_all")
    except:
        pass
    return False


def update_lead(lead_id, data):
    """Update lead in DB with enriched data."""
    update = {}
    if data.get("phone"):
        phone = data["phone"]
        if len(phone) == 10:
            phone = f"+1{phone}"
        elif len(phone) == 11 and phone.startswith("1"):
            phone = f"+{phone}"
        update["primary_phone"] = phone
        update["status"] = "skip_traced"
    if data.get("email"):
        update["primary_email"] = data["email"]
    if data.get("mailing_street"):
        update["mailing_address"] = f"{data['mailing_street']}, {data.get('mailing_city', '')}, {data.get('mailing_state', '')} {data.get('mailing_zip', '')}"
    if data.get("on_dnc") is not None:
        update["on_dnc"] = data["on_dnc"]
        update["can_contact"] = not data["on_dnc"]
        update["dnc_checked"] = True
    if data.get("apn"):
        update["apn_number"] = data["apn"]

    if not update:
        return False

    r = requests.patch(f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}",
        headers=DB_HEADERS, json=update)
    return r.ok


def parse_name(name):
    """Split owner name into first/last, handling 'LAST, FIRST' and 'FIRST LAST' formats."""
    name = re.sub(r'\b(ESTATE|EST|ETAL|ET AL|JR|SR|III|II|IV)\b', '', name, flags=re.I).strip()
    name = re.sub(r'\s+', ' ', name).strip()
    if ',' in name:
        parts = name.split(',', 1)
        last = parts[0].strip()
        first = parts[1].strip().split()[0] if parts[1].strip() else ""
    else:
        words = name.split()
        if len(words) >= 2:
            first = words[0]
            last = words[-1]
        else:
            first = name
            last = ""
    return first.title(), last.title()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--min-surplus", type=int, default=5000)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    log.info(f"=== Waterfall Enrichment Pipeline -- {datetime.now().isoformat()} ===")
    log.info(f"Limit: {args.limit} | Min surplus: ${args.min_surplus:,}")

    leads = get_leads(min_surplus=args.min_surplus, limit=args.limit)
    log.info(f"Leads to enrich: {len(leads)}")

    stats = {"total": len(leads), "propmix_hits": 0, "batch_hits": 0, "phones": 0, "emails": 0, "emails_verified": 0, "updated": 0, "propmix_calls": 0, "batch_calls": 0, "mv_calls": 0}

    for i, lead in enumerate(leads):
        lead_id = lead["id"]
        name = lead.get("owner_name", "")
        address = lead.get("property_address", "")
        city = lead.get("city", "")
        state = lead.get("state", "")
        county = lead.get("county", "")
        apn = lead.get("apn_number") or lead.get("parcel_id") or ""
        surplus = lead.get("overage_amount", 0) or 0

        first, last = parse_name(name)
        log.info(f"[{i+1}/{len(leads)}] {name} | ${surplus:,.0f} | {address[:30]} | {state}")

        enriched = {"apn": apn}

        # Layer 1: PropMix (if we don't have APN yet)
        if not apn and address and state:
            pm = propmix_lookup(address, city, state)
            stats["propmix_calls"] += 1
            if pm:
                stats["propmix_hits"] += 1
                apn = pm.get("apn", "")
                enriched["apn"] = apn
                if pm.get("county"):
                    county = pm["county"]
                log.info(f"  PropMix: APN={apn} | County={county}")
            else:
                log.info(f"  PropMix: no match")
            time.sleep(0.3)

        # Layer 2: BatchData skip trace
        if apn and first and last:
            bd = batchdata_skip_trace(first, last, apn, county, state)
            stats["batch_calls"] += 1
            if bd:
                stats["batch_hits"] += 1
                enriched.update(bd)
                if bd.get("phone"):
                    stats["phones"] += 1
                    log.info(f"  BatchData: Ph={bd['phone']} (score:{bd['phone_score']}, {bd['phone_type']}) | DNC:{bd['on_dnc']}")
                if bd.get("email"):
                    stats["emails"] += 1

                    # Layer 3: Verify email
                    if not args.dry_run:
                        valid = verify_email(bd["email"])
                        stats["mv_calls"] += 1
                        if valid:
                            stats["emails_verified"] += 1
                            log.info(f"  Email: {bd['email']} (VERIFIED)")
                        else:
                            enriched["email"] = ""  # Don't save bad emails
                            log.info(f"  Email: {bd['email']} (BOUNCED - removed)")
                else:
                    log.info(f"  BatchData: matched but no email")
            else:
                log.info(f"  BatchData: no match")
            time.sleep(0.3)
        else:
            log.info(f"  Skipped: missing APN or name")

        # Update DB
        if not args.dry_run and (enriched.get("phone") or enriched.get("apn")):
            if update_lead(lead_id, enriched):
                stats["updated"] += 1

    log.info("=" * 60)
    log.info("WATERFALL ENRICHMENT RESULTS")
    log.info("=" * 60)
    log.info(f"Total Leads:       {stats['total']}")
    log.info(f"PropMix Lookups:   {stats['propmix_calls']} ({stats['propmix_hits']} hits)")
    log.info(f"BatchData Traces:  {stats['batch_calls']} ({stats['batch_hits']} matched)")
    log.info(f"Phones Found:      {stats['phones']}")
    log.info(f"Emails Found:      {stats['emails']} ({stats['emails_verified']} verified)")
    log.info(f"DB Updated:        {stats['updated']}")
    log.info(f"Est. Cost: PropMix ${stats['propmix_calls']*0.075:.2f} + BatchData ${stats['batch_calls']*0.09:.2f} + MV ${stats['mv_calls']*0.0007:.2f} = ${stats['propmix_calls']*0.075 + stats['batch_calls']*0.09 + stats['mv_calls']*0.0007:.2f}")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
