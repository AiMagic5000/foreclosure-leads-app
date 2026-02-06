#!/usr/bin/env python3
"""
Trustee Sales Scraper - Foreclosure Overage Lead Generator

Scrapes completed foreclosure sales from trustee websites to identify properties
where the sale price exceeded the opening bid (overages). These overages represent
surplus funds owed to the previous homeowner.

Target Sites:
- Judicial Sales Corporation (tjsc.com) - Illinois
- Stox Quickbase - West Coast
- auction.com - National

Only captures sales to third-party buyers (not back to plaintiff/bank) with
overages exceeding $5,000.

Database: Supabase (foreclosure-db.alwaysencrypted.com)
Table: scraped_leads

Usage:
    python trustee_sales_scraper.py [--dry-run] [--verbose]
"""

import os
import sys
import time
import logging
import random
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Uses REST API directly (no supabase-py dependency)


# ============================================================================
# CONFIGURATION
# ============================================================================

SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_SERVICE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"

MINIMUM_OVERAGE = 5000  # Only pursue overages >= $5,000

# Rate limiting (seconds between requests)
REQUEST_DELAY_MIN = 3
REQUEST_DELAY_MAX = 5

# User agents for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

# Target trustee websites
TRUSTEE_SITES = {
    "tjsc": {
        "name": "Judicial Sales Corporation",
        "url": "https://www.tjsc.com",
        "state": "IL",
    },
    "stox": {
        "name": "Stox Quickbase",
        "url": "https://stox.quickbase.com",
        "state": "CA",
    },
    "auction_com": {
        "name": "Auction.com",
        "url": "https://www.auction.com",
        "states": ["GA", "TX", "FL", "CA", "AZ"],
    },
}


# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("trustee_sales_scraper.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


# ============================================================================
# HTTP SESSION WITH RETRIES
# ============================================================================

def create_session() -> requests.Session:
    """Create requests session with retry logic and random user agent."""
    session = requests.Session()

    # Retry strategy
    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    # Random user agent
    session.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    })

    return session


def rate_limit_delay():
    """Sleep for random duration between requests."""
    delay = random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX)
    time.sleep(delay)


# ============================================================================
# SUPABASE DATABASE
# ============================================================================

