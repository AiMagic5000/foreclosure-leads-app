#!/usr/bin/env python3
"""
Auto-process web claim submissions from the claim@usforeclosurerecovery.com inbox.

Runs every 15 minutes via cron. Checks for unread emails with "New Claim" in subject,
parses lead data from the HTML body, creates a personalized follow-up draft with
contingency agreement attached, and marks the notification as read.

Cron entry (R730):
  */15 * * * * cd /opt/foreclosure-scrapers && python3 auto_process_web_claims.py >> /var/log/web-claim-processor.log 2>&1

Requires: Python 3.10+
"""

import ssl
import socket
import re
import sys
import base64
import json
from datetime import datetime, timezone
from html.parser import HTMLParser

# ── Config ─────────────────────────────────────────────────
IMAP_HOST = "imap.hostinger.com"
IMAP_PORT = 993
IMAP_USER = "claim@usforeclosurerecovery.com"
IMAP_PASS = "Thepassword#123"
SENDER_EMAIL = IMAP_USER
SENDER_NAME = "Foreclosure Recovery Inc."
LOGO_URL = "https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png"

# State claim windows (years)
STATE_CLAIM_WINDOWS = {
    "AL": 1, "AK": 1, "AZ": 1, "AR": 2, "CA": 1, "CO": 1, "CT": 1, "DE": 2,
    "FL": 1, "GA": 1, "HI": 1, "ID": 1, "IL": 1, "IN": 1, "IA": 2, "KS": 2,
    "KY": 1, "LA": 1, "ME": 1, "MD": 3, "MA": 3, "MI": 1, "MN": 1, "MS": 1,
    "MO": 2, "MT": 1, "NE": 2, "NV": 1, "NH": 1, "NJ": 2, "NM": 1, "NY": 5,
    "NC": 1, "ND": 2, "OH": 2, "OK": 2, "OR": 2, "PA": 2, "RI": 1, "SC": 1,
    "SD": 1, "TN": 1, "TX": 2, "UT": 1, "VT": 1, "VA": 1, "WA": 1, "WV": 1,
    "WI": 1, "WY": 1, "DC": 2,
}

STATE_ABBREVS = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY", "district of columbia": "DC",
}


# ── HTML Parser ────────────────────────────────────────────
class ClaimEmailParser(HTMLParser):
    """Parse the web claim notification email to extract lead data."""

    def __init__(self):
        super().__init__()
        self._in_td = False
        self._td_texts = []
        self._current_text = ""

    def handle_starttag(self, tag, attrs):
        if tag == "td":
            self._in_td = True
            self._current_text = ""

    def handle_endtag(self, tag):
        if tag == "td" and self._in_td:
            self._in_td = False
            self._td_texts.append(self._current_text.strip())
            self._current_text = ""

    def handle_data(self, data):
        if self._in_td:
            self._current_text += data

    def get_field(self, label: str) -> str:
        """Find value that follows a label td."""
        for i, text in enumerate(self._td_texts):
            if text.strip().rstrip(":").lower() == label.lower():
                if i + 1 < len(self._td_texts):
                    return self._td_texts[i + 1].strip()
        return ""


def parse_claim_email(html_body: str) -> dict:
    """Extract lead data from the web claim notification HTML."""
    parser = ClaimEmailParser()
    parser.feed(html_body)

    name = parser.get_field("Name")
    email = parser.get_field("Email")
    phone = parser.get_field("Phone")
    address = parser.get_field("Address")
    city = parser.get_field("City")
    zip_code = parser.get_field("Zip") or parser.get_field("Zip Code")
    county = parser.get_field("County")
    state = parser.get_field("State")
    foreclosure_date = parser.get_field("Foreclosure Date")
    lender = parser.get_field("Lender")

    # Extract ref from subject or body
    ref_match = re.search(r"WEB\d{12,}", html_body)
    ref = ref_match.group(0) if ref_match else f"WEB{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}"

    # Parse first/last name
    parts = name.split() if name else [""]
    first_name = parts[0] if parts else ""
    last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    # Get state abbreviation
    state_abbr = STATE_ABBREVS.get(state.lower(), "") if state else ""
    if not state_abbr and len(state) == 2:
        state_abbr = state.upper()

    return {
        "first_name": first_name,
        "last_name": last_name,
        "name": name,
        "email": email,
        "phone": phone,
        "address": address,
        "city": city,
        "zip_code": zip_code,
        "county": county,
        "state": state,
        "state_abbr": state_abbr,
        "foreclosure_date": foreclosure_date,
        "lender": lender,
        "ref": ref,
    }


