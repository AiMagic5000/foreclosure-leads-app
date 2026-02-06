#!/usr/bin/env python3
"""
Skip Tracing Script for Foreclosure Leads

Performs automated skip tracing using free public people search websites:
- TruePeopleSearch.com (primary)
- FastPeopleSearch.com (backup)

Handles business entities by searching Secretary of State databases.
"""

import os
import sys
import time
import random
import logging
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote_plus
import json

import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# ============================================================================
# CONFIGURATION
# ============================================================================

SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"

BATCH_SIZE = 50
MAX_LEADS_PER_RUN = 100
MIN_DELAY = 5
MAX_DELAY = 10

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

BUSINESS_ENTITY_PATTERNS = [
    r'\bLLC\b', r'\bL\.L\.C\.\b',
    r'\bCorp\b', r'\bCorporation\b', r'\bInc\b', r'\bIncorporated\b',
    r'\bLP\b', r'\bL\.P\.\b', r'\bLimited Partnership\b',
    r'\bLTD\b', r'\bLimited\b',
    r'\bCo\b', r'\bCompany\b',
]

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers/skip_tracer.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_random_user_agent() -> str:
    """Return a random user agent string."""
    return random.choice(USER_AGENTS)

def clean_phone(phone: str) -> Optional[str]:
    """Clean and format phone number."""
    if not phone:
        return None
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    return None

def is_business_entity(name: str) -> bool:
    """Check if the name appears to be a business entity."""
    for pattern in BUSINESS_ENTITY_PATTERNS:
        if re.search(pattern, name, re.IGNORECASE):
            return True
    return False

def exponential_backoff(attempt: int) -> int:
    """Calculate exponential backoff delay in seconds."""
    return min(30 * (2 ** attempt), 240)

# ============================================================================
# SUPABASE CLIENT
# ============================================================================

class SupabaseClient:
    """Wrapper for Supabase operations. Supports both foreclosure_leads and scraped_leads tables."""

    def __init__(self, url: str, key: str, table: str = 'scraped_leads'):
        self.client: Client = create_client(url, key)
        self.table = table
        logger.info(f"Supabase client initialized (table: {table})")

    def get_leads_needing_skip_trace(self, limit: int = BATCH_SIZE) -> List[Dict]:
        """Fetch leads that need skip tracing."""
        try:
            response = self.client.table(self.table) \
                .select('*') \
                .eq('skip_traced', False) \
                .not_.is_('owner_name', 'null') \
                .neq('owner_name', 'Property Owner') \
                .limit(limit) \
                .execute()

            leads = response.data if response.data else []
            logger.info(f"Fetched {len(leads)} leads needing skip trace from {self.table}")
            return leads
        except Exception as e:
            logger.error(f"Error fetching leads: {e}")
            return []

    def update_lead(self, lead_id: str, data: Dict) -> bool:
        """Update a lead with skip trace results."""
        try:
            data['skip_traced'] = True
            data['skip_traced_at'] = datetime.utcnow().isoformat()

            response = self.client.table(self.table) \
                .update(data) \
                .eq('id', lead_id) \
                .execute()

            logger.info(f"Updated lead {lead_id} with skip trace data")
            return True
        except Exception as e:
            logger.error(f"Error updating lead {lead_id}: {e}")
            return False

# ============================================================================
# SKIP TRACING ENGINE
# ============================================================================

