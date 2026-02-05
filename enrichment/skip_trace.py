#!/usr/bin/env python3
"""
Skip Trace Enrichment Script
Enriches foreclosure leads with phone numbers and emails from free public search sites.

Uses cloudscraper (Cloudflare bypass) with WhitePages and Addresses.com as primary sources.
TruePeopleSearch and FastPeopleSearch are CAPTCHA-protected and used as fallbacks only.

Usage:
    python skip_trace.py [--batch-size 50] [--delay 5] [--dry-run]

Environment Variables:
    SUPABASE_URL: Supabase project URL (default: https://foreclosure-db.alwaysencrypted.com)
    SUPABASE_SERVICE_KEY: Service role key
"""

import os
import re
import time
import logging
import random
import argparse
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote

import requests
import cloudscraper
from bs4 import BeautifulSoup

# Configuration
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://foreclosure-db.alwaysencrypted.com"
)
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
)

# Regex patterns
PHONE_PATTERN = re.compile(r'(\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4})')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
PARTIAL_EMAIL_PATTERN = re.compile(r'[a-z0-9*]+@[a-z0-9*]+\.[a-z]{2,}', re.IGNORECASE)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'skip_trace.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class SkipTraceEnricher:
    """Enriches foreclosure leads with contact information from public sources."""

    def __init__(self, batch_size: int = 50, delay: float = 5.0, dry_run: bool = False):
        """Initialize the enricher.

        Args:
            batch_size: Number of leads to process per batch
            delay: Seconds to wait between requests
            dry_run: If True, don't update database
        """
        self.batch_size = batch_size
        self.delay = delay
        self.dry_run = dry_run
        self.headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
        }

        # Create cloudscraper session for Cloudflare bypass
        self.scraper = cloudscraper.create_scraper(
            browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
        )

        # Statistics
        self.stats = {
            'total_processed': 0,
            'phones_found': 0,
            'emails_found': 0,
            'addresses_found': 0,
            'failed': 0,
            'whitepages_success': 0,
            'addresses_com_success': 0,
        }

    def parse_name(self, full_name: str) -> Tuple[str, str]:
        """Parse full name into first and last name.

        Args:
            full_name: Full name in "Last, First" or "First Last" format

        Returns:
            Tuple of (first_name, last_name)
        """
        full_name = full_name.strip()

        # Handle "Last, First" format
        if ',' in full_name:
            parts = full_name.split(',')
            last_name = parts[0].strip()
            first_name = parts[1].strip().split()[0] if len(parts) > 1 else ''
            return first_name, last_name

        # Handle "First Last" or "First Middle Last" format
        parts = full_name.split()
        if len(parts) >= 2:
            first_name = parts[0]
            last_name = parts[-1]
            return first_name, last_name

        # Single name - use as last name
        return '', full_name

    def normalize_phone(self, phone: str) -> str:
        """Normalize phone number to standard format.

        Args:
            phone: Raw phone number

        Returns:
            Normalized phone number (XXX-XXX-XXXX)
        """
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)

        # Format as XXX-XXX-XXXX
        if len(digits) == 10:
            return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == '1':
            return f"{digits[1:4]}-{digits[4:7]}-{digits[7:]}"

        return phone  # Return original if can't normalize

    def extract_phones(self, text: str) -> List[str]:
        """Extract phone numbers from text.

        Args:
            text: Text to search

        Returns:
            List of normalized phone numbers
        """
        phones = PHONE_PATTERN.findall(text)
        normalized = [self.normalize_phone(p) for p in phones]
        # Remove duplicates while preserving order
        seen = set()
        unique_phones = []
        for phone in normalized:
            if phone not in seen:
                seen.add(phone)
                unique_phones.append(phone)
        return unique_phones[:2]  # Return max 2 phones

    def extract_emails(self, text: str) -> List[str]:
        """Extract email addresses from text.

        Args:
            text: Text to search

        Returns:
            List of email addresses
        """
        # Domains to exclude (site navigation/contact emails, not person emails)
        EXCLUDED_DOMAINS = {
            'truepeoplesearch.com', 'fastpeoplesearch.com', 'whitepages.com',
            'addresses.com', 'spokeo.com', 'beenverified.com', 'intelius.com',
            'peoplefinder.com', 'pipl.com', 'countyoffice.org', 'example.com',
            'w3.org', 'schema.org', 'google.com', 'facebook.com', 'twitter.com',
        }

        # First try to find complete emails
        emails = EMAIL_PATTERN.findall(text)

        # If no complete emails, look for partial emails (e.g., j***n@gmail.com)
        if not emails:
            partial = PARTIAL_EMAIL_PATTERN.findall(text)
            emails = [e for e in partial if '*' not in e or e.count('*') < 5]

        # Remove duplicates and exclude site emails
        seen = set()
        unique_emails = []
        for email in emails:
            email_lower = email.lower()
            domain = email_lower.split('@')[-1] if '@' in email_lower else ''
            if email_lower not in seen and domain not in EXCLUDED_DOMAINS:
                seen.add(email_lower)
                unique_emails.append(email_lower)

        return unique_emails[:2]  # Return max 2 emails

    def extract_address(self, text: str, city: str, state: str) -> Optional[str]:
        """Extract current address from text.

        Args:
            text: Text to search
            city: Expected city
            state: Expected state

        Returns:
            Extracted address or None
        """
        # Look for patterns like "Current Address:", "Lives in:", or "Address:"
        address_patterns = [
            r'Current Address[:\s]+([^\n]+)',
            r'Lives in[:\s]+([^\n]+)',
            r'Address[:\s]+([^\n]+)',
            r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Boulevard|Blvd)[,\s]+' + re.escape(city),
        ]

        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                address = match.group(1) if len(match.groups()) > 0 else match.group(0)
                # Clean up the address
                address = address.strip().strip(',').strip()
                if len(address) > 20 and city.lower() in address.lower():
                    return address

        return None

    def fetch_html(self, url: str) -> Optional[str]:
        """Fetch HTML from a URL using cloudscraper (bypasses Cloudflare).

        Args:
            url: URL to fetch

        Returns:
            HTML content or None if failed
        """
        try:
            response = self.scraper.get(url, timeout=30)

            if response.status_code == 200:
                return response.text

            if response.status_code == 403:
                logger.warning(f"CAPTCHA/blocked for {url}: {response.status_code}")
            else:
                logger.warning(f"HTTP {response.status_code} for {url}")
            return None

        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None

    def search_whitepages(
        self,
        first_name: str,
        last_name: str,
        city: str,
        state: str
    ) -> Dict[str, any]:
        """Search WhitePages for contact information (PRIMARY SOURCE).

        Args:
            first_name: First name
            last_name: Last name
            city: City name
            state: State abbreviation

        Returns:
            Dictionary with extracted data
        """
        name_part = f"{first_name}-{last_name}"
        url = f"https://www.whitepages.com/name/{name_part}/{state}"

        logger.info(f"Searching WhitePages: {first_name} {last_name} in {state}")

        html = self.fetch_html(url)
        if not html:
            return {}

        data = {}
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator=' ')

        # Extract phones from HTML
        phones = self.extract_phones(text)
        if phones:
            data['primary_phone'] = phones[0]
            if len(phones) > 1:
                data['secondary_phone'] = phones[1]

        # Extract emails
        emails = self.extract_emails(text)
        if emails:
            data['primary_email'] = emails[0]
            if len(emails) > 1:
                data['secondary_email'] = emails[1]

        # Extract address - look for city match in structured data
        address = self.extract_address(text, city, state)
        if address:
            data['mailing_address'] = address

        if data:
            data['skip_trace_source'] = 'whitepages'
            self.stats['whitepages_success'] += 1

        return data

    def search_addresses_com(
        self,
        first_name: str,
        last_name: str,
        city: str,
        state: str
    ) -> Dict[str, any]:
        """Search Addresses.com for contact information (SECONDARY SOURCE).

        Args:
            first_name: First name
            last_name: Last name
            city: City name
            state: State abbreviation

        Returns:
            Dictionary with extracted data
        """
        name_part = f"{first_name}+{last_name}"
        url = f"https://www.addresses.com/people/{name_part}/{state}"

        logger.info(f"Searching Addresses.com: {first_name} {last_name} in {state}")

        html = self.fetch_html(url)
        if not html:
            return {}

        data = {}
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator=' ')

        # Extract phones
        phones = self.extract_phones(text)
        if phones:
            data['primary_phone'] = phones[0]
            if len(phones) > 1:
                data['secondary_phone'] = phones[1]

        # Extract emails
        emails = self.extract_emails(text)
        if emails:
            data['primary_email'] = emails[0]
            if len(emails) > 1:
                data['secondary_email'] = emails[1]

        # Extract address
        address = self.extract_address(text, city, state)
        if address:
            data['mailing_address'] = address

        if data:
            data['skip_trace_source'] = 'addresses.com'
            self.stats['addresses_com_success'] += 1

        return data

    def enrich_lead(self, lead: Dict) -> Dict[str, any]:
        """Enrich a single lead with contact information.

        Search order: WhitePages (best success) -> Addresses.com (backup).
        Both work with cloudscraper without CAPTCHA issues.

        Args:
            lead: Lead dictionary from database

        Returns:
            Dictionary with enriched data
        """
        first_name, last_name = self.parse_name(lead['owner_name'])
        city = lead.get('city', '')
        state = lead.get('state_abbr', '')

        if not first_name or not last_name:
            logger.warning(f"Could not parse name: {lead['owner_name']}")
            return {}

        # Try WhitePages first (most reliable, no CAPTCHA)
        data = self.search_whitepages(first_name, last_name, city, state)

        # Add random delay between requests
        time.sleep(random.uniform(self.delay, self.delay + 2))

        # If no phone found, try Addresses.com
        if not data.get('primary_phone'):
            data_ac = self.search_addresses_com(first_name, last_name, city, state)
            if data_ac:
                for key, value in data_ac.items():
                    if not data.get(key):
                        data[key] = value

        # Add timestamp
        if data:
            data['skip_traced_at'] = datetime.now(timezone.utc).isoformat()

        return data

    def update_lead(self, lead_id: int, data: Dict) -> bool:
        """Update a lead in Supabase.

        Args:
            lead_id: Lead ID
            data: Data to update

        Returns:
            True if successful
        """
        if self.dry_run:
            logger.info(f"DRY RUN: Would update lead {lead_id} with: {data}")
            return True

        try:
            url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}"
            response = requests.patch(url, json=data, headers=self.headers, timeout=30)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Error updating lead {lead_id}: {str(e)}")
            return False

    def fetch_leads_to_process(self, limit: int) -> List[Dict]:
        """Fetch leads that need enrichment.

        Args:
            limit: Maximum number of leads to fetch

        Returns:
            List of lead dictionaries
        """
        try:
            url = (
                f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
                f"?primary_phone=is.null"
                f"&owner_name=neq.Property%20Owner"
                f"&select=id,owner_name,property_address,city,state_abbr,zip_code"
                f"&limit={limit}"
                f"&order=created_at.asc"
            )
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching leads: {str(e)}")
            return []

    def process_batch(self, leads: List[Dict]):
        """Process a batch of leads.

        Args:
            leads: List of lead dictionaries
        """
        for i, lead in enumerate(leads, 1):
            logger.info(f"Processing lead {i}/{len(leads)}: {lead['owner_name']} ({lead['city']}, {lead['state_abbr']})")

            try:
                # Enrich the lead
                data = self.enrich_lead(lead)

                if data:
                    # Update statistics
                    if data.get('primary_phone'):
                        self.stats['phones_found'] += 1
                    if data.get('primary_email'):
                        self.stats['emails_found'] += 1
                    if data.get('mailing_address'):
                        self.stats['addresses_found'] += 1

                    # Update database
                    if self.update_lead(lead['id'], data):
                        logger.info(f"Successfully updated lead {lead['id']}")
                    else:
                        self.stats['failed'] += 1
                else:
                    logger.warning(f"No data found for lead {lead['id']}")
                    self.stats['failed'] += 1

                self.stats['total_processed'] += 1

            except Exception as e:
                logger.error(f"Error processing lead {lead['id']}: {str(e)}")
                self.stats['failed'] += 1

            # Progress update every 10 leads
            if i % 10 == 0:
                self.print_stats(interim=True)

    def print_stats(self, interim: bool = False):
        """Print processing statistics.

        Args:
            interim: If True, print as interim progress
        """
        prefix = "INTERIM STATS" if interim else "FINAL STATS"
        logger.info(f"\n{'='*60}")
        logger.info(f"{prefix}")
        logger.info(f"{'='*60}")
        logger.info(f"Total Processed: {self.stats['total_processed']}")
        logger.info(f"Phones Found: {self.stats['phones_found']}")
        logger.info(f"Emails Found: {self.stats['emails_found']}")
        logger.info(f"Addresses Found: {self.stats['addresses_found']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"\nSuccess by Source:")
        logger.info(f"  WhitePages: {self.stats['whitepages_success']}")
        logger.info(f"  Addresses.com: {self.stats['addresses_com_success']}")

        if self.stats['total_processed'] > 0:
            success_rate = (self.stats['phones_found'] / self.stats['total_processed']) * 100
            logger.info(f"\nSuccess Rate (Phone): {success_rate:.1f}%")

        logger.info(f"{'='*60}\n")

    def run(self, max_leads: int = 0):
        """Run the enrichment process.

        Args:
            max_leads: Maximum number of leads to process (0 = unlimited)
        """
        logger.info("Starting skip trace enrichment...")
        logger.info(f"Batch size: {self.batch_size}, Delay: {self.delay}s, Dry run: {self.dry_run}, Max leads: {max_leads or 'unlimited'}")

        total_processed = 0
        while True:
            # Check max leads limit
            remaining = self.batch_size
            if max_leads > 0:
                remaining = min(self.batch_size, max_leads - total_processed)
                if remaining <= 0:
                    logger.info(f"Reached max leads limit ({max_leads})")
                    break

            # Fetch next batch
            leads = self.fetch_leads_to_process(remaining)

            if not leads:
                logger.info("No more leads to process!")
                break

            logger.info(f"\nProcessing batch of {len(leads)} leads...")
            self.process_batch(leads)
            total_processed += len(leads)

            logger.info(f"Batch complete ({total_processed} total). Sleeping for {self.delay} seconds before next batch...")
            time.sleep(self.delay)

        # Print final statistics
        self.print_stats(interim=False)

        logger.info("Skip trace enrichment complete!")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Skip trace enrichment for foreclosure leads')
    parser.add_argument('--batch-size', type=int, default=50, help='Number of leads per batch')
    parser.add_argument('--delay', type=float, default=5.0, help='Seconds between requests')
    parser.add_argument('--dry-run', action='store_true', help='Run without updating database')
    parser.add_argument('--max-leads', type=int, default=0, help='Maximum leads to process (0=unlimited)')

    args = parser.parse_args()

    enricher = SkipTraceEnricher(
        batch_size=args.batch_size,
        delay=args.delay,
        dry_run=args.dry_run
    )

    try:
        enricher.run(max_leads=args.max_leads)
    except KeyboardInterrupt:
        logger.info("\n\nInterrupted by user. Printing final stats...")
        enricher.print_stats(interim=False)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        enricher.print_stats(interim=False)
        raise


if __name__ == '__main__':
    main()
