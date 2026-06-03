#!/usr/bin/env python3
"""
County Email Outreach - Request Surplus Funds / Excess Proceeds Lists

Sends FOIA/public records requests to county treasurer/tax collector offices
requesting their current list of excess proceeds / surplus funds from
tax sales and foreclosure sales.

Uses data from county-directory.ts (3,271 counties with contact info).

Sends via IMAP APPEND to claim@usforeclosurerecovery.com drafts,
then user can review and send manually.

Non-judicial states only (29 states).
"""

import os
import sys
import ssl
import imaplib
import email
import json
import re
import time
import logging
import argparse
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# IMAP config for claim@usforeclosurerecovery.com
IMAP_HOST = "imap.hostinger.com"
IMAP_PORT = 993
IMAP_USER = "claim@usforeclosurerecovery.com"
IMAP_PASS = os.environ.get("IMAP_CLAIM_PASSWORD", "Thepassword#123")

# Non-judicial states (our target states)
NON_JUDICIAL_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "GA", "HI", "ID", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NC",
    "OR", "SD", "TN", "TX", "UT", "VA", "WA", "WV", "WY"
}

# States where we already have good coverage (skip for email outreach)
WELL_COVERED_STATES = {"FL", "OH", "IL"}  # Judicial states already scraped

# Email template for FOIA / public records request
EMAIL_SUBJECT = "Public Records Request - Excess Proceeds / Surplus Funds List"

EMAIL_BODY = """Dear {office_title},

I am writing to request access to public records pursuant to {state_name}'s open records / freedom of information laws.

Specifically, I am requesting:

1. The current list of excess proceeds / surplus funds from tax sales and foreclosure sales held by {county_name}, {state_name}
2. Any overbid or overage amounts from recent tax deed sales or mortgage foreclosure sales
3. The names and addresses of former property owners entitled to these excess funds
4. The amounts held and sale dates

This data is public record under state law and should be available for inspection.

If this information is available online or in a downloadable format (Excel, PDF, or CSV), please direct me to the appropriate URL.

If there is a fee associated with this request, please let me know in advance.

Thank you for your time and assistance.

Sincerely,
Corey Pearson
Foreclosure Recovery Inc.
claim@usforeclosurerecovery.com
(888) 545-8007
"""


