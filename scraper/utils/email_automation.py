"""
Email Automation System
Automated FOIA and public records requests for counties without online access.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib
import asyncpg
import structlog
from jinja2 import Template

from ..config import config

logger = structlog.get_logger()


# FOIA Request Templates
TEMPLATES = {
    "tax_deed_surplus": """Subject: Public Records Request - Tax Deed Surplus Funds List

Dear {{ county_name }} County {{ department }}:

Pursuant to the {{ state_name }} Public Records Act, I am requesting a copy of the following public records:

1. A list of all tax deed surplus funds currently held by {{ county_name }} County
2. For each surplus, please include:
   - Property address or parcel number
   - Former owner name(s)
   - Sale date
   - Surplus amount
   - Case number (if applicable)

This request is for records from {{ start_date }} to present.

If there are any fees associated with this request, please notify me before proceeding if the total exceeds $25.00.

I would prefer to receive the records electronically in spreadsheet format (Excel, CSV) if possible.

Thank you for your assistance with this request.

Sincerely,
{{ requester_name }}
{{ requester_company }}
{{ requester_email }}
{{ requester_phone }}
""",

    "mortgage_surplus": """Subject: Public Records Request - Foreclosure Surplus Funds

Dear {{ county_name }} County Clerk of Court:

Pursuant to the {{ state_name }} Public Records Act, I am submitting this public records request for:

1. A list of all mortgage foreclosure surplus funds currently held by the court
2. A list of all foreclosure sales completed in the past {{ days_back }} days where the sale price exceeded the judgment amount

For each record, please include:
- Property address
- Defendant/former owner name(s)
- Case number
- Sale date
- Sale amount
- Judgment amount
- Surplus amount (if calculated)

I would prefer electronic delivery in spreadsheet format.

Please contact me if you have questions or if there are any fees associated with this request.

Best regards,
{{ requester_name }}
{{ requester_company }}
{{ requester_email }}
""",

    "combined_request": """Subject: Public Records Request - Foreclosure and Tax Deed Surplus Funds

Dear {{ county_name }} County Records Department:

Pursuant to the {{ state_name }} Public Records Act, I am requesting the following public records:

TAX DEED SURPLUS:
- List of all tax deed surplus funds held by the county
- Property addresses, former owner names, sale dates, and surplus amounts

MORTGAGE FORECLOSURE SURPLUS:
- List of all foreclosure surplus funds held by the court
- List of recent foreclosure sales (past {{ days_back }} days) with sale prices exceeding judgment amounts

Please provide the records in electronic format (Excel or CSV preferred).

If fees exceed $50, please contact me for approval before proceeding.

Thank you,
{{ requester_name }}
{{ requester_company }}
{{ requester_email }}
{{ requester_phone }}
""",

    "follow_up": """Subject: Follow Up - Public Records Request ({{ original_date }})

Dear {{ county_name }} County {{ department }}:

I am following up on my public records request submitted on {{ original_date }} regarding {{ request_type }}.

I have not yet received a response and wanted to confirm the request was received.

If you need any additional information or clarification, please let me know.

