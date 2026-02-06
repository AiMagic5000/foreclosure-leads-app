#!/usr/bin/env python3
"""
County Surplus Funds Scraper
Discovers and scrapes excess funds/overage lists from county websites.
Designed to run as a cron job - safe for repeated execution.
"""

import os
import sys
import time
import json
import logging
import hashlib
import re
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse
import random

import requests
from bs4 import BeautifulSoup
import pdfplumber

# Supabase configuration
SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_SERVICE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
SUPABASE_TABLE = "scraped_leads"

# Target counties
TARGET_COUNTIES = [
    {"name": "Gwinnett County", "state": "GA"},
    {"name": "Fulton County", "state": "GA"},
    {"name": "DeKalb County", "state": "GA"},
    {"name": "Harris County", "state": "TX"},
    {"name": "Dallas County", "state": "TX"},
    {"name": "Tarrant County", "state": "TX"},
    {"name": "Maricopa County", "state": "AZ"},
    {"name": "Pinal County", "state": "AZ"},
    {"name": "Orange County", "state": "CA"},
    {"name": "Los Angeles County", "state": "CA"},
    {"name": "San Bernardino County", "state": "CA"},
    {"name": "Miami-Dade County", "state": "FL"},
    {"name": "Broward County", "state": "FL"},
    {"name": "Hillsborough County", "state": "FL"},
    {"name": "Palm Beach County", "state": "FL"},
]

# Known county URLs (to augment Google search results)
KNOWN_COUNTY_URLS = {
    "Gwinnett County, GA": "https://www.gwinnettcounty.com/web/gwinnett/departments/taxcommissioner/taxsales",
    "Fulton County, GA": "https://www.fultoncountyga.gov/services/tax-and-revenue/real-property/tax-sales",
    "Harris County, TX": "https://www.hctax.net/Property/PropertyTax",
    "Dallas County, TX": "https://www.dallascounty.org/departments/tax/",
    "Maricopa County, AZ": "https://treasurer.maricopa.gov/",
    "Miami-Dade County, FL": "https://www.miamidade.gov/global/service.page?Mduid_service=ser1489091962836786",
    "Broward County, FL": "https://www.broward.org/RecordsTaxesTreasury/Pages/Default.aspx",
}

