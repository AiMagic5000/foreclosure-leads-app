"""
Scrape Job Worker
Continuously processes scrape jobs from the queue.
"""

import asyncio
import signal
import sys
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

import asyncpg
import structlog

from ..config import config
from ..scrapers.base import ScrapeResult, ForeclosureLead
from ..scrapers.auction_com import AuctionComScraper, RealAuctionScraper

logger = structlog.get_logger()


# Scraper class registry
SCRAPERS = {
    "AuctionComScraper": AuctionComScraper,
    "RealAuctionScraper": RealAuctionScraper,
    # Add more scrapers as they're implemented
}


class JobWorker:
    """Worker that processes scrape jobs from the queue."""

    def __init__(self):
        self.worker_id = config.scraper.worker_id
        self.running = True
        self.db_pool: Optional[asyncpg.Pool] = None
        self.current_job_id: Optional[UUID] = None
        self.logger = logger.bind(worker_id=self.worker_id)

    async def start(self):
        """Start the job worker."""
        self.logger.info("Starting job worker")

        # Setup signal handlers
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, self.shutdown)

        # Connect to database
        self.db_pool = await asyncpg.create_pool(
            config.database.connection_string,
            min_size=2,
            max_size=10,
        )

        # Main worker loop
        while self.running:
            try:
                job_id = await self.claim_next_job()

                if job_id:
                    self.current_job_id = job_id
                    await self.process_job(job_id)
                    self.current_job_id = None
                else:
                    # No jobs available, wait before checking again
                    await asyncio.sleep(10)

            except Exception as e:
                self.logger.exception("Worker loop error", error=str(e))
                await asyncio.sleep(30)  # Back off on errors

        # Cleanup
        if self.db_pool:
            await self.db_pool.close()

        self.logger.info("Job worker stopped")

    def shutdown(self):
        """Handle shutdown signal."""
        self.logger.info("Shutdown signal received")
        self.running = False

    async def claim_next_job(self) -> Optional[UUID]:
        """Claim the next pending job from the queue."""
        async with self.db_pool.acquire() as conn:
            job_id = await conn.fetchval(
                "SELECT get_next_scrape_job($1)",
                self.worker_id
            )
            return job_id

    async def process_job(self, job_id: UUID):
        """Process a single scrape job."""
        self.logger.info("Processing job", job_id=str(job_id))

        try:
            # Get job details
            async with self.db_pool.acquire() as conn:
                job = await conn.fetchrow(
                    """
                    SELECT j.*, s.scraper_class, s.name as source_name,
                           c.name as county_name
                    FROM scrape_jobs j
                    LEFT JOIN scrape_sources s ON j.source_id = s.id
                    LEFT JOIN counties c ON j.county_id = c.id
                    WHERE j.id = $1
                    """,
                    job_id
                )

            if not job:
                self.logger.error("Job not found", job_id=str(job_id))
                return

            # Determine which scraper to use
            scraper_class_name = job["scraper_class"]
            if not scraper_class_name or scraper_class_name not in SCRAPERS:
                # Default to AuctionComScraper for nationwide scraping
                scraper_class_name = "AuctionComScraper"

            scraper_class = SCRAPERS[scraper_class_name]

            # Create scraper instance
            scraper = scraper_class(
                state_abbr=job["state_abbr"],
                county_id=job["county_id"],
            )

            # Execute scrape
            self.logger.info(
                "Executing scraper",
                scraper=scraper_class_name,
                state=job["state_abbr"],
                county=job.get("county_name"),
            )

            result = await scraper.scrape()

            # Save results
            await self.save_results(job_id, result)

            # Update job status
            await self.complete_job(job_id, result)

        except Exception as e:
            self.logger.exception("Job processing failed", job_id=str(job_id), error=str(e))
            await self.fail_job(job_id, str(e))

    async def save_results(self, job_id: UUID, result: ScrapeResult):
        """Save scraped leads to the database."""
        if not result.leads:
            return

        self.logger.info(f"Saving {len(result.leads)} leads")

        async with self.db_pool.acquire() as conn:
            new_count = 0
            updated_count = 0

            for lead in result.leads:
                try:
                    # Upsert lead
                    existing = await conn.fetchval(
                        "SELECT id FROM foreclosure_leads WHERE id = $1",
                        lead.id
                    )

                    if existing:
                        # Update existing lead
                        await conn.execute(
                            """
                            UPDATE foreclosure_leads SET
                                sale_date = COALESCE($2, sale_date),
                                sale_amount = COALESCE($3, sale_amount),
                                source = $4,
                                batch_id = $5,
                                last_updated = NOW()
                            WHERE id = $1
                            """,
                            lead.id,
                            lead.sale_date,
                            lead.sale_amount,
                            lead.source,
                            lead.batch_id,
                        )
                        updated_count += 1
                    else:
                        # Insert new lead
                        await conn.execute(
                            """
                            INSERT INTO foreclosure_leads (
                                id, property_address, city, state, state_abbr,
                                zip_code, parcel_id, owner_name, case_number,
                                sale_date, sale_amount, lender_name, trustee_name,
                                foreclosure_type, source, source_type, batch_id,
                                scraped_at
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                                $12, $13, $14, $15, $16, $17, NOW()
                            )
                            """,
                            lead.id,
                            lead.property_address,
                            lead.city,
                            lead.state,
                            lead.state_abbr,
                            lead.zip_code,
                            lead.parcel_id,
                            lead.owner_name,
                            lead.case_number,
                            lead.sale_date,
                            lead.sale_amount,
                            lead.lender_name,
                            lead.trustee_name,
                            lead.foreclosure_type,
                            lead.source,
                            lead.source_type,
                            lead.batch_id,
                        )
                        new_count += 1

                except Exception as e:
                    self.logger.warning(
                        "Failed to save lead",
                        lead_id=lead.id,
                        error=str(e)
                    )

            result.new_count = new_count
            result.updated_count = updated_count

            self.logger.info(
                "Leads saved",
                new=new_count,
                updated=updated_count,
            )

    async def complete_job(self, job_id: UUID, result: ScrapeResult):
        """Mark job as completed."""
        async with self.db_pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE scrape_jobs SET
                    status = 'completed',
                    completed_at = NOW(),
                    leads_found = $2,
                    leads_new = $3,
                    leads_updated = $4
                WHERE id = $1
                """,
                job_id,
                result.total_found,
                result.new_count,
                result.updated_count,
            )

            # Update county stats if applicable
            if result.total_found > 0:
                await conn.execute(
                    """
                    UPDATE counties SET
                        last_scraped_at = NOW(),
                        last_successful_scrape = NOW(),
                        consecutive_failures = 0,
                        total_leads_found = total_leads_found + $2,
                        leads_this_month = leads_this_month + $2
                    WHERE id = (SELECT county_id FROM scrape_jobs WHERE id = $1)
                    """,
                    job_id,
                    result.new_count,
                )

    async def fail_job(self, job_id: UUID, error: str):
        """Mark job as failed and schedule retry if applicable."""
        async with self.db_pool.acquire() as conn:
            job = await conn.fetchrow(
                "SELECT attempt_number, max_attempts FROM scrape_jobs WHERE id = $1",
                job_id
            )

            if job and job["attempt_number"] < job["max_attempts"]:
                # Schedule retry with exponential backoff
                retry_delay = 60 * (2 ** job["attempt_number"])  # 1m, 2m, 4m, etc.
                await conn.execute(
                    """
                    UPDATE scrape_jobs SET
                        status = 'pending',
                        attempt_number = attempt_number + 1,
                        next_retry_at = NOW() + ($2 || ' seconds')::INTERVAL,
                        error_message = $3
                    WHERE id = $1
                    """,
                    job_id,
                    str(retry_delay),
                    error,
                )
                self.logger.info(
                    "Job scheduled for retry",
                    job_id=str(job_id),
                    retry_delay=retry_delay,
                )
            else:
                # Max retries exceeded
                await conn.execute(
                    """
                    UPDATE scrape_jobs SET
                        status = 'failed',
                        completed_at = NOW(),
                        error_message = $2
                    WHERE id = $1
                    """,
                    job_id,
                    error,
                )

                # Increment county failure count
                await conn.execute(
                    """
                    UPDATE counties SET
                        consecutive_failures = consecutive_failures + 1,
                        last_scraped_at = NOW()
                    WHERE id = (SELECT county_id FROM scrape_jobs WHERE id = $1)
                    """,
                    job_id,
                )


class JobScheduler:
    """Schedules scrape jobs based on county configuration."""

    def __init__(self):
        self.db_pool: Optional[asyncpg.Pool] = None
        self.running = True
        self.logger = logger.bind(component="scheduler")

    async def start(self):
        """Start the job scheduler."""
        self.logger.info("Starting job scheduler")

        self.db_pool = await asyncpg.create_pool(
            config.database.connection_string,
            min_size=1,
            max_size=5,
        )

        while self.running:
            try:
                await self.schedule_due_counties()
                await self.schedule_nationwide_sources()
                await asyncio.sleep(300)  # Check every 5 minutes

            except Exception as e:
                self.logger.exception("Scheduler error", error=str(e))
                await asyncio.sleep(60)

    async def schedule_due_counties(self):
        """Schedule jobs for counties that are due for scraping."""
        async with self.db_pool.acquire() as conn:
            # Find counties due for scraping
            due_counties = await conn.fetch(
                """
                SELECT id, name, state_abbr
                FROM counties
                WHERE is_active = TRUE
                  AND has_online_records = TRUE
                  AND (next_scheduled_scrape IS NULL OR next_scheduled_scrape <= NOW())
                  AND consecutive_failures < 5
                ORDER BY next_scheduled_scrape NULLS FIRST
                LIMIT 100
                """
            )

            for county in due_counties:
                # Check if there's already a pending job for this county
                existing = await conn.fetchval(
                    """
                    SELECT id FROM scrape_jobs
                    WHERE county_id = $1 AND status IN ('pending', 'running')
                    """,
                    county["id"]
                )

                if not existing:
                    await conn.execute(
                        "SELECT schedule_county_scrape($1)",
                        county["id"]
                    )
                    self.logger.debug(
                        "Scheduled county scrape",
                        county=county["name"],
                        state=county["state_abbr"],
                    )

    async def schedule_nationwide_sources(self):
        """Schedule jobs for nationwide aggregator sources."""
        async with self.db_pool.acquire() as conn:
            # Get active nationwide sources
            sources = await conn.fetch(
                """
                SELECT id, name, scraper_class
                FROM scrape_sources
                WHERE is_active = TRUE
                  AND 'ALL' = ANY(states_covered)
                """
            )

            for source in sources:
                # Check for existing job
                existing = await conn.fetchval(
                    """
                    SELECT id FROM scrape_jobs
                    WHERE source_id = $1
                      AND status IN ('pending', 'running')
                      AND created_at > NOW() - INTERVAL '24 hours'
                    """,
                    source["id"]
                )

                if not existing:
                    # Schedule for each state
                    from ..sources.registry import US_STATES
                    for state_abbr in list(US_STATES.keys())[:10]:  # Start with 10 states
                        await conn.execute(
                            """
                            INSERT INTO scrape_jobs (source_id, state_abbr, job_type, priority)
                            VALUES ($1, $2, 'scheduled', 5)
                            """,
                            source["id"],
                            state_abbr,
                        )

                    self.logger.info(
                        "Scheduled nationwide source",
                        source=source["name"],
                    )


async def run_worker():
    """Entry point for running the job worker."""
    worker = JobWorker()
    await worker.start()


async def run_scheduler():
    """Entry point for running the job scheduler."""
    scheduler = JobScheduler()
    await scheduler.start()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "scheduler":
        asyncio.run(run_scheduler())
    else:
        asyncio.run(run_worker())