Thank you,
{{ requester_name }}
{{ requester_email }}
"""
}


class EmailAutomation:
    """Handles automated email requests to counties."""

    def __init__(self):
        self.logger = logger.bind(component="email_automation")
        self.db_pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Connect to database."""
        self.db_pool = await asyncpg.create_pool(
            config.database.connection_string,
            min_size=1,
            max_size=5,
        )

    async def close(self):
        """Close database connection."""
        if self.db_pool:
            await self.db_pool.close()

    async def send_foia_request(
        self,
        county_id: UUID,
        template_name: str = "combined_request",
        **template_vars
    ) -> bool:
        """Send a FOIA request to a county."""
        try:
            async with self.db_pool.acquire() as conn:
                # Get county details
                county = await conn.fetchrow(
                    """
                    SELECT c.*, s.state_name
                    FROM counties c
                    JOIN state_data s ON c.state_abbr = s.state_abbr
                    WHERE c.id = $1
                    """,
                    county_id
                )

                if not county or not county["email_contact"]:
                    self.logger.warning(
                        "County has no email contact",
                        county_id=str(county_id)
                    )
                    return False

                # Build template context
                context = {
                    "county_name": county["name"],
                    "state_name": county["state_name"],
                    "department": "Tax Collector" if "tax" in template_name else "Clerk of Court",
                    "start_date": (datetime.now() - timedelta(days=365)).strftime("%B %d, %Y"),
                    "days_back": 90,
                    "requester_name": config.email.from_name,
                    "requester_company": "Asset Recovery Data Services",
                    "requester_email": config.email.from_email,
                    "requester_phone": "",  # Add to config if needed
                    **template_vars
                }

                # Render template
                template = Template(TEMPLATES.get(template_name, TEMPLATES["combined_request"]))
                email_content = template.render(**context)

                # Parse subject from template
                lines = email_content.strip().split("\n")
                subject = lines[0].replace("Subject: ", "")
                body = "\n".join(lines[2:])

                # Create email message
                message = MIMEMultipart()
                message["From"] = f"{config.email.from_name} <{config.email.from_email}>"
                message["To"] = county["email_contact"]
                message["Subject"] = subject
                message.attach(MIMEText(body, "plain"))

                # Send email
                await aiosmtplib.send(
                    message,
                    hostname=config.email.smtp_host,
                    port=config.email.smtp_port,
                    username=config.email.smtp_user,
                    password=config.email.smtp_password,
                    use_tls=config.email.use_ssl,
                )

                # Log the request
                await conn.execute(
                    """
                    INSERT INTO email_requests (
                        county_id, email_to, email_from, subject, body, status, sent_at
                    ) VALUES ($1, $2, $3, $4, $5, 'sent', NOW())
                    """,
                    county_id,
                    county["email_contact"],
                    config.email.from_email,
                    subject,
                    body,
                )

                self.logger.info(
                    "FOIA request sent",
                    county=county["name"],
                    state=county["state_abbr"],
                    email=county["email_contact"],
                )

                return True

        except Exception as e:
            self.logger.exception("Failed to send FOIA request", error=str(e))
            return False

    async def send_follow_up(self, original_request_id: UUID) -> bool:
        """Send a follow-up email for an unanswered request."""
        try:
            async with self.db_pool.acquire() as conn:
                # Get original request
                request = await conn.fetchrow(
                    """
                    SELECT r.*, c.name as county_name, c.email_contact
                    FROM email_requests r
                    JOIN counties c ON r.county_id = c.id
                    WHERE r.id = $1
                    """,
                    original_request_id
                )

                if not request:
                    return False

                # Build follow-up
                context = {
                    "county_name": request["county_name"],
                    "department": "Records Department",
                    "original_date": request["sent_at"].strftime("%B %d, %Y"),
                    "request_type": "surplus funds records",
                    "requester_name": config.email.from_name,
                    "requester_email": config.email.from_email,
                }

                template = Template(TEMPLATES["follow_up"])
                email_content = template.render(**context)

                lines = email_content.strip().split("\n")
                subject = lines[0].replace("Subject: ", "")
                body = "\n".join(lines[2:])

                # Create and send message
                message = MIMEMultipart()
                message["From"] = f"{config.email.from_name} <{config.email.from_email}>"
                message["To"] = request["email_contact"]
                message["Subject"] = subject
                message.attach(MIMEText(body, "plain"))

                await aiosmtplib.send(
                    message,
                    hostname=config.email.smtp_host,
                    port=config.email.smtp_port,
                    username=config.email.smtp_user,
                    password=config.email.smtp_password,
                    use_tls=config.email.use_ssl,
                )

                # Log follow-up
                await conn.execute(
                    """
                    INSERT INTO email_requests (
                        county_id, email_to, email_from, subject, body, status, sent_at
                    ) VALUES ($1, $2, $3, $4, $5, 'sent', NOW())
                    """,
                    request["county_id"],
                    request["email_contact"],
                    config.email.from_email,
                    subject,
                    body,
                )

                self.logger.info(
                    "Follow-up sent",
                    county=request["county_name"],
                    original_date=request["sent_at"],
                )

                return True

        except Exception as e:
            self.logger.exception("Failed to send follow-up", error=str(e))
            return False

    async def process_pending_requests(self):
        """Process all counties that need email requests."""
        async with self.db_pool.acquire() as conn:
            # Find counties needing initial request
            counties_needing_request = await conn.fetch(
                """
                SELECT c.id, c.name, c.state_abbr
                FROM counties c
                WHERE c.requires_email_request = TRUE
                  AND c.is_active = TRUE
                  AND c.id NOT IN (
                      SELECT DISTINCT county_id FROM email_requests
                      WHERE sent_at > NOW() - INTERVAL '30 days'
                  )
                LIMIT 50
                """
            )

            for county in counties_needing_request:
                await self.send_foia_request(county["id"])
                await asyncio.sleep(60)  # Rate limit: 1 email per minute

            # Find requests needing follow-up (7+ days, no response)
            requests_needing_followup = await conn.fetch(
                """
                SELECT r.id
                FROM email_requests r
                WHERE r.status = 'sent'
                  AND r.sent_at < NOW() - INTERVAL '7 days'
                  AND r.id NOT IN (
                      SELECT DISTINCT r2.id FROM email_requests r2
                      WHERE r2.county_id = r.county_id
                        AND r2.sent_at > r.sent_at
                  )
                LIMIT 20
                """
            )

            for request in requests_needing_followup:
                await self.send_follow_up(request["id"])
                await asyncio.sleep(60)


async def run_email_automation():
    """Run the email automation process."""
    automation = EmailAutomation()
    await automation.connect()

    try:
        await automation.process_pending_requests()
    finally:
        await automation.close()


if __name__ == "__main__":
    asyncio.run(run_email_automation())