def is_address_incomplete(address: str) -> bool:
    """Check if the address is missing a house number or is too vague."""
    if not address:
        return True
    # Check if it starts with a number (house number)
    stripped = address.strip()
    if not stripped:
        return True
    # No digit at start = probably missing house number
    if not stripped[0].isdigit():
        return True
    # Too short (e.g., just "123")
    if len(stripped) < 8:
        return True
    return False


# ── Email Generation ───────────────────────────────────────
def generate_web_claim_email(lead: dict) -> tuple:
    """Generate subject and HTML for a web claim follow-up email."""
    first = lead["first_name"]
    last = lead["last_name"]
    address = lead["address"]
    city = lead.get("city", "")
    zip_code = lead.get("zip_code", "")
    county = lead["county"]
    state = lead["state"]
    state_abbr = lead["state_abbr"]
    foreclosure_date = lead["foreclosure_date"]
    ref = lead["ref"]
    lender = lead["lender"]
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")
    incomplete = is_address_incomplete(address)

    # Build display address from available parts
    addr_parts = [p for p in [address, city, state + (" " + zip_code if zip_code else "")] if p and p.strip()]
    display_address = ", ".join(addr_parts) if addr_parts else ""

    # Format foreclosure date
    foreclosure_formatted = foreclosure_date
    try:
        fd = datetime.strptime(foreclosure_date, "%Y-%m-%d")
        foreclosure_formatted = fd.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        pass

    # Calculate deadline
    claim_years = STATE_CLAIM_WINDOWS.get(state_abbr, 1)
    deadline_note = ""
    try:
        fd = datetime.strptime(foreclosure_date, "%Y-%m-%d")
        from datetime import timedelta
        deadline = fd.replace(year=fd.year + claim_years)
        now = datetime.now()
        if deadline < now:
            deadline_note = f"""
<table style="background-color: #f0f9ff; border-radius: 6px; border-left: 4px solid #09274c;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 4px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">{state} Statute Note</p>
<p style="margin: 0; font-size: 14px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight',sans-serif;">
  Under {state} law, former property owners have <strong style="color: #09274c;">{claim_years} year{"s" if claim_years > 1 else ""}</strong> from the date of the foreclosure sale to claim surplus funds. Your foreclosure date of {foreclosure_formatted} is past this statutory window. However, we will research whether unclaimed surplus funds were transferred to the state's unclaimed property division, where they may still be recoverable with no time limit. We will include this in our 24-hour update.
</p>
</td></tr></tbody>
</table>"""
        else:
            days_left = (deadline - now).days
            urgency = "critical" if days_left <= 60 else "high" if days_left <= 120 else "standard"
            deadline_str = deadline.strftime("%B %d, %Y")
            bg = "#fff5f5" if urgency == "critical" else "#fffbeb" if urgency == "high" else "#f0f9ff"
            border = "#D82221" if urgency == "critical" else "#d97706" if urgency == "high" else "#09274c"
            label_color = "#D82221" if urgency == "critical" else "#09274c"
            deadline_note = f"""
<table style="background-color: {bg}; border-radius: 6px; border-left: 4px solid {border};" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 4px; font-size: 11px; color: {label_color}; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">{"URGENT -- " if urgency == "critical" else ""}{state} Statutory Deadline</p>
<p style="margin: 0 0 6px; font-size: 14px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight',sans-serif;">
  Under {state} law, you have <strong style="color: #09274c;">{claim_years} year{"s" if claim_years > 1 else ""}</strong> from the foreclosure sale to claim surplus funds. Your deadline is <strong style="color: {label_color};">{deadline_str}</strong> -- <strong>{days_left} days remaining</strong>.
</p>
</td></tr></tbody>
</table>"""
    except (ValueError, TypeError):
        pass

    subject = f"Re: Your Surplus Fund Claim -- {display_address or address or 'Property in ' + state} (Ref: {ref})"

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
body {{ margin: 0; padding: 0; width: 100% !important; }}
@media only screen and (max-width: 620px) {{
.email-container {{ width: 100% !important; }}
.padding-mobile {{ padding-left: 20px !important; padding-right: 20px !important; }}
}}
</style>
</head>
<body>
<center style="width: 100%; background-color: #f4f5f7;">
<div class="email-container" style="max-width: 600px; margin: 0 auto;">

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 20px;">
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td align="left" valign="middle" width="55%">
  <a style="text-decoration: none;" href="https://usforeclosurerecovery.com"><img style="display: block; max-width: 185px; height: auto;" src="{LOGO_URL}" alt="Foreclosure Recovery Inc." width="185" /></a>
