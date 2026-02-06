#!/usr/bin/env python3
"""
Foreclosure Leads Import Pipeline

Moves validated leads from scraped_leads staging table to foreclosure_leads production table.
Includes validation, deduplication, quality scoring, and comprehensive logging.

Usage:
    python3 import_pipeline.py              # Run import
    python3 import_pipeline.py --dry-run    # Preview without importing
"""

import argparse
import json
import logging
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlencode

import requests

# Supabase configuration (hardcoded for private server)
SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_SERVICE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"

# Validation thresholds
MIN_QUALITY_SCORE = 30
MIN_ADDRESS_LENGTH = 5
BATCH_SIZE = 100
RATE_LIMIT_DELAY = 0.5  # seconds between API calls

# State abbreviations for validation
VALID_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
}

# Source type to foreclosure type mapping
SOURCE_TYPE_MAPPING = {
    "county_surplus": "tax-sale-overage",
    "trustee_sale": "trustee-sale-overage",
    "auction": "auction",
    "tax_lien": "tax-lien",
    "sheriff_sale": "sheriff-sale",
    "hud_foreclosure": "hud-foreclosure",
    "reo": "bank-owned",
    "preforeclosure": "pre-foreclosure"
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('import_pipeline.log')
    ]
)
logger = logging.getLogger(__name__)


