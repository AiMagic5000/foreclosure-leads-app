"""
Base Scraper Classes
Abstract base classes for all foreclosure lead scrapers.
"""

import asyncio
import hashlib
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, AsyncGenerator, Optional
from uuid import UUID

import structlog
from pydantic import BaseModel, Field

from ..config import config

logger = structlog.get_logger()


class ForeclosureLead(BaseModel):
    """Normalized foreclosure lead data model."""
    # Identifiers
    id: str = ""  # Generated from hash of unique fields
    source: str
    source_type: str
    batch_id: str = ""

    # Property info
    property_address: str
    city: Optional[str] = None
    state: Optional[str] = None
    state_abbr: str
    zip_code: Optional[str] = None
    parcel_id: Optional[str] = None
    county: Optional[str] = None

    # Owner info
    owner_name: str
    owner_address: Optional[str] = None

    # Foreclosure details
    case_number: Optional[str] = None
    sale_date: Optional[str] = None
    sale_amount: Optional[float] = None
    opening_bid: Optional[float] = None
    mortgage_amount: Optional[float] = None
    surplus_amount: Optional[float] = None

    # Parties
    lender_name: Optional[str] = None
    trustee_name: Optional[str] = None
    attorney_name: Optional[str] = None

    # Classification
    foreclosure_type: Optional[str] = None  # judicial, non-judicial, tax

    # Source metadata
    source_url: Optional[str] = None
    raw_data: Optional[dict] = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)

    def generate_id(self) -> str:
        """Generate unique ID from key fields."""
        unique_string = f"{self.property_address}|{self.state_abbr}|{self.owner_name}|{self.sale_date or ''}"
        return hashlib.sha256(unique_string.encode()).hexdigest()[:16]

    def model_post_init(self, __context: Any) -> None:
        if not self.id:
            self.id = self.generate_id()


@dataclass
class ScrapeResult:
    """Result of a scrape operation."""
    success: bool
    leads: list[ForeclosureLead] = field(default_factory=list)
    total_found: int = 0
    new_count: int = 0
    updated_count: int = 0
    error: Optional[str] = None
    error_details: Optional[dict] = None
    duration_seconds: float = 0
    pages_scraped: int = 0
    source_url: Optional[str] = None


class BaseScraper(ABC):
    """Abstract base class for all scrapers."""

    name: str = "base"
    source_type: str = "unknown"
    requires_javascript: bool = False
    rate_limit: int = 10  # requests per minute

    def __init__(
        self,
        state_abbr: Optional[str] = None,
        county_id: Optional[UUID] = None,
        batch_id: Optional[str] = None,
    ):
        self.state_abbr = state_abbr
        self.county_id = county_id
        self.batch_id = batch_id or datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        self.logger = logger.bind(scraper=self.name, state=state_abbr)
        self._request_count = 0
        self._last_request_time: Optional[datetime] = None

    @abstractmethod
    async def scrape(self) -> ScrapeResult:
        """Execute the scrape operation."""
        pass

    @abstractmethod
    async def parse_listing(self, data: Any) -> Optional[ForeclosureLead]:
        """Parse a single listing into a ForeclosureLead."""
        pass

    async def rate_limit_delay(self) -> None:
        """Implement rate limiting between requests."""
        if self._last_request_time:
            elapsed = (datetime.utcnow() - self._last_request_time).total_seconds()
            min_delay = 60.0 / self.rate_limit
            if elapsed < min_delay:
                await asyncio.sleep(min_delay - elapsed)
        self._last_request_time = datetime.utcnow()
        self._request_count += 1

    def normalize_address(self, address: str) -> str:
        """Normalize an address string."""
        if not address:
            return ""
        # Basic normalization
        address = address.strip().upper()
        # Common abbreviations
        replacements = {
            " STREET": " ST",
            " AVENUE": " AVE",
            " BOULEVARD": " BLVD",
            " DRIVE": " DR",
            " ROAD": " RD",
            " LANE": " LN",
            " COURT": " CT",
            " CIRCLE": " CIR",
            " PLACE": " PL",
            " NORTH": " N",
            " SOUTH": " S",
            " EAST": " E",
            " WEST": " W",
        }
        for full, abbr in replacements.items():
            address = address.replace(full, abbr)
        return address

    def parse_currency(self, value: Any) -> Optional[float]:
        """Parse a currency string to float."""
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Remove currency symbols and commas
            cleaned = value.replace("$", "").replace(",", "").strip()
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None

    def parse_date(self, value: Any) -> Optional[str]:
        """Parse various date formats to YYYY-MM-DD string."""
        if not value:
            return None
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d")
        if isinstance(value, str):
            # Try common formats
            from dateutil import parser
            try:
                dt = parser.parse(value)
                return dt.strftime("%Y-%m-%d")
            except Exception:
                return value  # Return as-is if unparseable
        return None


class Crawl4AIScraper(BaseScraper):
    """Base class for Crawl4AI-powered scrapers."""

    requires_javascript: bool = False

    async def fetch_page(self, url: str) -> Optional[str]:
        """Fetch a page using Crawl4AI."""
        try:
            from crawl4ai import AsyncWebCrawler

            await self.rate_limit_delay()

            async with AsyncWebCrawler(verbose=False) as crawler:
                result = await crawler.arun(url=url)
                if result.success:
                    return result.html
                else:
                    self.logger.error("Crawl4AI fetch failed", url=url, error=result.error_message)
                    return None
        except Exception as e:
            self.logger.exception("Crawl4AI error", url=url, error=str(e))
            return None


class PlaywrightScraper(BaseScraper):
    """Base class for Playwright-powered scrapers (JavaScript-heavy sites)."""

    requires_javascript: bool = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._browser = None
        self._context = None

    async def setup_browser(self):
        """Initialize Playwright browser."""
        from playwright.async_api import async_playwright

        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=config.scraper.headless
        )
        self._context = await self._browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )

    async def close_browser(self):
        """Close browser resources."""
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()

    async def fetch_page(self, url: str, wait_selector: Optional[str] = None) -> Optional[str]:
        """Fetch a page using Playwright."""
        if not self._browser:
            await self.setup_browser()

        await self.rate_limit_delay()

        try:
            page = await self._context.new_page()
            await page.goto(url, timeout=config.scraper.page_load_timeout * 1000)

            if wait_selector:
                await page.wait_for_selector(wait_selector, timeout=30000)

            content = await page.content()
            await page.close()
            return content

        except Exception as e:
            self.logger.exception("Playwright error", url=url, error=str(e))
            return None

    async def __aenter__(self):
        await self.setup_browser()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close_browser()