</td>
<td align="right" valign="middle" width="45%">
<p style="margin: 0; font-size: 12px; color: #7a8a9e; font-family: 'Inter Tight','Segoe UI',sans-serif; line-height: 18px;">
  {today}<br /><span style="color: #09274c; font-weight: 600;">Ref: <span style="color: #0a0a0a; font-size: 14px; font-weight: 500;">{ref}</span></span>
</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;"><div style="border-top: 1px solid #e2e6eb;">&nbsp;</div></td></tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 10px 40px 0;">
<p style="margin: 0 0 6px; font-size: 11px; color: #1a7a3a; text-transform: uppercase; letter-spacing: 1.2px; font-family: 'Inter Tight',sans-serif; font-weight: 600;">Claim Received -- Thank You</p>
<h1 style="margin: 0 0 24px; font-size: 21px; color: #09274c; font-weight: bold; font-family: 'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif; line-height: 28px;">Thank You for Submitting Your {"Incomplete " if incomplete else ""}Claim, {first}</h1>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Dear {first} {last},</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">My name is <strong style="color: #09274c;">Corey Pearson</strong>, Asset Recovery Specialist at <strong style="color: #09274c;">Foreclosure Recovery Inc.</strong> Thank you for reaching out to us through our website{' regarding the property at <strong style="color: #09274c;">' + display_address + '</strong>' if display_address else ''}. We have assigned <strong style="color: #09274c;">Allie Pearson</strong> as your dedicated recovery agent, and she will be your primary point of contact throughout this process.</p>
{'<p style="margin: 0px 0px 18px; font-size: 15px; color: #2c3e50; line-height: 26px; text-align: center;"><span style="text-decoration: underline; color: #e03e2d;"><em><strong>Please respond with the complete address so we can begin actively searching the property address.</strong></em></span></p>' if incomplete else ''}
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">We have received your {"incomplete " if incomplete else ""}claim submission and our team {"is ready to" if incomplete else "is now actively"} research{"" if incomplete else "ing"} the property records{' in <strong style="color: #09274c;">' + county + ' County, ' + state + '</strong>' if county and state else ''} to determine the surplus fund status and estimated recovery amount.{'' if incomplete else ' <strong style="color: #09274c;">We will provide you with an update within 24 hours</strong> of this email with our initial findings.'}</p>
</td>
</tr></tbody>
</table>


<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;">
<table style="border: 1px solid #dce1e8; border-radius: 6px; border-left: 4px solid #09274C;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 22px 24px;">
<p style="margin: 0 0 12px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Property on Record</p>
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight',sans-serif;" width="130">Address:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight',sans-serif;">{display_address or address or 'Not provided'}</td></tr>
{'<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: Inter Tight,sans-serif;" width="130">County:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: Inter Tight,sans-serif;">' + county + '</td></tr>' if county else ''}
{'<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: Inter Tight,sans-serif;" width="130">State:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: Inter Tight,sans-serif;">' + state + '</td></tr>' if state else ''}
{'<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: Inter Tight,sans-serif;" width="130">Foreclosure Date:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: Inter Tight,sans-serif;">' + foreclosure_formatted + '</td></tr>' if foreclosure_date else ''}
{'<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: Inter Tight,sans-serif;" width="130">Lender:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: Inter Tight,sans-serif;">' + lender + '</td></tr>' if lender else ''}
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight',sans-serif;" width="130">Reference #:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight',sans-serif;">{ref}</td></tr>
</tbody></table>
</td></tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 0;">
<table style="background-color: #f0f7ff; border-radius: 6px; border-left: 4px solid #09274c;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 18px 22px;">
<p style="margin: 0 0 6px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">What We're Researching</p>
<p style="margin: 0; font-size: 14px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight',sans-serif;">
  Our team is now pulling public records{' from ' + county + ' County' if county else ''} to determine:<br />
  &bull; Whether surplus funds exist from the foreclosure sale<br />
  &bull; The estimated amount available for recovery<br />
  &bull; Any case numbers or docket references tied to the property<br />
  &bull; The current assessed property value and public liens<br />
  &bull; Applicable deadlines under {state or 'state'} law