# User agents for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/county_surplus_scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class SupabaseClient:
    """Minimal Supabase client for lead management."""

    def __init__(self, url: str, service_key: str):
        self.url = url.rstrip('/')
        self.headers = {
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

    def check_lead_exists(self, property_address: str, owner_name: str) -> bool:
        """Check if lead already exists in database."""
        endpoint = f"{self.url}/rest/v1/{SUPABASE_TABLE}"
        params = {
            'property_address': f'eq.{property_address}',
            'owner_name': f'eq.{owner_name}',
            'select': 'id'
        }

        try:
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return len(response.json()) > 0
        except Exception as e:
            logger.error(f"Error checking lead existence: {e}")
            return False

    def insert_lead(self, lead_data: Dict) -> bool:
        """Insert new lead into database."""
        endpoint = f"{self.url}/rest/v1/{SUPABASE_TABLE}"

        try:
            response = requests.post(endpoint, headers=self.headers, json=lead_data, timeout=10)
            response.raise_for_status()
            logger.info(f"Inserted lead: {lead_data.get('owner_name')} - {lead_data.get('property_address')}")
            return True
        except Exception as e:
            logger.error(f"Error inserting lead: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return False


class CountySurplusScraper:
    """Main scraper for county surplus funds lists."""

    def __init__(self):
        self.db = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.session = requests.Session()
        self.download_dir = "/tmp/county_surplus_downloads"
        os.makedirs(self.download_dir, exist_ok=True)

    def get_random_user_agent(self) -> str:
        """Return random user agent."""
        return random.choice(USER_AGENTS)

    def rate_limit(self, min_delay: float = 2.0, max_delay: float = 5.0):
        """Random delay for rate limiting."""
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)

    def google_search(self, query: str, num_results: int = 10) -> List[str]:
        """
        Search Google for county surplus funds pages.
        Returns list of .gov URLs.
        """
        headers = {'User-Agent': self.get_random_user_agent()}
        search_url = "https://www.google.com/search"
        params = {'q': query, 'num': num_results}

        try:
            self.rate_limit(3, 6)  # Longer delay for Google
            response = self.session.get(search_url, headers=headers, params=params, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            urls = []

            # Parse Google result links
            for link in soup.find_all('a'):
                href = link.get('href', '')
                if '/url?q=' in href:
                    # Extract actual URL from Google redirect
                    url = href.split('/url?q=')[1].split('&')[0]
                    # Filter for .gov domains
                    if '.gov' in url and url.startswith('http'):
                        urls.append(url)

            logger.info(f"Google search '{query}' found {len(urls)} .gov URLs")
            return urls[:num_results]

        except Exception as e:
            logger.error(f"Google search failed for '{query}': {e}")
            return []

    def discover_county_urls(self, county_name: str, state: str) -> List[str]:
        """Discover URLs for county surplus funds pages."""
        urls = []

        # Check known URLs first
        county_key = f"{county_name}, {state}"
        if county_key in KNOWN_COUNTY_URLS:
            urls.append(KNOWN_COUNTY_URLS[county_key])
            logger.info(f"Using known URL for {county_key}")

        # Google search queries
        search_queries = [
            f"{county_name} {state} excess proceeds list",
            f"{county_name} {state} surplus funds tax sale",
            f"{county_name} {state} overbids list",
            f"{county_name} {state} tax sale overage",
            f"{county_name} {state} mortgage overage",
        ]

        for query in search_queries:
            found_urls = self.google_search(query, num_results=5)
            urls.extend(found_urls)
            self.rate_limit()

        # Deduplicate
        urls = list(set(urls))
        logger.info(f"Discovered {len(urls)} URLs for {county_name}, {state}")
        return urls

    def find_downloadable_files(self, url: str) -> List[Tuple[str, str]]:
        """
        Find downloadable PDF, Excel, CSV files on a page.
        Returns list of (url, file_type) tuples.
        """
        headers = {'User-Agent': self.get_random_user_agent()}
        files = []

        try:
            self.rate_limit()
            response = self.session.get(url, headers=headers, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Find all links
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(url, href)

                # Check file extensions
                if any(ext in href.lower() for ext in ['.pdf', '.xls', '.xlsx', '.csv']):
                    if '.pdf' in href.lower():
                        file_type = 'pdf'
                    elif '.csv' in href.lower():
                        file_type = 'csv'
                    else:
                        file_type = 'excel'

                    # Filter for surplus/excess/overage related files
                    link_text = link.get_text().lower()
                    if any(kw in link_text for kw in ['surplus', 'excess', 'overage', 'overbid', 'proceeds']):
                        files.append((full_url, file_type))

            logger.info(f"Found {len(files)} downloadable files at {url}")
            return files

        except Exception as e:
            logger.error(f"Error finding files at {url}: {e}")
            return []

    def download_file(self, url: str, file_type: str) -> Optional[str]:
        """Download file and return local path."""
        headers = {'User-Agent': self.get_random_user_agent()}

        # Generate filename from URL hash
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        ext = 'pdf' if file_type == 'pdf' else ('csv' if file_type == 'csv' else 'xlsx')
        filepath = os.path.join(self.download_dir, f"{url_hash}.{ext}")

        # Skip if already downloaded
        if os.path.exists(filepath):
            logger.info(f"File already downloaded: {filepath}")
            return filepath

        try:
            self.rate_limit()
            response = self.session.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            with open(filepath, 'wb') as f:
                f.write(response.content)

            logger.info(f"Downloaded {url} to {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Error downloading {url}: {e}")
            return None

    def parse_pdf(self, filepath: str, county_name: str, state: str, source_url: str) -> List[Dict]:
        """Parse PDF file to extract lead data."""
        leads = []

        try:
            with pdfplumber.open(filepath) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract tables
                    tables = page.extract_tables()

                    for table in tables:
                        if not table or len(table) < 2:
                            continue

                        # Try to identify header row
                        header = [str(cell).lower() if cell else '' for cell in table[0]]

                        # Look for key columns
                        name_idx = self._find_column_index(header, ['name', 'owner', 'defendant'])
                        address_idx = self._find_column_index(header, ['address', 'property', 'location'])
                        amount_idx = self._find_column_index(header, ['amount', 'proceeds', 'surplus', 'overage', 'excess'])
                        case_idx = self._find_column_index(header, ['case', 'number', 'parcel', 'apn'])

                        # Parse data rows
                        for row in table[1:]:
                            if not row or len(row) < 2:
                                continue

                            lead = self._extract_lead_from_row(
                                row, name_idx, address_idx, amount_idx, case_idx,
                                county_name, state, source_url
                            )

                            if lead:
                                leads.append(lead)

            logger.info(f"Parsed {len(leads)} leads from PDF {filepath}")
            return leads

        except Exception as e:
            logger.error(f"Error parsing PDF {filepath}: {e}")
            return []

    def _find_column_index(self, header: List[str], keywords: List[str]) -> Optional[int]:
        """Find column index by keywords."""
        for i, col in enumerate(header):
            if any(kw in col for kw in keywords):
                return i
        return None

    def _extract_lead_from_row(
        self, row: List, name_idx: Optional[int], address_idx: Optional[int],
        amount_idx: Optional[int], case_idx: Optional[int],
        county_name: str, state: str, source_url: str
    ) -> Optional[Dict]:
        """Extract lead data from table row."""
        try:
            # Extract fields
            owner_name = str(row[name_idx]).strip() if name_idx is not None else ''
            property_address = str(row[address_idx]).strip() if address_idx is not None else ''
            amount_str = str(row[amount_idx]).strip() if amount_idx is not None else '0'
            case_number = str(row[case_idx]).strip() if case_idx is not None else ''

            # Clean and validate
            if not owner_name or len(owner_name) < 3:
                return None

            if not property_address or len(property_address) < 5:
                return None

            # Parse amount
            amount = self._parse_amount(amount_str)

            # Parse city, state, zip from address
            city, zip_code = self._parse_address_components(property_address)

            # Build lead object
            lead = {
                'owner_name': owner_name,
                'property_address': property_address,
                'city': city or county_name.replace(' County', ''),
                'state_abbr': state,
                'zip_code': zip_code,
                'overage_amount': amount,
                'source_type': 'county_surplus',
                'source_url': source_url,
                'case_number': case_number,
                'county': county_name,
                'sale_type': 'tax-sale',
            }

            return lead

        except Exception as e:
            logger.debug(f"Error extracting lead from row: {e}")
            return None

    def _parse_amount(self, amount_str: str) -> float:
        """Parse amount string to float."""
        # Remove currency symbols, commas
        cleaned = re.sub(r'[^\d.]', '', amount_str)
        try:
            return float(cleaned) if cleaned else 0.0
        except:
            return 0.0

    def _parse_address_components(self, address: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract city and zip code from address string."""
        city = None
        zip_code = None

        # Look for zip code (5 digits)
        zip_match = re.search(r'\b(\d{5})\b', address)
        if zip_match:
            zip_code = zip_match.group(1)

        # Simple city extraction (word before state or zip)
        parts = address.split(',')
        if len(parts) >= 2:
            city = parts[-2].strip()
            # Remove state abbreviation if present
            city = re.sub(r'\s+[A-Z]{2}\s*$', '', city).strip()

        return city, zip_code

    def parse_csv(self, filepath: str, county_name: str, state: str, source_url: str) -> List[Dict]:
        """Parse CSV file to extract lead data."""
        import csv
        leads = []

        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                rows = list(reader)

                if len(rows) < 2:
                    return []

                # Identify header
                header = [str(cell).lower() for cell in rows[0]]

                name_idx = self._find_column_index(header, ['name', 'owner', 'defendant'])
                address_idx = self._find_column_index(header, ['address', 'property', 'location'])
                amount_idx = self._find_column_index(header, ['amount', 'proceeds', 'surplus', 'overage'])
                case_idx = self._find_column_index(header, ['case', 'number', 'parcel', 'apn'])

                for row in rows[1:]:
                    lead = self._extract_lead_from_row(
                        row, name_idx, address_idx, amount_idx, case_idx,
                        county_name, state, source_url
                    )
                    if lead:
                        leads.append(lead)

            logger.info(f"Parsed {len(leads)} leads from CSV {filepath}")
            return leads

        except Exception as e:
            logger.error(f"Error parsing CSV {filepath}: {e}")
            return []

    def parse_excel(self, filepath: str, county_name: str, state: str, source_url: str) -> List[Dict]:
        """Parse Excel file to extract lead data."""
        try:
            import openpyxl
            workbook = openpyxl.load_workbook(filepath, read_only=True)
            sheet = workbook.active

            rows = list(sheet.iter_rows(values_only=True))
            if len(rows) < 2:
                return []

            # Identify header
            header = [str(cell).lower() if cell else '' for cell in rows[0]]

            name_idx = self._find_column_index(header, ['name', 'owner', 'defendant'])
            address_idx = self._find_column_index(header, ['address', 'property', 'location'])
            amount_idx = self._find_column_index(header, ['amount', 'proceeds', 'surplus', 'overage'])
            case_idx = self._find_column_index(header, ['case', 'number', 'parcel', 'apn'])

            leads = []
            for row in rows[1:]:
                lead = self._extract_lead_from_row(
                    row, name_idx, address_idx, amount_idx, case_idx,
                    county_name, state, source_url
                )
                if lead:
                    leads.append(lead)

            logger.info(f"Parsed {len(leads)} leads from Excel {filepath}")
            return leads

        except ImportError:
            logger.error("openpyxl not installed - cannot parse Excel files")
            return []
        except Exception as e:
            logger.error(f"Error parsing Excel {filepath}: {e}")
            return []

    def process_county(self, county_name: str, state: str):
        """Process a single county - discover URLs, download files, extract leads."""
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing {county_name}, {state}")
        logger.info(f"{'='*60}")

        # Discover URLs
        urls = self.discover_county_urls(county_name, state)

        if not urls:
            logger.warning(f"No URLs found for {county_name}, {state}")
            return

        total_leads_inserted = 0

        # Process each URL
        for url in urls:
            logger.info(f"Scanning {url}")

            # Find downloadable files
            files = self.find_downloadable_files(url)

            for file_url, file_type in files:
                # Download file
                filepath = self.download_file(file_url, file_type)
                if not filepath:
                    continue

                # Parse file
                if file_type == 'pdf':
                    leads = self.parse_pdf(filepath, county_name, state, file_url)
                elif file_type == 'csv':
                    leads = self.parse_csv(filepath, county_name, state, file_url)
                else:  # excel
                    leads = self.parse_excel(filepath, county_name, state, file_url)

                # Insert leads
                for lead in leads:
                    # Check for duplicates
                    if self.db.check_lead_exists(lead['property_address'], lead['owner_name']):
                        logger.debug(f"Lead already exists: {lead['owner_name']}")
                        continue

                    # Insert
                    if self.db.insert_lead(lead):
                        total_leads_inserted += 1

                self.rate_limit()

        logger.info(f"Inserted {total_leads_inserted} new leads for {county_name}, {state}")

    def run(self):
        """Run scraper for all target counties."""
        logger.info(f"Starting County Surplus Scraper - {datetime.now()}")
        logger.info(f"Target counties: {len(TARGET_COUNTIES)}")

        for county in TARGET_COUNTIES:
            try:
                self.process_county(county['name'], county['state'])
            except Exception as e:
                logger.error(f"Error processing {county['name']}, {county['state']}: {e}")

            # Longer delay between counties
            self.rate_limit(5, 10)

        logger.info(f"County Surplus Scraper completed - {datetime.now()}")


def main():
    """Main entry point."""
    scraper = CountySurplusScraper()
    scraper.run()


if __name__ == '__main__':
    main()