class SkipTracer:
    """Main skip tracing engine."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.backoff_attempts = {}

    def _get_with_retry(self, url: str, max_retries: int = 3) -> Optional[requests.Response]:
        """Make GET request with exponential backoff on failure."""
        site_key = url.split('/')[2]  # Extract domain

        if site_key in self.backoff_attempts:
            wait_time = exponential_backoff(self.backoff_attempts[site_key])
            logger.warning(f"Site {site_key} in backoff, waiting {wait_time}s")
            time.sleep(wait_time)

        for attempt in range(max_retries):
            try:
                self.session.headers['User-Agent'] = get_random_user_agent()
                response = self.session.get(url, timeout=30)

                # Check for CAPTCHA or blocking
                if 'captcha' in response.text.lower() or response.status_code == 403:
                    logger.warning(f"CAPTCHA/blocking detected on {site_key}, attempt {attempt + 1}")
                    self.backoff_attempts[site_key] = self.backoff_attempts.get(site_key, 0) + 1
                    if attempt < max_retries - 1:
                        time.sleep(exponential_backoff(attempt))
                        continue
                    return None

                # Success - reset backoff counter
                if site_key in self.backoff_attempts:
                    del self.backoff_attempts[site_key]

                response.raise_for_status()
                return response

            except requests.exceptions.RequestException as e:
                logger.error(f"Request error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(exponential_backoff(attempt))
                else:
                    return None

        return None

    def search_truepeoplesearch(self, name: str, state: str = None, city: str = None) -> Dict:
        """Search TruePeopleSearch.com for person information."""
        logger.info(f"Searching TruePeopleSearch for: {name} ({state or 'no state'})")

        # Build search URL
        query_parts = [name]
        if city and state:
            query_parts.append(f"{city} {state}")
        elif state:
            query_parts.append(state)

        query = quote_plus(' '.join(query_parts))
        search_url = f"https://www.truepeoplesearch.com/results?name={query}"

        response = self._get_with_retry(search_url)
        if not response:
            logger.warning(f"Failed to search TruePeopleSearch for {name}")
            return {}

        soup = BeautifulSoup(response.text, 'lxml')

        # Parse results (TruePeopleSearch structure - may need adjustment)
        results = {
            'phones': [],
            'emails': [],
            'addresses': [],
            'relatives': [],
            'associates': []
        }

        try:
            # Find first result card
            result_card = soup.find('div', class_='card')
            if not result_card:
                logger.info(f"No results found on TruePeopleSearch for {name}")
                return results

            # Extract phones
            phone_sections = result_card.find_all('a', href=re.compile(r'tel:'))
            for phone_link in phone_sections:
                phone_text = phone_link.get_text(strip=True)
                phone_clean = clean_phone(phone_text)
                if phone_clean:
                    # Try to detect phone type (wireless/landline)
                    phone_type = 'unknown'
                    parent_text = phone_link.parent.get_text() if phone_link.parent else ''
                    if 'wireless' in parent_text.lower() or 'mobile' in parent_text.lower() or 'cell' in parent_text.lower():
                        phone_type = 'wireless'
                    elif 'landline' in parent_text.lower():
                        phone_type = 'landline'

                    results['phones'].append({'number': phone_clean, 'type': phone_type})

            # Extract emails
            email_sections = result_card.find_all('a', href=re.compile(r'mailto:'))
            for email_link in email_sections:
                email = email_link.get_text(strip=True)
                if email and '@' in email:
                    results['emails'].append(email)

            # Extract addresses
            address_sections = result_card.find_all('div', class_=re.compile(r'address|location', re.I))
            for addr_div in address_sections:
                addr_text = addr_div.get_text(strip=True)
                if addr_text and len(addr_text) > 10:
                    results['addresses'].append(addr_text)

            # Extract relatives/associates
            relative_sections = result_card.find_all('div', class_=re.compile(r'relative|associate', re.I))
            for rel_div in relative_sections:
                rel_links = rel_div.find_all('a')
                for link in rel_links:
                    rel_name = link.get_text(strip=True)
                    if rel_name and len(rel_name) > 2:
                        if 'relative' in rel_div.get('class', []):
                            results['relatives'].append(rel_name)
                        else:
                            results['associates'].append(rel_name)

            logger.info(f"TruePeopleSearch found: {len(results['phones'])} phones, {len(results['emails'])} emails")

        except Exception as e:
            logger.error(f"Error parsing TruePeopleSearch results: {e}")

        return results

    def search_fastpeoplesearch(self, name: str, state: str = None) -> Dict:
        """Search FastPeopleSearch.com as backup."""
        logger.info(f"Searching FastPeopleSearch for: {name} ({state or 'no state'})")

        # Build search URL
        name_parts = name.lower().replace(',', '').split()
        if len(name_parts) >= 2:
            first_name = name_parts[0]
            last_name = name_parts[-1]

            if state:
                search_url = f"https://www.fastpeoplesearch.com/name/{first_name}-{last_name}_{state}"
            else:
                search_url = f"https://www.fastpeoplesearch.com/name/{first_name}-{last_name}"
        else:
            logger.warning(f"Name format not suitable for FastPeopleSearch: {name}")
            return {}

        response = self._get_with_retry(search_url)
        if not response:
            logger.warning(f"Failed to search FastPeopleSearch for {name}")
            return {}

        soup = BeautifulSoup(response.text, 'lxml')

        results = {
            'phones': [],
            'emails': [],
            'addresses': [],
            'relatives': [],
            'associates': []
        }

        try:
            # Find result cards (FastPeopleSearch structure - may need adjustment)
            result_cards = soup.find_all('div', class_=re.compile(r'card-block|result-item', re.I))

            if not result_cards:
                logger.info(f"No results found on FastPeopleSearch for {name}")
                return results

            # Parse first result
            first_card = result_cards[0]

            # Extract phones
            phone_links = first_card.find_all('a', href=re.compile(r'tel:'))
            for phone_link in phone_links:
                phone_text = phone_link.get_text(strip=True)
                phone_clean = clean_phone(phone_text)
                if phone_clean:
                    results['phones'].append({'number': phone_clean, 'type': 'unknown'})

            # Extract emails
            email_matches = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', first_card.get_text())
            results['emails'] = list(set(email_matches))

            # Extract addresses
            address_divs = first_card.find_all('div', class_=re.compile(r'address', re.I))
            for addr_div in address_divs:
                addr_text = addr_div.get_text(strip=True)
                if addr_text and len(addr_text) > 10:
                    results['addresses'].append(addr_text)

            # Extract relatives
            relative_divs = first_card.find_all('div', class_=re.compile(r'relative|family', re.I))
            for rel_div in relative_divs:
                rel_links = rel_div.find_all('a')
                for link in rel_links:
                    rel_name = link.get_text(strip=True)
                    if rel_name and len(rel_name) > 2:
                        results['relatives'].append(rel_name)

            logger.info(f"FastPeopleSearch found: {len(results['phones'])} phones, {len(results['emails'])} emails")

        except Exception as e:
            logger.error(f"Error parsing FastPeopleSearch results: {e}")

        return results

    def cross_reference_addresses(self, found_addresses: List[str], property_address: str) -> bool:
        """Check if any found addresses match the foreclosed property address."""
        if not property_address:
            return False

        # Normalize addresses for comparison
        prop_norm = re.sub(r'\W+', '', property_address.lower())

        for addr in found_addresses:
            addr_norm = re.sub(r'\W+', '', addr.lower())
            # Check if at least 60% of property address characters are in found address
            match_ratio = sum(1 for c in prop_norm if c in addr_norm) / len(prop_norm) if prop_norm else 0
            if match_ratio > 0.6:
                logger.info(f"Address match found: {addr} ~= {property_address}")
                return True

        return False

    def search_secretary_of_state(self, business_name: str, state: str) -> List[str]:
        """
        Search Secretary of State business entity database.
        Returns list of names (registered agent, officers, etc.)

        NOTE: Each state has different SOS website structure.
        This is a placeholder that would need state-specific implementations.
        """
        logger.info(f"Business entity detected: {business_name} in {state}")

        # State-specific SOS search would go here
        # For now, just log and return empty list
        logger.warning("Secretary of State search not yet implemented - skipping")

        return []

    def skip_trace_lead(self, lead: Dict) -> Dict:
        """Perform skip tracing on a single lead."""
        logger.info(f"Processing lead {lead['id']}: {lead['owner_name']}")

        owner_name = lead.get('owner_name')
        property_address = lead.get('property_address', '')
        state = lead.get('state_abbr')
        city = lead.get('city')

        if not owner_name or owner_name == 'Property Owner':
            logger.warning(f"Lead {lead['id']} has no valid owner name")
            return {}

        # Check if business entity
        if is_business_entity(owner_name):
            logger.info(f"Lead {lead['id']} is business entity: {owner_name}")
            entity_contacts = self.search_secretary_of_state(owner_name, state)

            # If we found entity contacts, skip trace them
            if entity_contacts:
                # For now, just use first contact
                owner_name = entity_contacts[0]
                logger.info(f"Skip tracing entity contact: {owner_name}")
            else:
                logger.warning(f"No entity contacts found for {owner_name}")
                return {}

        # Try TruePeopleSearch first
        results = self.search_truepeoplesearch(owner_name, state, city)

        # Rate limit between requests
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

        # If no results, try FastPeopleSearch
        if not results.get('phones') and not results.get('emails'):
            logger.info("No results from TruePeopleSearch, trying FastPeopleSearch")
            results = self.search_fastpeoplesearch(owner_name, state)
            time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

        # Cross-reference addresses with property address
        if results.get('addresses'):
            match_found = self.cross_reference_addresses(results['addresses'], property_address)
            if match_found:
                logger.info(f"Address cross-reference successful for lead {lead['id']}")
            else:
                logger.warning(f"No address match found for lead {lead['id']} - may be wrong person")

        # Build update data
        update_data = {}

        # Phones - prefer wireless over landline
        phones = results.get('phones', [])
        wireless_phones = [p for p in phones if p.get('type') == 'wireless']
        landline_phones = [p for p in phones if p.get('type') == 'landline']
        other_phones = [p for p in phones if p.get('type') == 'unknown']

        all_phones = wireless_phones + other_phones + landline_phones

        if all_phones:
            update_data['primary_phone'] = all_phones[0]['number']
            if len(all_phones) > 1:
                update_data['secondary_phone'] = all_phones[1]['number']

        # Emails
        emails = results.get('emails', [])
        if emails:
            update_data['primary_email'] = emails[0]

        # Associated names (relatives + associates)
        associated = results.get('relatives', []) + results.get('associates', [])
        if associated:
            update_data['relatives'] = associated[:10]  # Limit to 10

        # Current mailing address (first address that's NOT the property address)
        for addr in results.get('addresses', []):
            if addr.lower() != property_address.lower():
                update_data['current_address'] = addr
                break

        logger.info(f"Skip trace complete for lead {lead['id']}: "
                   f"{len(all_phones)} phones, {len(emails)} emails, "
                   f"{len(associated)} associated names")

        return update_data

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(description="Skip trace foreclosure leads")
    parser.add_argument(
        "--table",
        choices=["scraped_leads", "foreclosure_leads"],
        default="scraped_leads",
        help="Which table to read leads from (default: scraped_leads)"
    )
    args = parser.parse_args()

    logger.info("=" * 80)
    logger.info(f"Starting Skip Tracing Job (table: {args.table})")
    logger.info("=" * 80)

    # Initialize clients
    db = SupabaseClient(SUPABASE_URL, SUPABASE_KEY, table=args.table)
    tracer = SkipTracer()

    processed_count = 0
    success_count = 0

    while processed_count < MAX_LEADS_PER_RUN:
        # Fetch batch of leads
        leads = db.get_leads_needing_skip_trace(BATCH_SIZE)

        if not leads:
            logger.info("No more leads to process")
            break

        for lead in leads:
            if processed_count >= MAX_LEADS_PER_RUN:
                logger.info(f"Reached max leads per run ({MAX_LEADS_PER_RUN})")
                break

            try:
                # Skip trace the lead
                skip_trace_data = tracer.skip_trace_lead(lead)

                # Update database
                if skip_trace_data:
                    if db.update_lead(lead['id'], skip_trace_data):
                        success_count += 1
                else:
                    # Still mark as traced even if no data found
                    db.update_lead(lead['id'], {})

                processed_count += 1

                # Rate limit between leads
                time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

            except Exception as e:
                logger.error(f"Error processing lead {lead['id']}: {e}")
                continue

        if len(leads) < BATCH_SIZE:
            # No more leads available
            break

    logger.info("=" * 80)
    logger.info(f"Skip Tracing Job Complete")
    logger.info(f"Processed: {processed_count} leads")
    logger.info(f"Successful: {success_count} leads")
    logger.info("=" * 80)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nSkip tracing interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