</p>
</td></tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 0;">
<table style="background-color: #fff9e6; border-radius: 6px; border-left: 4px solid #d4af37;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 18px 22px;">
<p style="margin: 0 0 6px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Information That Would Help Your Case</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight',sans-serif;">While our research is underway, any of the following details you can provide will help us move faster and give you a more accurate estimate of what you may be owed:</p>
<table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody>
<tr><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">1.</strong></td><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">How much did the property sell for at the foreclosure auction?</strong> This is the most important number -- the surplus is the difference between the auction price and what was owed.</td></tr>
<tr><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">2.</strong></td><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">How much was owed on the mortgage prior to the foreclosure?</strong> The principal balance, plus any liens or back taxes, helps us calculate the net surplus.</td></tr>
<tr><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">3.</strong></td><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">Do you have any court case numbers or documents</strong> related to the foreclosure? Even partial numbers help us locate the right records faster.</td></tr>
{'<tr><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: Inter Tight,sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">4.</strong></td><td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: Inter Tight,sans-serif;"><strong style="color: #09274c;">The full street address with house number</strong> (you provided "' + address + '" -- if you can include the house number, it helps us pull exact records).</td></tr>' if incomplete else ''}
</tbody></table>
<p style="margin: 12px 0 0; font-size: 13px; color: #5a6d82; line-height: 20px; font-family: 'Inter Tight',sans-serif;">Don't worry if you don't have all of this -- just share whatever you can. We will locate the remaining details through our research.</p>
</td></tr></tbody>
</table>
</td>
</tr></tbody>
</table>

{'<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 0;">' + deadline_note + '</td></tr></tbody></table>' if deadline_note else ''}

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 22px 40px 0;">
<table style="background-color: #fef9f0; border: 1px solid #f0e0c0; border-radius: 6px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 22px 24px;">
<p style="margin: 0 0 10px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Ready to Get Started?</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight',sans-serif;">We have attached our <strong style="color: #09274c;">Contingency Fee Agreement</strong> for your review. This is a no-risk, no-upfront-cost arrangement -- you only pay if we successfully recover your funds.</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight',sans-serif;">If you would like to get started right away, simply <strong style="color: #09274c;">print page 5</strong> of the attached agreement, sign it, take a photo, and send it back to us by replying to this email or texting it to <strong style="color: #09274c;">(888) 545-8007</strong>. We will begin working on your claim immediately.</p>
<p style="margin: 0; font-size: 13px; color: #5a6d82; line-height: 20px; font-family: 'Inter Tight',sans-serif;">No upfront costs. No risk to you. We only get paid when you do.</p>
</td></tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 22px 40px 0;">
<table style="background-color: #f7f9fb; border-radius: 6px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 22px 24px;">
<p style="margin: 0 0 14px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">How to Respond</p>
<table style="margin-bottom: 12px;" border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9742;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">By Phone</strong><br /><span style="color: #2c3e50;">Call <strong>Allie Pearson</strong> directly at </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="tel:+18885458007">(888) 545-8007</a></p></td>
</tr></tbody></table>
<table style="margin-bottom: 12px;" border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9993;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">By Email</strong><br /><span style="color: #2c3e50;">Reply to this email or write to </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="mailto:claim@usforeclosurerecovery.com">claim@usforeclosurerecovery.com</a></p></td>
</tr></tbody></table>
<table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9993;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">By Text</strong><br /><span style="color: #2c3e50;">Text us at </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="sms:+18885458007">(888) 545-8007</a></p></td>
</tr></tbody></table>
</td></tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 12px;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">We look forward to helping you recover the funds that are rightfully yours. You will hear from us within 24 hours.</p>
<table style="border-top: 1px solid #e2e6eb; padding-top: 20px;" border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding-top: 20px;">
<p style="margin: 0 0 2px; font-size: 15px; color: #09274c; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Corey Pearson</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight',sans-serif;">Foreclosure Recovery Inc.</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight',sans-serif;">On behalf of <strong>Allie Pearson</strong>, your Asset Recovery Agent</p>
<p style="margin: 8px 0 0; font-size: 13px; font-family: 'Inter Tight',sans-serif;"><a style="color: #09274c; text-decoration: none;" href="tel:+18885458007">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color: #09274c; text-decoration: none;" href="mailto:claim@usforeclosurerecovery.com">claim@usforeclosurerecovery.com</a></p>
</td></tr></tbody></table>
</td>
</tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px 0;"><div style="border-top: 2px solid #D82221; width: 60px;">&nbsp;</div></td></tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 30px;">
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight',sans-serif;">Foreclosure Recovery Inc. &middot; 30 N Gould St, Ste R &middot; Sheridan, WY 82801</p>
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight',sans-serif;">This correspondence pertains to the property and individual(s) named above. Recovery of foreclosure surplus proceeds is subject to individual case evaluation and applicable state statutes. Foreclosure Recovery Inc. is not a law firm and does not provide legal counsel.</p>
<p style="margin: 0; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight',sans-serif;">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="https://usforeclosurerecovery.com/privacy-policy">Privacy Policy</a></p>
</td>
</tr></tbody>
</table>