class SupabaseClient:
    """Simple Supabase REST API client."""

    def __init__(self, url: str, service_key: str):
        self.url = url.rstrip('/')
        self.headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with rate limiting."""
        url = f"{self.url}/rest/v1/{endpoint}"
        response = requests.request(method, url, headers=self.headers, **kwargs)
        time.sleep(RATE_LIMIT_DELAY)
        response.raise_for_status()
        return response

    def select(self, table: str, filters: Optional[Dict] = None,
               select: str = "*", limit: Optional[int] = None,
               offset: Optional[int] = None) -> List[Dict]:
        """Select records from table."""
        params = {"select": select}

        if filters:
            for key, value in filters.items():
                params[key] = value

        if limit:
            params["limit"] = limit

        if offset:
            params["offset"] = offset

        query_string = urlencode(params)
        response = self._request("GET", f"{table}?{query_string}")
        return response.json()

    def insert(self, table: str, data: List[Dict]) -> List[Dict]:
        """Insert records into table."""
        response = self._request("POST", table, json=data)
        return response.json()

    def update(self, table: str, filters: Dict, data: Dict) -> List[Dict]:
        """Update records in table."""
        filter_params = "&".join([f"{k}=eq.{v}" for k, v in filters.items()])
        response = self._request("PATCH", f"{table}?{filter_params}", json=data)
        return response.json()

    def count(self, table: str, filters: Optional[Dict] = None) -> int:
        """Count records in table."""
        params = {"select": "*", "count": "exact"}

        if filters:
            params.update(filters)

        query_string = urlencode(params)
        response = self._request("HEAD", f"{table}?{query_string}")

        content_range = response.headers.get("Content-Range", "")
        if "/" in content_range:
            return int(content_range.split("/")[1])

        return 0


class LeadValidator:
    """Validates and scores leads."""

    @staticmethod
    def is_valid_state(state: Optional[str]) -> bool:
        """Check if state code is valid."""
        if not state:
            return False
        return state.upper() in VALID_STATES

    @staticmethod
    def is_valid_owner_name(owner_name: Optional[str]) -> bool:
        """Check if owner name is valid."""
        if not owner_name:
            return False

        owner_clean = owner_name.strip().lower()

        if not owner_clean:
            return False

        if owner_clean in ["unknown", "n/a", "na", "none", "null"]:
            return False

        return True

    @staticmethod
    def is_valid_address(address: Optional[str]) -> bool:
        """Check if address is valid."""
        if not address:
            return False

        address_clean = address.strip()

        if len(address_clean) < MIN_ADDRESS_LENGTH:
            return False

        return True

    @staticmethod
    def calculate_quality_score(lead: Dict) -> Tuple[int, List[str]]:
        """
        Calculate quality score for a lead.

        Returns:
            Tuple of (score, list of reasons)
        """
        score = 0
        reasons = []

        # Overage amount (high value indicator)
        overage = lead.get("overage_amount") or 0
        if overage > 0:
            score += 20
            reasons.append(f"+20 has overage amount (${overage:,.2f})")

        # Case number (official record)
        if lead.get("case_number"):
            score += 20
            reasons.append("+20 has case number")

        # Contact information (phone or email, but skip traced)
        has_phone = bool(lead.get("primary_phone"))
        has_email = bool(lead.get("primary_email"))

        if has_phone or has_email:
            score += 15
            contact_types = []
            if has_phone:
                contact_types.append("phone")
            if has_email:
                contact_types.append("email")
            reasons.append(f"+15 has contact info ({', '.join(contact_types)})")

        # Complete location (city and zip)
        if lead.get("city") and lead.get("zip_code"):
            score += 15
            reasons.append("+15 has complete location")

        # Sale date (actionable timeline)
        if lead.get("sale_date"):
            score += 10
            reasons.append("+10 has sale date")

        # County (jurisdiction info)
        if lead.get("county"):
            score += 10
            reasons.append("+10 has county")

        # High-quality source types
        source_type = lead.get("source_type", "").lower()
        if source_type in ["county_surplus", "trustee_sale"]:
            score += 10
            reasons.append(f"+10 high-quality source ({source_type})")

        return score, reasons

    @staticmethod
    def validate_lead(lead: Dict) -> Tuple[bool, str, int, List[str]]:
        """
        Validate a lead for import.

        Returns:
            Tuple of (is_valid, validation_notes, quality_score, score_reasons)
        """
        validation_notes = []

        # Required field: owner_name
        if not LeadValidator.is_valid_owner_name(lead.get("owner_name")):
            return False, "Invalid or missing owner name", 0, []

        # Required field: property_address
        if not LeadValidator.is_valid_address(lead.get("property_address")):
            return False, "Invalid or missing property address", 0, []

        # Required field: state_abbr
        if not LeadValidator.is_valid_state(lead.get("state_abbr")):
            return False, "Invalid or missing state code", 0, []

        # Calculate quality score
        quality_score, score_reasons = LeadValidator.calculate_quality_score(lead)

        # Check minimum quality threshold
        if quality_score < MIN_QUALITY_SCORE:
            return False, f"Quality score too low ({quality_score} < {MIN_QUALITY_SCORE})", quality_score, score_reasons

        validation_notes.append(f"Valid lead with quality score {quality_score}")

        return True, "; ".join(validation_notes), quality_score, score_reasons


class LeadImporter:
    """Imports leads from staging to production."""

    def __init__(self, dry_run: bool = False):
        self.client = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.dry_run = dry_run
        self.validator = LeadValidator()

        # Statistics
        self.stats = {
            "total_processed": 0,
            "validated": 0,
            "imported": 0,
            "skipped_duplicate": 0,
            "rejected_validation": 0,
            "rejected_quality": 0,
            "errors": 0
        }

    def fetch_unimported_leads(self, limit: int = BATCH_SIZE, offset: int = 0) -> List[Dict]:
        """Fetch unimported leads from staging table."""
        logger.info(f"Fetching unimported leads (limit={limit}, offset={offset})")

        try:
            leads = self.client.select(
                "scraped_leads",
                filters={"imported": "eq.false"},
                limit=limit,
                offset=offset
            )

            logger.info(f"Fetched {len(leads)} leads")
            return leads

        except requests.HTTPError as e:
            logger.error(f"Error fetching leads: {e}")
            return []

    def check_duplicate(self, address: str, state: str) -> bool:
        """Check if lead already exists in production table."""
        try:
            existing = self.client.select(
                "foreclosure_leads",
                filters={
                    "property_address": f"eq.{address}",
                    "state_abbr": f"eq.{state}"
                },
                limit=1
            )

            return len(existing) > 0

        except requests.HTTPError as e:
            logger.error(f"Error checking duplicate: {e}")
            return True  # Assume duplicate on error to be safe

    def map_lead_fields(self, scraped_lead: Dict) -> Dict:
        """Map fields from scraped_leads to foreclosure_leads schema."""
        # Calculate sale amount (closing_bid or overage + opening_bid)
        sale_amount = scraped_lead.get("closing_bid")
        if not sale_amount:
            overage = scraped_lead.get("overage_amount") or 0
            opening = scraped_lead.get("opening_bid") or 0
            if overage > 0 or opening > 0:
                sale_amount = overage + opening

        # Use overage as proxy for estimated market value
        estimated_value = scraped_lead.get("overage_amount")
        if estimated_value and scraped_lead.get("opening_bid"):
            estimated_value += scraped_lead.get("opening_bid")

        # Map source type to foreclosure type
        source_type = scraped_lead.get("source_type", "").lower()
        foreclosure_type = SOURCE_TYPE_MAPPING.get(source_type, "other")

        # Build production lead record
        lead = {
            "owner_name": scraped_lead.get("owner_name"),
            "property_address": scraped_lead.get("property_address"),
            "city": scraped_lead.get("city"),
            "state_abbr": scraped_lead.get("state_abbr"),
            "zip_code": scraped_lead.get("zip_code"),
            "county": scraped_lead.get("county"),
            "case_number": scraped_lead.get("case_number"),
            "sale_date": scraped_lead.get("sale_date"),
            "foreclosure_type": foreclosure_type,
            "source": scraped_lead.get("source_url"),
            "primary_phone": scraped_lead.get("primary_phone"),
            "primary_email": scraped_lead.get("primary_email"),
            "trustee_name": scraped_lead.get("trustee_name"),
            "lat": scraped_lead.get("lat"),
            "lng": scraped_lead.get("lng"),
            "scraped_lead_id": scraped_lead.get("id"),  # Reference to staging record
            "created_at": datetime.utcnow().isoformat()
        }

        # Add financial fields if present
        if sale_amount:
            lead["sale_amount"] = sale_amount

        if estimated_value:
            lead["estimated_market_value"] = estimated_value

        if scraped_lead.get("opening_bid"):
            lead["mortgage_amount"] = scraped_lead.get("opening_bid")

        # Remove None values
        lead = {k: v for k, v in lead.items() if v is not None}

        return lead

    def import_lead(self, scraped_lead: Dict) -> bool:
        """
        Import a single lead from staging to production.

        Returns:
            True if imported, False if skipped/rejected
        """
        lead_id = scraped_lead.get("id")
        self.stats["total_processed"] += 1

        # Validate lead
        is_valid, validation_notes, quality_score, score_reasons = self.validator.validate_lead(scraped_lead)

        # Update staging record with validation results
        update_data = {
            "quality_score": quality_score,
            "validation_notes": validation_notes
        }

        if not is_valid:
            if quality_score < MIN_QUALITY_SCORE and quality_score > 0:
                self.stats["rejected_quality"] += 1
                logger.info(f"Rejected (low quality): {scraped_lead.get('owner_name')} - {validation_notes}")
            else:
                self.stats["rejected_validation"] += 1
                logger.warning(f"Rejected (validation): {scraped_lead.get('owner_name')} - {validation_notes}")

            if not self.dry_run:
                try:
                    self.client.update(
                        "scraped_leads",
                        filters={"id": lead_id},
                        data=update_data
                    )
                except requests.HTTPError as e:
                    logger.error(f"Error updating rejected lead {lead_id}: {e}")

            return False

        self.stats["validated"] += 1

        # Check for duplicates
        address = scraped_lead.get("property_address")
        state = scraped_lead.get("state_abbr")

        if self.check_duplicate(address, state):
            self.stats["skipped_duplicate"] += 1
            logger.info(f"Skipped (duplicate): {scraped_lead.get('owner_name')} at {address}")

            update_data["validation_notes"] = f"{validation_notes}; Duplicate - already in production"

            if not self.dry_run:
                try:
                    self.client.update(
                        "scraped_leads",
                        filters={"id": lead_id},
                        data=update_data
                    )
                except requests.HTTPError as e:
                    logger.error(f"Error updating duplicate lead {lead_id}: {e}")

            return False

        # Map fields for production table
        production_lead = self.map_lead_fields(scraped_lead)

        logger.info(f"Importing: {scraped_lead.get('owner_name')} at {address} (score: {quality_score})")

        if self.dry_run:
            logger.info(f"[DRY RUN] Would import: {json.dumps(production_lead, indent=2)}")
            logger.info(f"[DRY RUN] Quality score breakdown: {', '.join(score_reasons)}")
            self.stats["imported"] += 1
            return True

        # Insert into production table
        try:
            self.client.insert("foreclosure_leads", [production_lead])

            # Mark as imported in staging
            self.client.update(
                "scraped_leads",
                filters={"id": lead_id},
                data={
                    "imported": True,
                    "imported_at": datetime.utcnow().isoformat(),
                    "quality_score": quality_score,
                    "validation_notes": f"{validation_notes}; Imported successfully"
                }
            )

            self.stats["imported"] += 1
            logger.info(f"Imported successfully: {scraped_lead.get('owner_name')}")
            return True

        except requests.HTTPError as e:
            self.stats["errors"] += 1
            logger.error(f"Error importing lead {lead_id}: {e}")

            try:
                self.client.update(
                    "scraped_leads",
                    filters={"id": lead_id},
                    data={
                        "quality_score": quality_score,
                        "validation_notes": f"{validation_notes}; Import error: {str(e)}"
                    }
                )
            except requests.HTTPError as update_error:
                logger.error(f"Error updating lead after import failure: {update_error}")

            return False

    def run(self) -> Dict:
        """
        Run the import pipeline.

        Returns:
            Statistics dictionary
        """
        logger.info("=" * 80)
        logger.info("Starting Lead Import Pipeline")
        logger.info(f"Mode: {'DRY RUN' if self.dry_run else 'PRODUCTION'}")
        logger.info("=" * 80)

        start_time = time.time()

        # Count total unimported leads
        try:
            total_unimported = self.client.count(
                "scraped_leads",
                filters={"imported": "eq.false"}
            )
            logger.info(f"Total unimported leads in staging: {total_unimported}")
        except requests.HTTPError as e:
            logger.error(f"Error counting unimported leads: {e}")
            total_unimported = 0

        # Process in batches
        offset = 0

        while True:
            # Fetch batch
            leads = self.fetch_unimported_leads(limit=BATCH_SIZE, offset=offset)

            if not leads:
                logger.info("No more leads to process")
                break

            # Process each lead
            for lead in leads:
                self.import_lead(lead)

            # Move to next batch
            offset += BATCH_SIZE

            logger.info(f"Batch complete. Processed {self.stats['total_processed']} of ~{total_unimported} leads")

            # Stop if we've processed more than expected (safety check)
            if offset > total_unimported + BATCH_SIZE:
                break

        # Calculate duration
        duration = time.time() - start_time

        # Log final statistics
        logger.info("=" * 80)
        logger.info("Import Pipeline Complete")
        logger.info("=" * 80)
        logger.info(f"Duration: {duration:.2f} seconds")
        logger.info(f"Total Processed: {self.stats['total_processed']}")
        logger.info(f"Validated: {self.stats['validated']}")
        logger.info(f"Imported: {self.stats['imported']}")
        logger.info(f"Skipped (Duplicate): {self.stats['skipped_duplicate']}")
        logger.info(f"Rejected (Validation): {self.stats['rejected_validation']}")
        logger.info(f"Rejected (Low Quality): {self.stats['rejected_quality']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("=" * 80)

        # Calculate success rate
        if self.stats['total_processed'] > 0:
            success_rate = (self.stats['imported'] / self.stats['total_processed']) * 100
            logger.info(f"Success Rate: {success_rate:.1f}%")

        return self.stats


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Import validated leads from staging to production"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview import without making changes"
    )

    args = parser.parse_args()

    # Run import
    importer = LeadImporter(dry_run=args.dry_run)

    try:
        stats = importer.run()

        # Exit with error code if there were issues
        if stats['errors'] > 0:
            sys.exit(1)

        sys.exit(0)

    except KeyboardInterrupt:
        logger.warning("\nImport interrupted by user")
        sys.exit(130)

    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