class ForeClosureDB:
    """Supabase database interface for foreclosure leads."""

    def __init__(self, url: str, service_key: str):
        self.client: Client = create_client(url, service_key)
        self.table = "scraped_leads"

    def lead_exists(self, case_number: str = None, address: str = None) -> bool:
        """Check if lead already exists by case number or address."""
        try:
            query = self.client.table(self.table).select("id")

            if case_number:
                query = query.eq("case_number", case_number)
            elif address:
                query = query.eq("property_address", address)
            else:
                return False

            result = query.execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error checking lead existence: {e}")
            return False

    def insert_lead(self, lead: Dict) -> bool:
        """Insert new foreclosure lead into database."""
        try:
            # Check for duplicates
            if lead.get("case_number"):
                if self.lead_exists(case_number=lead["case_number"]):
                    logger.info(f"Duplicate lead (case): {lead['case_number']}")
                    return False
            elif lead.get("property_address"):
                if self.lead_exists(address=lead["property_address"]):
                    logger.info(f"Duplicate lead (address): {lead['property_address']}")
                    return False

            # Insert lead
            result = self.client.table(self.table).insert(lead).execute()

            if result.data:
                logger.info(f"✓ Inserted lead: {lead.get('case_number', lead.get('property_address'))}")
                return True
            else:
                logger.error(f"Failed to insert lead: No data returned")
                return False

        except Exception as e:
            logger.error(f"Error inserting lead: {e}")
            return False

    def batch_insert_leads(self, leads: List[Dict]) -> Tuple[int, int]:
        """Insert multiple leads. Returns (success_count, failure_count)."""
        success = 0
        failure = 0

        for lead in leads:
            if self.insert_lead(lead):
                success += 1
            else:
                failure += 1

        return success, failure


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def parse_currency(value: str) -> Optional[float]:
    """Parse currency string to float.

    Examples:
        '$1,234.56' -> 1234.56
        '1234.56' -> 1234.56
        '$1,234' -> 1234.0
    """
    if not value:
        return None

    # Remove currency symbols, commas, whitespace
    cleaned = re.sub(r'[$,\s]', '', str(value))

    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def parse_date(date_str: str) -> Optional[str]:
    """Parse date string to ISO format (YYYY-MM-DD).

    Handles formats:
        - MM/DD/YYYY
        - YYYY-MM-DD
        - Month DD, YYYY
    """
    if not date_str:
        return None

    date_str = date_str.strip()

    # Try common formats
    formats = [
        "%m/%d/%Y",
        "%Y-%m-%d",
        "%B %d, %Y",
        "%b %d, %Y",
        "%m-%d-%Y",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    logger.warning(f"Could not parse date: {date_str}")
    return None


def calculate_overage(sale_amount: float, opening_bid: float) -> float:
    """Calculate overage (surplus funds) from sale."""
    if not sale_amount or not opening_bid:
        return 0.0

    overage = sale_amount - opening_bid
    return max(0.0, overage)


def is_third_party_sale(buyer_name: str, plaintiff_name: str = None) -> bool:
    """Determine if sale was to third-party buyer (not back to bank/plaintiff).

    Returns True if sold to third-party, False if sold back to bank.
    """
    if not buyer_name:
        return False

    buyer_lower = buyer_name.lower()

    # Keywords indicating sale back to plaintiff/bank
    bank_keywords = [
        "bank",
        "mortgage",
        "plaintiff",
        "beneficiary",
        "lender",
        "trust",
        "servicer",
        "federal",
        "national",
        "credit union",
    ]

    # Check if buyer contains bank keywords
    for keyword in bank_keywords:
        if keyword in buyer_lower:
            return False

    # If plaintiff name provided, check if buyer matches
    if plaintiff_name:
        if plaintiff_name.lower() in buyer_lower or buyer_lower in plaintiff_name.lower():
            return False

    return True


# ============================================================================
# SCRAPER: JUDICIAL SALES CORPORATION (tjsc.com)
# ============================================================================

class TJSCScraper:
    """Scraper for Judicial Sales Corporation (Illinois trustee)."""

    def __init__(self, session: requests.Session):
        self.session = session
        self.base_url = "https://www.tjsc.com"
        self.name = "Judicial Sales Corporation"

    def scrape(self) -> List[Dict]:
        """Scrape completed sales from TJSC."""
        logger.info(f"Starting scrape: {self.name}")
        leads = []

        try:
            # Navigate to completed sales
            # Note: TJSC structure may vary - this is a template
            url = f"{self.base_url}/completed-sales"

            logger.info(f"Fetching: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "lxml")

            # Parse sales table (adjust selectors based on actual site structure)
            sales_table = soup.find("table", class_=re.compile("sales|results|completed", re.I))

            if not sales_table:
                logger.warning(f"No sales table found on {url}")
                return leads

            rows = sales_table.find_all("tr")[1:]  # Skip header row

            for row in rows:
                try:
                    lead = self._parse_sale_row(row)
                    if lead:
                        leads.append(lead)
                except Exception as e:
                    logger.error(f"Error parsing row: {e}")
                    continue

            logger.info(f"Found {len(leads)} valid leads from {self.name}")

        except Exception as e:
            logger.error(f"Error scraping {self.name}: {e}")

        return leads

    def _parse_sale_row(self, row) -> Optional[Dict]:
        """Parse a single sale row from TJSC table."""
        cols = row.find_all("td")

        if len(cols) < 6:
            return None

        # Extract data (adjust indices based on actual table structure)
        sale_date = parse_date(cols[0].get_text(strip=True))
        case_number = cols[1].get_text(strip=True)
        address = cols[2].get_text(strip=True)
        opening_bid = parse_currency(cols[3].get_text(strip=True))
        sale_amount = parse_currency(cols[4].get_text(strip=True))
        buyer_name = cols[5].get_text(strip=True) if len(cols) > 5 else None

        # Validate required fields
        if not all([case_number, address, opening_bid, sale_amount]):
            return None

        # Check if third-party sale
        if buyer_name and not is_third_party_sale(buyer_name):
            logger.debug(f"Skipping sale back to plaintiff: {case_number}")
            return None

        # Calculate overage
        overage = calculate_overage(sale_amount, opening_bid)

        if overage < MINIMUM_OVERAGE:
            logger.debug(f"Overage too low (${overage:.2f}): {case_number}")
            return None

        # Build lead record for scraped_leads table
        lead = {
            "property_address": address,
            "case_number": case_number,
            "sale_date": sale_date,
            "opening_bid": opening_bid,
            "closing_bid": sale_amount,
            "overage_amount": overage,
            "trustee_name": self.name,
            "source_url": f"{self.base_url}/completed-sales",
            "source_type": "trustee_sale",
            "sale_type": "trustee-sale",
            "state_abbr": "IL",
        }

        logger.info(f"Valid lead: {case_number} - Overage: ${overage:,.2f}")
        return lead


# ============================================================================
# SCRAPER: STOX QUICKBASE (West Coast)
# ============================================================================

class StoxScraper:
    """Scraper for Stox Quickbase (West Coast trustee)."""

    def __init__(self, session: requests.Session):
        self.session = session
        self.base_url = "https://stox.quickbase.com"
        self.name = "Stox Quickbase"

    def scrape(self) -> List[Dict]:
        """Scrape completed sales from Stox."""
        logger.info(f"Starting scrape: {self.name}")
        leads = []

        try:
            # Look for "All Sales 60 Days Ago Forward"
            # Note: Quickbase sites often require authentication or have dynamic URLs
            # This is a template - adjust based on actual site structure

            url = f"{self.base_url}/db/main?a=q&qid=XXX"  # Replace XXX with actual query ID

            logger.info(f"Fetching: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "lxml")

            # Parse sales (Quickbase uses specific structure)
            # This is a placeholder - actual implementation depends on site structure
            logger.warning(f"Stox scraper needs site-specific implementation")

        except Exception as e:
            logger.error(f"Error scraping {self.name}: {e}")

        return leads


# ============================================================================
# SCRAPER: AUCTION.COM (National)
# ============================================================================

class AuctionComScraper:
    """Scraper for Auction.com (national foreclosure auctions).

    WARNING: auction.com removes data the day after sale, so scrape DAILY.
    """

    def __init__(self, session: requests.Session):
        self.session = session
        self.base_url = "https://www.auction.com"
        self.name = "Auction.com"
        self.target_states = ["GA", "TX", "FL", "CA", "AZ"]

    def scrape(self) -> List[Dict]:
        """Scrape completed sales from Auction.com."""
        logger.info(f"Starting scrape: {self.name}")
        leads = []

        for state in self.target_states:
            try:
                state_leads = self._scrape_state(state)
                leads.extend(state_leads)
                rate_limit_delay()
            except Exception as e:
                logger.error(f"Error scraping {state}: {e}")

        logger.info(f"Found {len(leads)} total leads from {self.name}")
        return leads

    def _scrape_state(self, state: str) -> List[Dict]:
        """Scrape completed sales for a specific state."""
        logger.info(f"Scraping {state} on {self.name}")
        leads = []

        try:
            # Search for foreclosure homes in state
            # Note: auction.com has complex JS-driven interface
            # This is a template - may need Selenium for full functionality

            url = f"{self.base_url}/search?location={state}&propertyType=foreclosure&status=sold"

            logger.info(f"Fetching: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "lxml")

            # Parse property listings
            # auction.com often loads content via JS - may need API reverse engineering
            logger.warning(f"Auction.com scraper may need Selenium/API implementation")

        except Exception as e:
            logger.error(f"Error scraping {state} on {self.name}: {e}")

        return leads


# ============================================================================
# MAIN SCRAPER ORCHESTRATOR
# ============================================================================

class TrusteeSalesScraper:
    """Main orchestrator for all trustee sale scrapers."""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.session = create_session()
        self.db = ForeClosureDB(SUPABASE_URL, SUPABASE_SERVICE_KEY) if not dry_run else None

        # Initialize individual scrapers
        self.scrapers = [
            TJSCScraper(self.session),
            # StoxScraper(self.session),  # Uncomment when implemented
            # AuctionComScraper(self.session),  # Uncomment when implemented
        ]

    def run(self) -> Dict:
        """Run all scrapers and collect leads."""
        logger.info("=" * 80)
        logger.info("Starting Trustee Sales Scraper")
        logger.info(f"Dry Run Mode: {self.dry_run}")
        logger.info(f"Minimum Overage: ${MINIMUM_OVERAGE:,}")
        logger.info("=" * 80)

        all_leads = []
        stats = {
            "total_scraped": 0,
            "valid_leads": 0,
            "inserted": 0,
            "duplicates": 0,
            "errors": 0,
        }

        # Run each scraper
        for scraper in self.scrapers:
            try:
                leads = scraper.scrape()
                all_leads.extend(leads)
                stats["total_scraped"] += len(leads)
                rate_limit_delay()
            except Exception as e:
                logger.error(f"Scraper failed ({scraper.name}): {e}")
                stats["errors"] += 1

        stats["valid_leads"] = len(all_leads)

        # Insert leads into database
        if not self.dry_run and all_leads:
            logger.info(f"Inserting {len(all_leads)} leads into database...")
            success, failure = self.db.batch_insert_leads(all_leads)
            stats["inserted"] = success
            stats["duplicates"] = failure
        elif self.dry_run:
            logger.info("DRY RUN - Would insert:")
            for lead in all_leads:
                logger.info(f"  - {lead.get('case_number', 'N/A')} | "
                           f"{lead.get('property_address')} | "
                           f"Overage: ${lead.get('overage_amount', 0):,.2f}")

        # Summary
        logger.info("=" * 80)
        logger.info("Scraping Complete")
        logger.info(f"Total Leads Scraped: {stats['total_scraped']}")
        logger.info(f"Valid Leads (>${MINIMUM_OVERAGE:,} overage): {stats['valid_leads']}")
        logger.info(f"Successfully Inserted: {stats['inserted']}")
        logger.info(f"Duplicates Skipped: {stats['duplicates']}")
        logger.info(f"Errors: {stats['errors']}")
        logger.info("=" * 80)

        return stats


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Scrape trustee sales for foreclosure overages"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without inserting to database"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Run scraper
    scraper = TrusteeSalesScraper(dry_run=args.dry_run)
    stats = scraper.run()

    # Exit code based on results
    if stats["errors"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