<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>

</div>
</center>
</body>
</html>"""

    return subject, html


def generate_agreement_html(lead: dict) -> str:
    """Generate a filled contingency agreement as HTML attachment."""
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")
    name = f"{lead['first_name']} {lead['last_name']}"
    address = lead["address"] or "Address pending"
    county = lead["county"] or ""
    state = lead["state"] or ""

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Contingency Fee Agreement</title></head>
<body style="font-family: 'Times New Roman', Times, serif; max-width: 700px; margin: 40px auto; padding: 0 30px; color: #1a1a1a; line-height: 1.8; font-size: 14px;">
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 20px; margin: 0 0 4px; color: #09274c;">FORECLOSURE RECOVERY INC.</h1>
  <p style="margin: 0; font-size: 13px; color: #5a6d82;">30 N Gould St, Ste R | Sheridan, WY 82801 | (888) 545-8007</p>
  <div style="border-top: 2px solid #09274c; margin: 15px auto; width: 80%;"></div>
  <h2 style="font-size: 18px; margin: 0; color: #09274c;">CONTINGENCY FEE AGREEMENT</h2>
  <h3 style="font-size: 15px; margin: 4px 0 0; color: #09274c;">Foreclosure Surplus Fund Recovery Services</h3>
</div>
<p><strong>Date:</strong> {today}</p>
<p><strong>PARTIES:</strong></p>
<p style="margin-left: 20px;"><strong>"Company":</strong> Foreclosure Recovery Inc., a Wyoming corporation<br /><strong>"Client":</strong> {name}, {address}</p>
<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">1. SCOPE OF SERVICES</h3>
<p>The Company agrees to research, identify, and recover surplus funds resulting from the foreclosure sale of the Client's former property located at <strong>{address}</strong>{', ' + county + ' County, ' + state if county else ''}.</p>
<p>Services include: (a) researching public records; (b) preparing and filing claims; (c) communicating with state/county agencies; (d) coordinating with legal counsel; and (e) ensuring proper fund distribution.</p>
<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">2. CONTINGENCY FEE</h3>
<p>The Client agrees to pay a contingency fee of <strong>thirty percent (30%)</strong> of the total surplus funds recovered. Payable ONLY upon successful recovery. If no funds are recovered, the Client owes nothing.</p>
<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">3. CLIENT OBLIGATIONS</h3>
<p>The Client agrees to: (a) provide truthful information; (b) respond to communications timely; (c) sign required documents; (d) not engage another party for the same claim.</p>
<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">4. TERM AND TERMINATION</h3>
<p>This agreement remains in effect until funds are recovered or terminated with 30 days written notice.</p>
<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">5. NO GUARANTEE</h3>
<p>The Company makes no guarantee of recovery. The Company will exercise professional diligence.</p>
<div style="margin-top: 40px; page-break-before: always;">
  <p style="text-align: center; font-size: 12px; color: #7a8a9e; margin-bottom: 30px;">-- Page 5: Signature Page --</p>
  <h3 style="font-size: 16px; color: #09274c; text-align: center;">SIGNATURE PAGE</h3>
  <p>By signing below, the parties agree to the terms of this Contingency Fee Agreement.</p>
  <table border="0" width="100%" style="margin-top: 30px;"><tr>
    <td width="48%" style="padding-bottom: 40px;"><div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div><p style="margin: 4px 0 0; font-size: 13px;"><strong>{name}</strong> (Client)</p></td>
    <td width="4%"></td>
    <td width="48%" style="padding-bottom: 40px;"><div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div><p style="margin: 4px 0 0; font-size: 13px;"><strong>Date</strong></p></td>
  </tr><tr>
    <td width="48%"><div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div><p style="margin: 4px 0 0; font-size: 13px;"><strong>Foreclosure Recovery Inc.</strong></p></td>
    <td width="4%"></td>
    <td width="48%"><div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div><p style="margin: 4px 0 0; font-size: 13px;"><strong>Date</strong></p></td>
  </tr></table>
  <p style="margin-top: 30px; font-size: 13px; color: #5a6d82; text-align: center;">Print this page, sign above, take a photo, and send to<br /><strong>claim@usforeclosurerecovery.com</strong> or text to <strong>(888) 545-8007</strong>.</p>
</div>
</body></html>"""


