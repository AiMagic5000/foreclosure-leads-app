"""
Auction.com Scraper
Scrapes foreclosure listings from Auction.com - the largest online foreclosure marketplace.
"""

import asyncio
import re
from typing import Any, Optional
from datetime import datetime

from bs4 import BeautifulSoup

from .base import PlaywrightScraper, ForeclosureLead, ScrapeResult


class AuctionComScraper(PlaywrightScraper):
    """Scraper for Auction.com foreclosure listings."""

    name = "auction_com"
    source_type = "aggregator"
    requires_javascript = True
    rate_limit = 5  # Be conservative

    BASE_URL = "https://www.auction.com"
    SEARCH_URL = "https://www.auction.com/residential/foreclosure"

    async def scrape(self) -> ScrapeResult:
        """Scrape foreclosure listings from Auction.com."""
        start_time = datetime.utcnow()
        leads = []
        pages_scraped = 0

        try:
            async with self:
                # Build search URL with state filter
                url = self.SEARCH_URL
                if self.state_abbr:
                    url = f"{self.SEARCH_URL}?state={self.state_abbr}"

                self.logger.info("Starting Auction.com scrape", url=url)

                # Navigate to search page
                page = await self._context.new_page()
                await page.goto(url, timeout=60000)

                # Wait for listings to load
                await page.wait_for_selector(".property-card", timeout=30000)
                pages_scraped += 1

                # Scroll to load more results (infinite scroll)
                for _ in range(5):  # Load ~5 pages worth
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await asyncio.sleep(2)

                # Get page content
                content = await page.content()
                soup = BeautifulSoup(content, "lxml")

                # Find all property cards
                property_cards = soup.select(".property-card")
                self.logger.info(f"Found {len(property_cards)} property cards")

                for card in property_cards:
                    try:
                        lead = await self.parse_listing(card)
                        if lead:
                            leads.append(lead)
                    except Exception as e:
                        self.logger.warning("Failed to parse listing", error=str(e))
                        continue

                await page.close()

            duration = (datetime.utcnow() - start_time).total_seconds()

            return ScrapeResult(
                success=True,
                leads=leads,
                total_found=len(leads),
                new_count=len(leads),  # Will be calculated during insert
                duration_seconds=duration,
                pages_scraped=pages_scraped,
                source_url=url,
            )

        except Exception as e:
            self.logger.exception("Auction.com scrape failed", error=str(e))
            return ScrapeResult(
                success=False,
                error=str(e),
                error_details={"type": type(e).__name__},
                duration_seconds=(datetime.utcnow() - start_time).total_seconds(),
            )

    async def parse_listing(self, data: Any) -> Optional[ForeclosureLead]:
        """Parse an Auction.com property card into a ForeclosureLead."""
        try:
            # Extract address
            address_elem = data.select_one(".property-address")
            if not address_elem:
                return None

            full_address = address_elem.get_text(strip=True)

            # Parse address components
            # Format: "123 Main St, City, ST 12345"
            address_parts = full_address.split(",")
            street_address = address_parts[0].strip() if address_parts else ""

            city = ""
            state_abbr = self.state_abbr or ""
            zip_code = ""

            if len(address_parts) >= 2:
                city = address_parts[1].strip()
            if len(address_parts) >= 3:
                state_zip = address_parts[2].strip()
                state_zip_match = re.match(r"([A-Z]{2})\s*(\d{5})?", state_zip)
                if state_zip_match:
                    state_abbr = state_zip_match.group(1)
                    zip_code = state_zip_match.group(2) or ""

            # Extract price/bid
            price_elem = data.select_one(".property-price, .auction-price, .bid-amount")
            sale_amount = None
            if price_elem:
                sale_amount = self.parse_currency(price_elem.get_text())

            # Extract auction date
            date_elem = data.select_one(".auction-date, .sale-date")
            sale_date = None
            if date_elem:
                sale_date = self.parse_date(date_elem.get_text())

            # Extract property link for more details
            link_elem = data.select_one("a[href*='/property/']")
            source_url = None
            if link_elem:
                href = link_elem.get("href", "")
                source_url = href if href.startswith("http") else f"{self.BASE_URL}{href}"

            # Try to get owner name (may not be available on listing page)
            owner_name = "Property Owner"  # Default - will be updated via skip trace

            return ForeclosureLead(
                source=self.name,
                source_type=self.source_type,
                batch_id=self.batch_id,
                property_address=self.normalize_address(street_address),
                city=city,
                state_abbr=state_abbr,
                zip_code=zip_code,
                owner_name=owner_name,
                sale_date=sale_date,
                sale_amount=sale_amount,
                foreclosure_type="non-judicial",  # Most auction.com are non-judicial
                source_url=source_url,
                raw_data={"html": str(data)[:1000]},  # Store snippet for debugging
            )

        except Exception as e:
            self.logger.warning("Parse error", error=str(e))
            return None