def parse_county_directory(ts_file: str) -> list:
    """Parse county-directory.ts to extract county contact info."""
    counties = []
    with open(ts_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract county objects using regex
    pattern = r'\{\s*county:\s*"([^"]+)",\s*state:\s*"([^"]+)",\s*phone:\s*"([^"]*)",\s*email:\s*"([^"]*)",\s*website:\s*"([^"]*)"\s*\}'
    for m in re.finditer(pattern, content):
        counties.append({
            "county": m.group(1),
            "state": m.group(2),
            "phone": m.group(3),
            "email": m.group(4),
            "website": m.group(5),
        })

    return counties


def get_state_name(abbr: str) -> str:
    """Convert state abbreviation to full name."""
    names = {
        "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
        "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
        "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
        "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
        "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
        "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
        "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
        "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
        "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
        "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
        "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
        "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
        "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
    }
    return names.get(abbr, abbr)


def create_email_draft(to_email: str, county: str, state: str) -> str:
    """Create an email draft as RFC822 message."""
    state_name = get_state_name(state)

    # Determine office title
    office_title = "County Treasurer's Office"
    if state in ("AL",):
        office_title = "Revenue Commissioner's Office"
    elif state in ("GA",):
        office_title = "Tax Commissioner's Office"

    body = EMAIL_BODY.format(
        office_title=office_title,
        county_name=county,
        state_name=state_name,
    )

    msg = MIMEMultipart("alternative")
    msg["From"] = IMAP_USER
    msg["To"] = to_email
    msg["Subject"] = f"{EMAIL_SUBJECT} - {county}, {state_name}"
    msg["Date"] = email.utils.formatdate(localtime=True)
    msg["X-County"] = county
    msg["X-State"] = state

    # Plain text version
    msg.attach(MIMEText(body, "plain", "utf-8"))

    # HTML version
    html_body = f"""<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<p>Dear {office_title},</p>

<p>I am writing to request access to public records pursuant to {state_name}'s open records / freedom of information laws.</p>

<p>Specifically, I am requesting:</p>
<ol>
<li>The current list of <strong>excess proceeds / surplus funds</strong> from tax sales and foreclosure sales held by {county}, {state_name}</li>
<li>Any overbid or overage amounts from recent tax deed sales or mortgage foreclosure sales</li>
<li>The names and addresses of former property owners entitled to these excess funds</li>
<li>The amounts held and sale dates</li>
</ol>

<p>This data is public record under state law and should be available for inspection.</p>

<p>If this information is available online or in a downloadable format (Excel, PDF, or CSV), please direct me to the appropriate URL.</p>

<p>If there is a fee associated with this request, please let me know in advance.</p>

<p>Thank you for your time and assistance.</p>

<p>Sincerely,<br>
<strong>Corey Pearson</strong><br>
Foreclosure Recovery Inc.<br>
claim@usforeclosurerecovery.com<br>
(888) 545-8007</p>
</body></html>"""

    msg.attach(MIMEText(html_body, "html", "utf-8"))

    return msg.as_string()


def save_draft_to_imap(rfc822_message: str) -> bool:
    """Save email as draft via IMAP APPEND."""
    try:
        ctx = ssl.create_default_context()
        imap = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=ctx)
        imap.login(IMAP_USER, IMAP_PASS)

        # Try INBOX.Drafts first (Hostinger format), fallback to Drafts
        folders_to_try = ["INBOX.Drafts", "Drafts"]
        for folder in folders_to_try:
            status, _ = imap.append(
                folder,
                "\\Draft",
                imaplib.Time2Internaldate(time.time()),
                rfc822_message.encode("utf-8")
            )
            if status == "OK":
                imap.logout()
                return True

        imap.logout()
        return False
    except Exception as e:
        logger.error(f"IMAP error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="County Email Outreach for Surplus Funds Lists")
    parser.add_argument("--state", type=str, help="Process only this state (2-letter code)")
    parser.add_argument("--county-dir", type=str,
                       default="/mnt/c/Users/flowc/Documents/foreclosure-leads-app/src/data/county-directory.ts",
                       help="Path to county-directory.ts")
    parser.add_argument("--dry-run", action="store_true", help="Don't save drafts, just print")
    parser.add_argument("--limit", type=int, default=0, help="Max emails to create (0=unlimited)")
    parser.add_argument("--list-states", action="store_true", help="List non-judicial states with county counts")
    parser.add_argument("--only-with-email", action="store_true", help="Only counties with email addresses")

    args = parser.parse_args()

    # Parse county directory
    logger.info(f"Parsing county directory: {args.county_dir}")
    all_counties = parse_county_directory(args.county_dir)
    logger.info(f"Loaded {len(all_counties)} total counties")

    # Filter to non-judicial states
    nj_counties = [c for c in all_counties if c["state"] in NON_JUDICIAL_STATES]
    logger.info(f"Non-judicial state counties: {len(nj_counties)}")

    if args.state:
        nj_counties = [c for c in nj_counties if c["state"] == args.state.upper()]
        logger.info(f"Filtered to {args.state.upper()}: {len(nj_counties)} counties")

    if args.only_with_email:
        nj_counties = [c for c in nj_counties if c["email"] and "@" in c["email"]]
        logger.info(f"Counties with email: {len(nj_counties)}")

    if args.list_states:
        from collections import Counter
        state_counts = Counter(c["state"] for c in nj_counties)
        email_counts = Counter(c["state"] for c in nj_counties if c["email"] and "@" in c["email"])
        print(f"\n{'State':<6} {'Total':<8} {'With Email':<12} {'State Name'}")
        print("-" * 50)
        for state, count in sorted(state_counts.items()):
            print(f"{state:<6} {count:<8} {email_counts.get(state, 0):<12} {get_state_name(state)}")
        print(f"\nTotal: {sum(state_counts.values())} counties, {sum(email_counts.values())} with email")
        return

    # Create email drafts
    created = 0
    skipped = 0
    errors = 0

    for county_info in nj_counties:
        if args.limit and created >= args.limit:
            break

        county = county_info["county"]
        state = county_info["state"]
        to_email = county_info["email"]

        if not to_email or "@" not in to_email:
            skipped += 1
            continue

        # Skip generic/non-county emails
        if to_email in ("onespot@revenue.alabama.gov",):
            skipped += 1
            continue

        logger.info(f"Creating draft for {county}, {state} -> {to_email}")

        if args.dry_run:
            print(f"  DRAFT: To={to_email}, County={county}, State={state}")
            created += 1
            continue

        try:
            rfc822 = create_email_draft(to_email, county, state)
            if save_draft_to_imap(rfc822):
                created += 1
                logger.info(f"  Draft saved: {county}, {state}")
            else:
                errors += 1
                logger.error(f"  Failed to save draft: {county}, {state}")
        except Exception as e:
            errors += 1
            logger.error(f"  Error: {county}, {state}: {e}")

        # Rate limit
        time.sleep(0.5)

    logger.info(f"\n{'='*50}")
    logger.info(f"COUNTY EMAIL OUTREACH RESULTS")
    logger.info(f"{'='*50}")
    logger.info(f"Drafts Created: {created}")
    logger.info(f"Skipped (no email): {skipped}")
    logger.info(f"Errors: {errors}")
    logger.info(f"{'='*50}")


if __name__ == "__main__":
    main()