# ── IMAP Functions ─────────────────────────────────────────
def imap_connect():
    """Create TLS IMAP connection."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    sock = ctx.wrap_socket(socket.socket(), server_hostname=IMAP_HOST)
    sock.settimeout(30)
    sock.connect((IMAP_HOST, IMAP_PORT))
    return sock


def imap_recv(sock):
    data = b""
    while True:
        try:
            chunk = sock.recv(8192)
            if not chunk:
                break
            data += chunk
            if b"\r\n" in chunk:
                break
        except socket.timeout:
            break
    return data.decode("utf-8", errors="replace")


def imap_cmd(sock, tag, cmd):
    sock.sendall(f"{tag} {cmd}\r\n".encode())
    resp = ""
    while True:
        line = imap_recv(sock)
        resp += line
        if f"{tag} OK" in line or f"{tag} NO" in line or f"{tag} BAD" in line:
            break
    return resp


def fetch_new_claim_emails():
    """Search INBOX for unread emails with 'New Claim' in subject."""
    sock = imap_connect()

    # Greeting
    imap_recv(sock)

    # Login
    resp = imap_cmd(sock, "A1", f"LOGIN {IMAP_USER} {IMAP_PASS}")
    if "OK" not in resp:
        print(f"  IMAP login failed: {resp[:100]}")
        sock.close()
        return []

    # Select INBOX
    resp = imap_cmd(sock, "A2", "SELECT INBOX")

    # Search for unread emails with "New Claim" in subject
    sock.sendall(b'A3 SEARCH UNSEEN SUBJECT "New Claim"\r\n')
    search_resp = ""
    while True:
        line = imap_recv(sock)
        search_resp += line
        if "A3 OK" in line or "A3 NO" in line or "A3 BAD" in line:
            break

    # Parse message UIDs
    uids = []
    for line in search_resp.split("\r\n"):
        if line.startswith("* SEARCH"):
            parts = line.replace("* SEARCH", "").strip().split()
            uids = [p for p in parts if p.isdigit()]
            break

    if not uids:
        print("  No new claim emails found.")
        sock.close()
        return []

    print(f"  Found {len(uids)} new claim email(s): {uids}")

    results = []
    for uid in uids:
        # Fetch full email body
        sock.sendall(f"A4 FETCH {uid} (BODY[])\r\n".encode())
        fetch_resp = b""
        while True:
            try:
                chunk = sock.recv(65536)
                if not chunk:
                    break
                fetch_resp += chunk
                decoded = fetch_resp.decode("utf-8", errors="replace")
                if f"A4 OK" in decoded:
                    break
            except socket.timeout:
                break

        body_text = fetch_resp.decode("utf-8", errors="replace")
        results.append({"uid": uid, "body": body_text})

        # Mark as seen (it's already fetched)
        imap_cmd(sock, "A5", f"STORE {uid} +FLAGS (\\Seen)")

    imap_cmd(sock, "A99", "LOGOUT")
    sock.close()
    return results


def create_draft(lead: dict):
    """Create and append email draft to IMAP Drafts."""
    subject, html = generate_web_claim_email(lead)
    agreement_html = generate_agreement_html(lead)

    # Base64 encode agreement
    agreement_b64 = base64.b64encode(agreement_html.encode("utf-8")).decode("ascii")
    agreement_lines = "\r\n".join(
        agreement_b64[i:i+76] for i in range(0, len(agreement_b64), 76)
    )

    now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    ts = int(datetime.now(timezone.utc).timestamp())
    mixed_boundary = f"mixed_{ts}"
    alt_boundary = f"alt_{ts + 1}"
    name = f"{lead['first_name']}-{lead['last_name']}".replace(" ", "-")
    filename = f"Contingency-Fee-Agreement-{name}.html"

    plaintext = (
        f"Dear {lead['first_name']}, thank you for submitting your claim. "
        f"We are researching your property and will provide an update within 24 hours. "
        f"Please reply with any details about the auction sale price or mortgage balance. "
        f"Call (888) 545-8007."
    )

    email_raw = "\r\n".join([
        f"From: {SENDER_NAME} <{SENDER_EMAIL}>",
        f"To: {lead['email']}",
        f"Subject: {subject}",
        f"Date: {now}",
        f"Message-ID: <{ts}.webclaim@usforeclosurerecovery.com>",
        "MIME-Version: 1.0",
        f'Content-Type: multipart/mixed; boundary="{mixed_boundary}"',
        f"X-Claim-Ref: {lead['ref']}",
        "",
        f"--{mixed_boundary}",
        f'Content-Type: multipart/alternative; boundary="{alt_boundary}"',
        "",
        f"--{alt_boundary}",
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: quoted-printable",
        "",
        plaintext,
        "",
        f"--{alt_boundary}",
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: quoted-printable",
        "",
        html,
        "",
        f"--{alt_boundary}--",
        "",
        f"--{mixed_boundary}",
        f'Content-Type: text/html; charset=utf-8; name="{filename}"',
        "Content-Transfer-Encoding: base64",
        f'Content-Disposition: attachment; filename="{filename}"',
        "",
        agreement_lines,
        "",
        f"--{mixed_boundary}--",
        "",
    ])

    email_bytes = email_raw.encode("utf-8")

    # IMAP APPEND
    sock = imap_connect()
    imap_recv(sock)  # greeting

    resp = imap_cmd(sock, "A1", f"LOGIN {IMAP_USER} {IMAP_PASS}")
    if "OK" not in resp:
        print(f"  Draft IMAP login failed")
        sock.close()
        return False

    size = len(email_bytes)

    # Try Drafts first
    sock.sendall(f'A2 APPEND "Drafts" (\\Draft \\Seen) {{{size}}}\r\n'.encode())
    resp = imap_recv(sock)

    if resp.strip().startswith("+"):
        sock.sendall(email_bytes + b"\r\n")
        resp = imap_recv(sock)
        if "OK" in resp:
            imap_cmd(sock, "A3", "LOGOUT")
            sock.close()
            return True

    # Fallback to INBOX.Drafts
    sock.sendall(f'A4 APPEND "INBOX.Drafts" (\\Draft \\Seen) {{{size}}}\r\n'.encode())
    resp = imap_recv(sock)

    if resp.strip().startswith("+"):
        sock.sendall(email_bytes + b"\r\n")
        resp = imap_recv(sock)
        if "OK" in resp:
            imap_cmd(sock, "A5", "LOGOUT")
            sock.close()
            return True

    print(f"  Draft APPEND failed")
    imap_cmd(sock, "A6", "LOGOUT")
    sock.close()
    return False


# ── Main ───────────────────────────────────────────────────
def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"\n[{now}] Web Claim Processor - checking inbox...")

    emails = fetch_new_claim_emails()

    if not emails:
        print(f"[{now}] No new claims. Done.")
        return

    for email_data in emails:
        uid = email_data["uid"]
        body = email_data["body"]

        print(f"\n  Processing email UID {uid}...")

        # Parse lead data from HTML
        lead = parse_claim_email(body)

        if not lead["name"] or not lead["email"]:
            print(f"  SKIP: Could not parse name ({lead['name']}) or email ({lead['email']})")
            continue

        print(f"  Lead: {lead['name']} ({lead['email']})")
        print(f"  Address: {lead['address'] or 'NOT PROVIDED'}")
        print(f"  County: {lead['county']}, State: {lead['state']}")
        print(f"  Incomplete address: {is_address_incomplete(lead['address'])}")

        # Create draft
        success = create_draft(lead)
        if success:
            print(f"  Draft created for {lead['name']} -> {lead['email']}")
        else:
            print(f"  ERROR: Failed to create draft for {lead['name']}")

    print(f"\n[{now}] Processing complete. {len(emails)} claim(s) handled.")


if __name__ == "__main__":
    main()