class RealAuctionScraper(PlaywrightScraper):
    """
    Scraper for RealAuction.com.
    Used by many Florida counties for online foreclosure auctions.
    """

    name = "realauction"
    source_type = "county_auction"
    requires_javascript = True
    rate_limit = 10

    BASE_URL = "https://www.realauction.com"

    # Florida counties using RealAuction
    FLORIDA_COUNTIES = [
        "Alachua", "Baker", "Bay", "Bradford", "Brevard", "Broward",
        "Charlotte", "Citrus", "Clay", "Collier", "Columbia", "DeSoto",
        "Dixie", "Duval", "Escambia", "Flagler", "Franklin", "Gadsden",
        "Gilchrist", "Glades", "Gulf", "Hamilton", "Hardee", "Hendry",
        "Hernando", "Highlands", "Hillsborough", "Holmes", "Indian River",
        "Jackson", "Jefferson", "Lafayette", "Lake", "Lee", "Leon",
        "Levy", "Liberty", "Madison", "Manatee", "Marion", "Martin",
        "Miami-Dade", "Monroe", "Nassau", "Okaloosa", "Okeechobee",
        "Orange", "Osceola", "Palm Beach", "Pasco", "Pinellas", "Polk",
        "Putnam", "Santa Rosa", "Sarasota", "Seminole", "St. Johns",
        "St. Lucie", "Sumter", "Suwannee", "Taylor", "Union", "Volusia",
        "Wakulla", "Walton", "Washington",
    ]

    def __init__(self, county: Optional[str] = None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.county = county
        # Default to FL if no state provided
        if not self.state_abbr:
            self.state_abbr = "FL"

    async def scrape(self) -> ScrapeResult:
        """Scrape foreclosure auctions from RealAuction."""
        start_time = datetime.utcnow()
        leads = []
        pages_scraped = 0

        try:
            async with self:
                # Get auction calendar
                calendar_url = f"{self.BASE_URL}/foreclosure/{self.state_abbr.lower()}"
                if self.county:
                    calendar_url += f"/{self.county.lower().replace(' ', '-')}"

                self.logger.info("Starting RealAuction scrape", url=calendar_url)

                page = await self._context.new_page()
                await page.goto(calendar_url, timeout=60000)

                # Wait for auction listings
                try:
                    await page.wait_for_selector(".auction-item, .property-listing", timeout=15000)
                except Exception:
                    # No auctions found
                    self.logger.info("No auctions found on page")
                    await page.close()
                    return ScrapeResult(
                        success=True,
                        leads=[],
                        total_found=0,
                        duration_seconds=(datetime.utcnow() - start_time).total_seconds(),
                    )

                pages_scraped += 1
                content = await page.content()
                soup = BeautifulSoup(content, "lxml")

                # Parse auction items
                auction_items = soup.select(".auction-item, .property-listing, .foreclosure-item")

                for item in auction_items:
                    try:
                        lead = await self.parse_listing(item)
                        if lead:
                            leads.append(lead)
                    except Exception as e:
                        self.logger.warning("Failed to parse RealAuction item", error=str(e))

                # Check for pagination
                next_page = soup.select_one(".pagination .next, a[rel='next']")
                page_num = 2

                while next_page and page_num <= 10:  # Max 10 pages
                    next_url = next_page.get("href")
                    if not next_url:
                        break

                    if not next_url.startswith("http"):
                        next_url = f"{self.BASE_URL}{next_url}"

                    await self.rate_limit_delay()
                    await page.goto(next_url, timeout=60000)

                    try:
                        await page.wait_for_selector(".auction-item, .property-listing", timeout=10000)
                    except Exception:
                        break

                    pages_scraped += 1
                    content = await page.content()
                    soup = BeautifulSoup(content, "lxml")

                    auction_items = soup.select(".auction-item, .property-listing, .foreclosure-item")
                    for item in auction_items:
                        try:
                            lead = await self.parse_listing(item)
                            if lead:
                                leads.append(lead)
                        except Exception:
                            continue

                    next_page = soup.select_one(".pagination .next, a[rel='next']")
                    page_num += 1

                await page.close()

            return ScrapeResult(
                success=True,
                leads=leads,
                total_found=len(leads),
                new_count=len(leads),
                duration_seconds=(datetime.utcnow() - start_time).total_seconds(),
                pages_scraped=pages_scraped,
                source_url=calendar_url,
            )

        except Exception as e:
            self.logger.exception("RealAuction scrape failed", error=str(e))
            return ScrapeResult(
                success=False,
                error=str(e),
                duration_seconds=(datetime.utcnow() - start_time).total_seconds(),
            )

    async def parse_listing(self, data: Any) -> Optional[ForeclosureLead]:
        """Parse a RealAuction listing."""
        try:
            # Get address
            address_elem = data.select_one(".property-address, .address, h3, h4")
            if not address_elem:
                return None

            full_address = address_elem.get_text(strip=True)
            address_parts = full_address.split(",")
            street_address = address_parts[0].strip()
            city = address_parts[1].strip() if len(address_parts) > 1 else ""

            # Case number
            case_elem = data.select_one(".case-number, .case-no")
            case_number = case_elem.get_text(strip=True) if case_elem else None

            # Sale date
            date_elem = data.select_one(".auction-date, .sale-date, .date")
            sale_date = None
            if date_elem:
                sale_date = self.parse_date(date_elem.get_text())

            # Opening bid / judgment amount
            bid_elem = data.select_one(".opening-bid, .judgment, .bid-amount")
            sale_amount = None
            if bid_elem:
                sale_amount = self.parse_currency(bid_elem.get_text())

            # Plaintiff (lender)
            plaintiff_elem = data.select_one(".plaintiff, .lender")
            lender_name = plaintiff_elem.get_text(strip=True) if plaintiff_elem else None

            # Defendant (owner)
            defendant_elem = data.select_one(".defendant, .owner")
            owner_name = defendant_elem.get_text(strip=True) if defendant_elem else "Property Owner"

            # Parcel ID
            parcel_elem = data.select_one(".parcel, .parcel-id, .folio")
            parcel_id = parcel_elem.get_text(strip=True) if parcel_elem else None

            return ForeclosureLead(
                source=f"{self.name}_{self.county}" if self.county else self.name,
                source_type=self.source_type,
                batch_id=self.batch_id,
                property_address=self.normalize_address(street_address),
                city=city,
                state_abbr=self.state_abbr,
                county=self.county,
                owner_name=owner_name,
                case_number=case_number,
                sale_date=sale_date,
                sale_amount=sale_amount,
                lender_name=lender_name,
                parcel_id=parcel_id,
                foreclosure_type="judicial",  # Florida is judicial
            )

        except Exception as e:
            self.logger.warning("RealAuction parse error", error=str(e))
            return None
