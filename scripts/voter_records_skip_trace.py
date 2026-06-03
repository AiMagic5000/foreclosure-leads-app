#!/usr/bin/env python3
"""
Voter Records Skip Trace
=========================
FREE skip tracing via public voter registration records (VoterRecords.com).

Searches for foreclosure leads by name + state on VoterRecords.com, a public
records aggregator. Extracts phone numbers, current addresses, and registration
data to enrich leads that paid skip trace services missed.

Usage:
  python3 voter_records_skip_trace.py --limit 50
  python3 voter_records_skip_trace.py --limit 100 --state GA
  python3 voter_records_skip_trace.py --dry-run --limit 3
  python3 voter_records_skip_trace.py --dry-run --limit 5 --verbose

Requirements:
  pip3 install requests beautifulsoup4 lxml

Rate limiting: 2 seconds between requests (be respectful).
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
from urllib.parse import quote_plus

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip3 install requests beautifulsoup4 lxml")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://foreclosure-db.alwaysencrypted.com",
)
SUPABASE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU",
)

DB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

VOTERRECORDS_BASE = "https://voterrecords.com"

# Rotate user agents to reduce fingerprinting
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
]

# State abbreviation to full name mapping for VoterRecords URL paths
STATE_NAMES = {
    "AL": "alabama", "AK": "alaska", "AZ": "arizona", "AR": "arkansas",
    "CA": "california", "CO": "colorado", "CT": "connecticut", "DE": "delaware",
    "FL": "florida", "GA": "georgia", "HI": "hawaii", "ID": "idaho",
    "IL": "illinois", "IN": "indiana", "IA": "iowa", "KS": "kansas",
    "KY": "kentucky", "LA": "louisiana", "ME": "maine", "MD": "maryland",
    "MA": "massachusetts", "MI": "michigan", "MN": "minnesota", "MS": "mississippi",
    "MO": "missouri", "MT": "montana", "NE": "nebraska", "NV": "nevada",
    "NH": "new-hampshire", "NJ": "new-jersey", "NM": "new-mexico", "NY": "new-york",
    "NC": "north-carolina", "ND": "north-dakota", "OH": "ohio", "OK": "oklahoma",
    "OR": "oregon", "PA": "pennsylvania", "RI": "rhode-island", "SC": "south-carolina",
    "SD": "south-dakota", "TN": "tennessee", "TX": "texas", "UT": "utah",
    "VT": "vermont", "VA": "virginia", "WA": "washington", "WV": "west-virginia",
    "WI": "wisconsin", "WY": "wyoming",
}

# Minimum overage for 30% fee to be $5K+
MIN_OVERAGE = 16667

# Rate limiting
BASE_DELAY = 2.0
MAX_BACKOFF = 60.0

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def is_valid_person_name(name):
    """Check if a string looks like a real person's name (not garbage data).

    Real names: "JOHN DOE", "PEREZ PATRICIA ESCALANTE", "DOE, JOHN A"
    Garbage: "expected revenue for June 30", "Orem City", "Building Dept"
    """
    if not name or len(name) < 4:
        return False

    # Split on comma first for "LAST, FIRST" format
    if "," in name:
        parts = [p.strip() for p in name.split(",", 1)]
        # Both sides of comma must have content
        if not parts[0] or not parts[1]:
            return False
        # Check the last name part (before comma)
        last_words = parts[0].split()
        if not all(re.match(r"^[A-Za-z\-']+$", w) for w in last_words):
            return False
        # Check first name part (after comma) -- allow single-letter middle initials
        first_words = parts[1].split()
        if not first_words or not re.match(r"^[A-Za-z\-']+$", first_words[0]):
            return False
        for w in first_words:
            if not re.match(r"^[A-Za-z\-'\.]+$", w):
                return False
        all_words = last_words + first_words
    else:
        all_words = name.split()

    # Must have 2-4 words
    if len(all_words) < 2 or len(all_words) > 5:
        return False

    # Every word must be alphabetic (with hyphens/apostrophes), 2-15 chars
    for idx, w in enumerate(all_words):
        if not re.match(r"^[A-Za-z\-'\.]+$", w):
            return False
        clean = w.replace(".", "")
        if len(clean) > 15:
            return False
        # Allow single-letter middle initials but first and last must be 2+ chars
        # For comma format "LAST, FIRST M" -- the first word (last name) and
        # the word right after comma (first name) must be 2+ chars
        if len(clean) < 2:
            if idx == 0:
                return False
            # In non-comma format, last word must also be 2+
            if "," not in name and idx == len(all_words) - 1:
                return False

    name_upper = name.upper()

    # Business entity patterns (substring match)
    BUSINESS_PATTERNS = [
        "LLC", "INC", "CORP", "TRUST", "BANK", "ASSOC", "COMPANY", "CO.",
        "PROPERTIES", "HOLDINGS", "ESTATE OF", "UNKNOWN", "MORTGAGE",
        "INVESTMENTS", "ENTERPRISES", "PARTNERS", "GROUP", "SERVICES",
        "MANAGEMENT", "CAPITAL", "FINANCIAL", "REALTY", "DEVELOPMENT",
        "CONSTRUCTION", "CONSULTING", "SOLUTIONS", "SYSTEMS", "TECHNOLOGY",
        "INSURANCE", "FOUNDATION",
    ]
    if any(pat in name_upper for pat in BUSINESS_PATTERNS):
        return False

    # Stop words that never appear in person names (common English words)
    STOP_WORDS = {
        "THE", "AND", "FOR", "WAS", "NOT", "OF", "IN", "TO", "OR", "AT",
        "IS", "IT", "ON", "BY", "NO", "IF", "DO", "UP", "SO", "AN", "AS",
        "CITY", "STATE", "COUNTY", "TOTAL", "REVENUE", "LOSS", "DATE",
        "FROM", "DEPT", "SERVICE", "CENTER", "COURT", "CHECK", "TAX",
        "AUTO", "FUND", "FIRE", "BUILDING", "REAL", "ESTATE", "SECURITY",
        "JUVENILE", "CHILDREN", "VOLUNTEER", "MUNICIPAL", "EDUCATIONAL",
        "SALES", "BILLING", "SOFTWARE", "ALARM", "INSPECTION", "REFUND",
        "PLACEMENT", "REPLACEMENT", "REGIONAL", "COMMUNITY", "THIRD",
        "FIFTH", "EXPECTED", "ACTUAL", "RESULTING", "INCREASES", "SPENT",
        "CUMULATIVE", "MILES", "SHOWS", "YEARS", "PORTAL", "STATEWIDE",
        "TRIANGLE", "FORK", "SUMMIT", "DELTA", "GOLDEN", "PRINCE",
        "GEORGE", "SPANISH", "VALLEY", "CREEK", "LAKE", "NORTH",
        "SOUTH", "EAST", "WEST", "HARBOR", "DIAMOND", "MASONRY",
        "SPACE", "DEVELOPERS", "DEVELPERS", "SUNNY", "GENERAL",
        "NATIONAL", "AMERICAN", "UNITED", "FEDERAL", "CENTRAL",
    }
    if any(w.upper() in STOP_WORDS for w in all_words):
        return False

    # Name suffixes are OK but don't count as name words
    SUFFIXES = {"JR", "SR", "II", "III", "IV", "V", "ESQ"}
    real_words = [w for w in all_words if w.upper().rstrip(".") not in SUFFIXES]
    if len(real_words) < 2:
        return False

    # Block trust/entity abbreviations that slip through
    ENTITY_ABBRS = {"TR", "LP", "GP", "DBA", "AKA", "FKA", "NKA"}
    if any(w.upper().rstrip(".") in ENTITY_ABBRS for w in all_words):
        return False

    return True


def get_leads(limit=100, state_filter=None):
    """Fetch leads that need skip tracing from the DB.

    Criteria:
      - owner_name is a valid person name (2+ words, no business entities)
      - property_address exists (real leads have street addresses)
      - No primary_phone
      - overage_amount >= 16667 (30% fee = $5K+)
      - status NOT IN senior_lead, business_entity, dead
    """
    # Fetch a larger batch from DB to compensate for client-side filtering
    # Data is very dirty -- need 20x overfetch to find enough valid leads
    fetch_limit = min(limit * 20, 1000)

    params = {
        "select": "id,owner_name,property_address,mailing_address,city,state,state_abbr,county,overage_amount,status",
        "or": "(primary_phone.is.null,primary_phone.eq.)",
        "status": "not.in.(senior_lead,business_entity,dead)",
        "overage_amount": f"gte.{MIN_OVERAGE}",
        "owner_name": "not.is.null",
        "property_address": "not.is.null",
        "order": "overage_amount.desc",
        "limit": str(fetch_limit),
    }
    if state_filter:
        params["state_abbr"] = f"eq.{state_filter.upper()}"

    headers = {**DB_HEADERS, "Prefer": ""}
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads",
        headers=headers,
        params=params,
        timeout=30,
    )
    if not resp.ok:
        log.error("DB query failed: %s - %s", resp.status_code, resp.text[:300])
        return []

    leads = resp.json()
    filtered = []
    for lead in leads:
        if len(filtered) >= limit:
            break

        name = (lead.get("owner_name") or "").strip()
        addr = (lead.get("property_address") or "").strip()

        # Property address must start with a digit (real street address)
        if not addr or not re.match(r"^\d", addr):
            continue
        # Skip garbage addresses
        if addr in ("No Street Address",) or len(addr) < 5:
            continue

        # Validate person name
        if not is_valid_person_name(name):
            continue

        filtered.append(lead)

    log.info("Fetched %d leads from DB (%d valid after filtering)", len(leads), len(filtered))
    return filtered


def update_lead(lead_id, updates):
    """Update a lead record in the DB."""
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads",
        headers=DB_HEADERS,
        params={"id": f"eq.{lead_id}"},
        json=updates,
        timeout=15,
    )
    if not resp.ok:
        log.error("DB update failed for %s: %s", lead_id, resp.text[:200])
        return False
    return True


# ---------------------------------------------------------------------------
# Name parsing
# ---------------------------------------------------------------------------

def parse_owner_name(owner_name):
    """Parse owner_name into first and last name.

    Handles formats like:
      "JOHN DOE"
      "DOE, JOHN"
      "JOHN A DOE"
      "DOE JOHN A"
    """
    name = owner_name.strip()

    # Handle "LAST, FIRST" format
    if "," in name:
        parts = [p.strip() for p in name.split(",", 1)]
        last = parts[0]
        first = parts[1].split()[0] if parts[1] else ""
        return first.title(), last.title()

    words = name.split()
    if len(words) == 2:
        return words[0].title(), words[1].title()
    elif len(words) == 3:
        # Could be "FIRST MIDDLE LAST" or "FIRST LAST SUFFIX"
        suffixes = {"JR", "SR", "II", "III", "IV"}
        if words[2].upper() in suffixes:
            return words[0].title(), words[1].title()
        return words[0].title(), words[2].title()
    elif len(words) >= 4:
        return words[0].title(), words[-1].title()

    return words[0].title(), words[-1].title() if len(words) > 1 else ("", "")


# Reverse lookup: full state name -> abbreviation
STATE_ABBR_LOOKUP = {v.replace("-", " "): k for k, v in STATE_NAMES.items()}


def derive_state_abbr(lead):
    """Try to figure out the state abbreviation from various lead fields."""
    # 1. Direct state_abbr
    abbr = (lead.get("state_abbr") or "").strip().upper()
    if abbr and abbr in STATE_NAMES:
        return abbr

    # 2. State field -- could be abbreviation OR full name
    state_val = (lead.get("state") or "").strip()
    if state_val:
        # Check if it's already a 2-letter abbreviation
        if state_val.upper() in STATE_NAMES:
            return state_val.upper()
        # Check if it's a full state name
        matched = STATE_ABBR_LOOKUP.get(state_val.lower())
        if matched:
            return matched

    # 3. County field sometimes contains "State Portal (All Arkansas)" or state name
    county = (lead.get("county") or "").strip().lower()
    if county:
        for full_name, ab in STATE_ABBR_LOOKUP.items():
            if full_name in county:
                return ab

    # 4. Check mailing_address or property_address for state abbreviation
    for field in ("mailing_address", "property_address"):
        addr = (lead.get(field) or "").strip()
        if addr:
            # Look for ", XX " or ", XX\d" pattern (state abbr before zip)
            match = re.search(r",\s*([A-Z]{2})\s+\d{5}", addr)
            if match and match.group(1) in STATE_NAMES:
                return match.group(1)

    return None


# ---------------------------------------------------------------------------
# HTTP session
# ---------------------------------------------------------------------------

def build_session():
    """Build a requests session with browser-like headers."""
    session = requests.Session()
    ua = random.choice(USER_AGENTS)
    session.headers.update({
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
    })
    return session


# ---------------------------------------------------------------------------
# VoterRecords.com scraping
# ---------------------------------------------------------------------------

def search_voterrecords(session, first_name, last_name, state_abbr, city=None, county=None):
    """Search VoterRecords.com for a person by name and state.

    URL format: https://voterrecords.com/voters/{first}-{last}/{state-name}

    Returns dict with keys: phone, address, city, state, zip, registration_date, age, party
    or None if no match found.
    """
    state_name = STATE_NAMES.get(state_abbr.upper())
    if not state_name:
        log.warning("Unknown state abbreviation: %s", state_abbr)
        return None

    # Build the search URL
    first_clean = re.sub(r"[^a-zA-Z]", "", first_name).lower()
    last_clean = re.sub(r"[^a-zA-Z]", "", last_name).lower()

    if not first_clean or not last_clean:
        log.warning("Invalid name after cleaning: '%s %s'", first_name, last_name)
        return None

    url = f"{VOTERRECORDS_BASE}/voters/{first_clean}-{last_clean}/{state_name}"
    log.debug("Searching: %s", url)

    try:
        resp = session.get(url, timeout=20, allow_redirects=True)
    except requests.RequestException as exc:
        log.warning("Request failed for %s %s: %s", first_name, last_name, exc)
        return None

    # Handle rate limiting / blocks
    if resp.status_code == 429:
        log.warning("Rate limited (429). Backing off.")
        return {"_rate_limited": True}
    if resp.status_code == 403:
        log.warning("Forbidden (403). May be blocked.")
        return {"_blocked": True}
    if resp.status_code == 404:
        log.debug("No results page for %s %s in %s", first_name, last_name, state_abbr)
        return None
    if not resp.ok:
        log.warning("HTTP %d for %s %s", resp.status_code, first_name, last_name)
        return None

    return parse_voterrecords_results(resp.text, first_name, last_name, city, county)


def parse_voterrecords_results(html, first_name, last_name, target_city=None, target_county=None):
    """Parse VoterRecords.com search results page.

    The site typically shows a list of matching voters with:
    - Full name, age
    - Address (street, city, state, zip)
    - Party affiliation
    - Registration date
    - Phone number (sometimes)

    If multiple results, pick the one closest to the lead's known city/county.
    """
    soup = BeautifulSoup(html, "lxml")
    candidates = []

    # VoterRecords.com uses various card/div structures for results.
    # Look for voter result cards -- they use .voter-card, .result-card,
    # or simple divs with voter data.
    result_sections = soup.select(".voter-card, .result-card, .card, .voter-result")

    # Fallback: look for structured sections with name matches
    if not result_sections:
        result_sections = soup.find_all("div", class_=re.compile(r"voter|result|record", re.I))

    # If still nothing, try to parse the page as a single voter profile
    if not result_sections:
        result_sections = [soup]

    for section in result_sections:
        candidate = extract_voter_data(section, first_name, last_name)
        if candidate:
            candidates.append(candidate)

    if not candidates:
        # Try a broader extraction from the full page text
        candidate = extract_voter_from_text(soup.get_text(separator="\n"), first_name, last_name)
        if candidate:
            candidates.append(candidate)

    if not candidates:
        return None

    # If we have a target city or county, score candidates by proximity
    if target_city or target_county:
        best = pick_best_candidate(candidates, target_city, target_county)
        if best:
            return best

    # Return the first candidate (results are typically relevance-ordered)
    return candidates[0]


def extract_voter_data(element, first_name, last_name):
    """Extract voter registration data from an HTML element."""
    text = element.get_text(separator="\n", strip=True)
    if not text:
        return None

    # Verify the name appears in this section
    first_lower = first_name.lower()
    last_lower = last_name.lower()
    text_lower = text.lower()

    if first_lower not in text_lower or last_lower not in text_lower:
        return None

    data = {}

    # Extract phone number (various formats)
    phone_patterns = [
        r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
        r"\d{10}",
    ]
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            raw_phone = phone_match.group()
            cleaned = re.sub(r"[^\d]", "", raw_phone)
            if len(cleaned) == 10:
                data["phone"] = f"({cleaned[:3]}) {cleaned[3:6]}-{cleaned[6:]}"
                break

    # Extract address -- look for patterns like "123 Main St" followed by city/state/zip
    addr_pattern = r"(\d{1,6}\s+[A-Za-z0-9\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Cir|Circle|Ter|Terrace|Trl|Trail|Pkwy|Parkway|Hwy|Highway)[.,]?)"
    addr_match = re.search(addr_pattern, text, re.IGNORECASE)
    if addr_match:
        data["address"] = addr_match.group(1).strip().rstrip(",.")

    # Extract city, state, zip
    csz_pattern = r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)"
    csz_match = re.search(csz_pattern, text)
    if csz_match:
        data["city"] = csz_match.group(1).strip()
        data["state"] = csz_match.group(2).strip()
        data["zip"] = csz_match.group(3).strip()

    # Extract registration date
    date_patterns = [
        r"(?:Registered|Registration[:\s]+)(\d{1,2}/\d{1,2}/\d{2,4})",
        r"(?:Registered|Registration[:\s]+)(\d{4}-\d{2}-\d{2})",
        r"(?:Register(?:ed|ation)\s+Date[:\s]+)([A-Za-z]+\s+\d{1,2},?\s+\d{4})",
    ]
    for pattern in date_patterns:
        date_match = re.search(pattern, text, re.IGNORECASE)
        if date_match:
            data["registration_date"] = date_match.group(1).strip()
            break

    # Extract age
    age_match = re.search(r"(?:Age[:\s]+)(\d{2,3})", text, re.IGNORECASE)
    if age_match:
        data["age"] = age_match.group(1)

    # Extract party affiliation
    party_match = re.search(
        r"(?:Party|Affiliation)[:\s]+(Democrat|Republican|Independent|Libertarian|Green|No\s*Party|Unaffiliated|Non-Partisan|NPA)",
        text, re.IGNORECASE,
    )
    if party_match:
        data["party"] = party_match.group(1).strip()

    # Must have found at least address or phone to be useful
    if not data.get("phone") and not data.get("address"):
        return None

    return data


def extract_voter_from_text(full_text, first_name, last_name):
    """Fallback: extract voter data from raw page text when structured parsing fails."""
    first_lower = first_name.lower()
    last_lower = last_name.lower()

    if first_lower not in full_text.lower() or last_lower not in full_text.lower():
        return None

    data = {}

    # Phone
    phone_match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", full_text)
    if phone_match:
        cleaned = re.sub(r"[^\d]", "", phone_match.group())
        if len(cleaned) == 10:
            data["phone"] = f"({cleaned[:3]}) {cleaned[3:6]}-{cleaned[6:]}"

    # Address
    addr_match = re.search(
        r"(\d{1,6}\s+[A-Za-z0-9\s.]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl|Cir|Ter|Trl|Pkwy|Hwy))",
        full_text, re.IGNORECASE,
    )
    if addr_match:
        data["address"] = addr_match.group(1).strip()

    csz_match = re.search(r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+([A-Z]{2})\s+(\d{5})", full_text)
    if csz_match:
        data["city"] = csz_match.group(1)
        data["state"] = csz_match.group(2)
        data["zip"] = csz_match.group(3)

    if not data.get("phone") and not data.get("address"):
        return None

    return data


def pick_best_candidate(candidates, target_city=None, target_county=None):
    """Pick the best matching candidate based on city/county proximity."""
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    target_city_lower = (target_city or "").lower().strip()
    target_county_lower = (target_county or "").lower().strip().replace(" county", "")

    scored = []
    for cand in candidates:
        score = 0
        cand_city = (cand.get("city") or "").lower()
        cand_text = json.dumps(cand).lower()

        # Exact city match = high score
        if target_city_lower and target_city_lower == cand_city:
            score += 10
        # Partial city match
        elif target_city_lower and target_city_lower in cand_city:
            score += 5
        # County match in any field
        if target_county_lower and target_county_lower in cand_text:
            score += 7
        # Bonus for having a phone
        if cand.get("phone"):
            score += 3
        # Bonus for having an address
        if cand.get("address"):
            score += 2

        scored.append((score, cand))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_skip_trace(limit=100, state_filter=None, dry_run=False, verbose=False):
    """Main execution: fetch leads, search voter records, update DB."""
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    log.info("=" * 60)
    log.info("Voter Records Skip Trace - %s", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    log.info("Limit: %d | State: %s | Dry run: %s", limit, state_filter or "ALL", dry_run)
    log.info("=" * 60)

    # Fetch leads
    leads = get_leads(limit=limit, state_filter=state_filter)
    if not leads:
        log.info("No leads to process. Exiting.")
        return

    log.info("Processing %d leads...", len(leads))

    # Build HTTP session
    session = build_session()

    # Stats
    stats = {
        "total": len(leads),
        "searched": 0,
        "matches": 0,
        "phones_found": 0,
        "addresses_found": 0,
        "db_updated": 0,
        "errors": 0,
        "rate_limited": 0,
        "skipped_no_state": 0,
    }

    backoff = BASE_DELAY
    seen_names = set()  # Dedup by name+state to avoid searching same person twice

    for i, lead in enumerate(leads):
        lead_id = lead["id"]
        owner_name = lead.get("owner_name", "")
        state_abbr = lead.get("state_abbr") or ""
        city = lead.get("city") or ""
        county = lead.get("county") or ""
        overage = lead.get("overage_amount", 0)

        # Need a state abbreviation to search
        if not state_abbr:
            state_abbr = derive_state_abbr(lead)
            if not state_abbr:
                log.debug("Skipping lead %s - no state abbreviation", lead_id[:8])
                stats["skipped_no_state"] += 1
                continue

        first_name, last_name = parse_owner_name(owner_name)
        if not first_name or not last_name:
            log.debug("Skipping lead %s - can't parse name: %s", lead_id[:8], owner_name)
            continue

        # Dedup: skip if we already searched this name+state combo
        dedup_key = f"{first_name.lower()}|{last_name.lower()}|{state_abbr}"
        if dedup_key in seen_names:
            log.debug("Skipping duplicate: %s %s in %s", first_name, last_name, state_abbr)
            continue
        seen_names.add(dedup_key)

        log.info(
            "[%d/%d] %s %s | %s, %s | $%s",
            i + 1, len(leads), first_name, last_name,
            city or "?", state_abbr, f"{overage:,.0f}" if overage else "?",
        )

        stats["searched"] += 1

        if dry_run:
            url = f"{VOTERRECORDS_BASE}/voters/{first_name.lower()}-{last_name.lower()}/{STATE_NAMES.get(state_abbr.upper(), 'unknown')}"
            log.info("  [DRY RUN] Would search: %s", url)
            continue

        # Search VoterRecords.com
        result = search_voterrecords(session, first_name, last_name, state_abbr, city, county)

        # Handle rate limiting / blocks
        if result and result.get("_rate_limited"):
            stats["rate_limited"] += 1
            backoff = min(backoff * 2, MAX_BACKOFF)
            log.warning("  Rate limited. Backing off %.0f seconds.", backoff)
            time.sleep(backoff)
            continue

        if result and result.get("_blocked"):
            stats["rate_limited"] += 1
            log.warning("  Blocked (403). Stopping to avoid further blocks.")
            break

        if not result:
            log.info("  No match found on VoterRecords.com")
            time.sleep(backoff)
            continue

        # We found something
        stats["matches"] += 1
        phone = result.get("phone")
        address = result.get("address")
        voter_city = result.get("city")
        voter_state = result.get("state")
        voter_zip = result.get("zip")
        reg_date = result.get("registration_date")

        if phone:
            stats["phones_found"] += 1
            log.info("  PHONE FOUND: %s", phone)
        if address:
            stats["addresses_found"] += 1
            log.info("  ADDRESS: %s", address)
        if voter_city:
            log.info("  CITY/STATE/ZIP: %s, %s %s", voter_city, voter_state or "", voter_zip or "")
        if reg_date:
            log.info("  Registered: %s", reg_date)

        # Build DB update payload
        db_update = {
            "enrichment_source": "voter_records",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if phone:
            db_update["primary_phone"] = phone
            db_update["status"] = "skip_traced"

        # Build full mailing address if we got address components
        if address:
            mailing_parts = [address]
            if voter_city:
                mailing_parts.append(voter_city)
            if voter_state:
                mailing_parts.append(voter_state)
            if voter_zip:
                mailing_parts.append(voter_zip)
            full_mailing = ", ".join(mailing_parts)
            db_update["mailing_address"] = full_mailing

        # Store raw voter data in skip_trace_data JSONB
        voter_data = {
            "source": "voterrecords.com",
            "searched_at": datetime.now(timezone.utc).isoformat(),
            "first_name": first_name,
            "last_name": last_name,
            "raw_result": {k: v for k, v in result.items() if not k.startswith("_")},
        }
        db_update["skip_trace_data"] = json.dumps(voter_data)

        # Update DB
        if update_lead(lead_id, db_update):
            stats["db_updated"] += 1
            log.info("  DB updated successfully")
        else:
            stats["errors"] += 1
            log.error("  DB update failed")

        # Reset backoff on success, maintain rate limit
        backoff = BASE_DELAY
        delay = BASE_DELAY + random.uniform(0.5, 1.5)
        time.sleep(delay)

    # Print summary
    log.info("")
    log.info("=" * 60)
    log.info("RESULTS SUMMARY")
    log.info("=" * 60)
    log.info("Total leads queued:    %d", stats["total"])
    log.info("Searched:              %d", stats["searched"])
    log.info("Matches found:         %d", stats["matches"])
    log.info("Phones found:          %d", stats["phones_found"])
    log.info("Addresses found:       %d", stats["addresses_found"])
    log.info("DB records updated:    %d", stats["db_updated"])
    log.info("Errors:                %d", stats["errors"])
    log.info("Rate limited:          %d", stats["rate_limited"])
    log.info("Skipped (no state):    %d", stats["skipped_no_state"])
    if stats["searched"] > 0:
        match_rate = (stats["matches"] / stats["searched"]) * 100
        phone_rate = (stats["phones_found"] / stats["searched"]) * 100
        log.info("Match rate:            %.1f%%", match_rate)
        log.info("Phone find rate:       %.1f%%", phone_rate)
    log.info("=" * 60)

    return stats


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="FREE skip trace via public voter registration records (VoterRecords.com)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 voter_records_skip_trace.py --limit 50
  python3 voter_records_skip_trace.py --limit 100 --state GA
  python3 voter_records_skip_trace.py --dry-run --limit 3
  python3 voter_records_skip_trace.py --dry-run --limit 5 --verbose
        """,
    )
    parser.add_argument("--limit", type=int, default=100, help="Max leads to process (default: 100)")
    parser.add_argument("--state", type=str, default=None, help="Filter by state abbreviation (e.g. GA, OH)")
    parser.add_argument("--dry-run", action="store_true", help="Query DB and show URLs but don't scrape or update")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable debug logging")

    args = parser.parse_args()
    run_skip_trace(
        limit=args.limit,
        state_filter=args.state,
        dry_run=args.dry_run,
        verbose=args.verbose,
    )


if __name__ == "__main__":
    main()
