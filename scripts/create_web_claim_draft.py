#!/usr/bin/env python3
"""
Create an IMAP email draft for a web claim submission.
Customized for leads who submitted via the website claim form.
"""

import ssl
import socket
import sys
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os

# ── Lead Data ──────────────────────────────────────────────
LEAD = {
    "first_name": "Tia",
    "last_name": "Franklin",
    "email": "tiafranklin90@gmail.com",
    "phone": "(346) 465-5939",
    "address": "Buchanan, Detroit, Michigan 48911",
    "county": "Wayne",
    "state": "Michigan",
    "state_abbr": "MI",
    "foreclosure_date": "2015-02-16",
    "ref": "WEB202602167102",
}

# ── IMAP Config ────────────────────────────────────────────
IMAP_HOST = "imap.hostinger.com"
IMAP_PORT = 993
IMAP_USER = "claim@usforeclosurerecovery.com"
IMAP_PASS = os.environ.get("IMAP_CLAIM_PASSWORD", "Thepassword#123")
SENDER_EMAIL = "claim@usforeclosurerecovery.com"
SENDER_NAME = "Foreclosure Recovery Inc."

LOGO_URL = "https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png"


def generate_web_claim_email(lead: dict) -> tuple[str, str]:
    """Generate subject and HTML for a web claim follow-up email."""
    first = lead["first_name"]
    last = lead["last_name"]
    address = lead["address"]
    county = lead["county"]
    state = lead["state"]
    state_abbr = lead["state_abbr"]
    foreclosure_date = lead["foreclosure_date"]
    ref = lead["ref"]
    today = datetime.now().strftime("%B %d, %Y")

    # Format foreclosure date
    try:
        fd = datetime.strptime(foreclosure_date, "%Y-%m-%d")
        foreclosure_formatted = fd.strftime("%B %d, %Y")
    except ValueError:
        foreclosure_formatted = foreclosure_date

    subject = f"Re: Your Surplus Fund Claim -- {address} (Ref: {ref})"

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
body {{ margin: 0; padding: 0; width: 100% !important; }}
@media only screen and (max-width: 620px) {{
.email-container {{ width: 100% !important; max-width: 100% !important; }}
.padding-mobile {{ padding-left: 20px !important; padding-right: 20px !important; }}
}}
</style>
</head>
<body>
<center style="width: 100%; background-color: #f4f5f7;">
<div class="email-container" style="max-width: 600px; margin: 0 auto;">

<!-- Top bar -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>

<!-- Header -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 20px;">
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td align="left" valign="middle" width="55%">
  <a style="text-decoration: none;" href="https://usforeclosurerecovery.com">
    <img style="display: block; max-width: 185px; height: auto;" src="{LOGO_URL}" alt="Foreclosure Recovery Inc." width="185" />
  </a>
</td>
<td align="right" valign="middle" width="45%">
<p style="margin: 0; font-size: 12px; color: #7a8a9e; font-family: 'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif; line-height: 18px;">
  {today}<br />
  <span style="color: #09274c; font-weight: 600;">Ref: <span style="color: #0a0a0a; font-size: 14px; font-weight: 500;">{ref}</span></span>
</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- Divider -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;"><div style="border-top: 1px solid #e2e6eb;">&nbsp;</div></td></tr></tbody>
</table>

<!-- Greeting & Intro -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 10px 40px 0;">
<p style="margin: 0 0 6px; font-size: 11px; color: #1a7a3a; text-transform: uppercase; letter-spacing: 1.2px; font-family: 'Inter Tight',sans-serif; font-weight: 600;">Claim Received -- Thank You</p>

<h1 style="margin: 0 0 24px; font-size: 21px; color: #09274c; font-weight: bold; font-family: 'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif; line-height: 28px;">
  Thank You for Submitting Your Claim, {first}
</h1>

<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">
  Dear {first} {last},
</p>

<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">
  My name is <strong style="color: #09274c;">Corey Pearson</strong>, Director at <strong style="color: #09274c;">Foreclosure Recovery Inc.</strong> Thank you for reaching out to us through our website regarding the property at <strong style="color: #09274c;">{address}</strong>. We have assigned <strong style="color: #09274c;">Allie Pearson</strong> as your dedicated recovery agent, and she will be your primary point of contact throughout this process.
</p>

<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">
  We have received your claim submission and our team is now actively researching the property records in <strong style="color: #09274c;">{county} County, {state}</strong> to determine the surplus fund status and estimated recovery amount. <strong style="color: #09274c;">We will provide you with an update within 24 hours</strong> of this email with our initial findings.
</p>
</td>
</tr></tbody>
</table>

<!-- Property Details Box -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;">
<table style="border: 1px solid #dce1e8; border-radius: 6px; border-left: 4px solid #09274C;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 12px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Property on Record</p>
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
  <td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="130">Address:</td>
  <td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight',sans-serif;">{address}</td>
</tr>
<tr>
  <td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="130">County:</td>
  <td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight',sans-serif;">{county}</td>
</tr>
<tr>
  <td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="130">State:</td>
  <td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight',sans-serif;">{state}</td>
</tr>
<tr>
  <td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="130">Foreclosure Date:</td>
  <td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight',sans-serif;">{foreclosure_formatted}</td>
</tr>
<tr>
  <td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="130">Reference #:</td>
  <td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight',sans-serif;">{ref}</td>
</tr>
</tbody>
</table>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- Research Notice -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 0;">
<table style="background-color: #f0f7ff; border-radius: 6px; border-left: 4px solid #09274c;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 18px 22px;">
<p style="margin: 0 0 6px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">What We're Researching</p>
<p style="margin: 0; font-size: 14px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight',sans-serif;">
  Our team is now pulling public records from {county} County to determine:<br />
  &bull; Whether surplus funds exist from the foreclosure sale<br />
  &bull; The estimated amount available for recovery<br />
  &bull; Any case numbers or docket references tied to the property<br />
  &bull; The current assessed property value and public liens<br />
  &bull; Applicable deadlines under {state} law
</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- Information Request -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 0;">
<table style="background-color: #fff9e6; border-radius: 6px; border-left: 4px solid #d4af37;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 18px 22px;">
<p style="margin: 0 0 6px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Information That Would Help Your Case</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight',sans-serif;">
  While our research is underway, any of the following details you can provide will help us move faster and give you a more accurate estimate of what you may be owed:
</p>
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">1.</strong></td>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">How much did the property sell for at the foreclosure auction?</strong> This is the most important number -- the surplus is the difference between the auction price and what was owed.</td>
</tr>
<tr>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">2.</strong></td>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">How much was owed on the mortgage prior to the foreclosure?</strong> The principal balance, plus any liens or back taxes, helps us calculate the net surplus.</td>
</tr>
<tr>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">3.</strong></td>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">Do you have any court case numbers or documents</strong> related to the foreclosure? Even partial numbers help us locate the right records faster.</td>
</tr>
<tr>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif; vertical-align: top;" width="24"><strong style="color: #d4af37;">4.</strong></td>
  <td style="padding: 6px 0; font-size: 14px; color: #2c3e50; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">The full street address with house number</strong> (you provided "Buchanan" -- if you can include the house number, it helps us pull exact records).</td>
</tr>
</tbody>
</table>
<p style="margin: 12px 0 0; font-size: 13px; color: #5a6d82; line-height: 20px; font-family: 'Inter Tight',sans-serif;">
  Don't worry if you don't have all of this -- just share whatever you can. We will locate the remaining details through our research.
</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- Michigan Deadline Notice -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 0;">
<table style="background-color: #f0f9ff; border-radius: 6px; border-left: 4px solid #09274c;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 16px 20px;">
<p style="margin: 0 0 4px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Michigan Statute Note</p>
<p style="margin: 0; font-size: 14px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight',sans-serif;">
  Under Michigan law, former property owners have <strong style="color: #09274c;">1 year</strong> from the date of the foreclosure sale to claim surplus funds. Your foreclosure date of {foreclosure_formatted} is well past this statutory window. However, we will research whether unclaimed surplus funds were transferred to the state's unclaimed property division, where they may still be recoverable with no time limit. We will include this in our 24-hour update.
</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- Contingency Agreement Section -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 22px 40px 0;">
<table style="background-color: #fef9f0; border: 1px solid #f0e0c0; border-radius: 6px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 10px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Ready to Get Started?</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight',sans-serif;">
  We have attached our <strong style="color: #09274c;">Contingency Fee Agreement</strong> for your review. This is a no-risk, no-upfront-cost arrangement -- you only pay if we successfully recover your funds.
</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight',sans-serif;">
  If you would like to get started right away, simply <strong style="color: #09274c;">print page 5</strong> of the attached agreement, sign it, take a photo, and send it back to us by replying to this email or texting it to <strong style="color: #09274c;">(888) 545-8007</strong>. We will begin working on your claim immediately.
</p>
<p style="margin: 0; font-size: 13px; color: #5a6d82; line-height: 20px; font-family: 'Inter Tight',sans-serif;">No upfront costs. No risk to you. We only get paid when you do.</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- How to Respond -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 22px 40px 0;">
<table style="background-color: #f7f9fb; border-radius: 6px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 14px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight',sans-serif;">How to Respond</p>

<table style="margin-bottom: 12px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9742;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">By Phone</strong><br /><span style="color: #2c3e50;">Call <strong>Allie Pearson</strong> directly at </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="tel:+18885458007">(888) 545-8007</a></p></td>
</tr></tbody>
</table>

<table style="margin-bottom: 12px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9993;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">By Email</strong><br /><span style="color: #2c3e50;">Reply to this email or write to </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="mailto:claim@usforeclosurerecovery.com">claim@usforeclosurerecovery.com</a></p></td>
</tr></tbody>
</table>

<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9993;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight',sans-serif;"><strong style="color: #09274c;">By Text</strong><br /><span style="color: #2c3e50;">Text us at </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="sms:+18885458007">(888) 545-8007</a></p></td>
</tr></tbody>
</table>

</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- Signature -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 12px;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">We look forward to helping you recover the funds that are rightfully yours. You will hear from us within 24 hours.</p>
<table style="border-top: 1px solid #e2e6eb; padding-top: 20px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 20px;">
<p style="margin: 0 0 2px; font-size: 15px; color: #09274c; font-weight: bold; font-family: 'Inter Tight',sans-serif;">Corey Pearson</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight',sans-serif;">Director, Foreclosure Recovery Inc.</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight',sans-serif;">On behalf of <strong>Allie Pearson</strong>, your Asset Recovery Agent</p>
<p style="margin: 8px 0 0; font-size: 13px; font-family: 'Inter Tight',sans-serif;">
  <a style="color: #09274c; text-decoration: none;" href="tel:+18885458007">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a style="color: #09274c; text-decoration: none;" href="mailto:claim@usforeclosurerecovery.com">claim@usforeclosurerecovery.com</a>
</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>

<!-- Red accent line -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px 0;"><div style="border-top: 2px solid #D82221; width: 60px;">&nbsp;</div></td></tr></tbody>
</table>

<!-- Footer -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 30px;">
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight',sans-serif;">Foreclosure Recovery Inc. &middot; 30 N Gould St, Ste R &middot; Sheridan, WY 82801</p>
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight',sans-serif;">This correspondence pertains to the property and individual(s) named above. Recovery of foreclosure surplus proceeds is subject to individual case evaluation and applicable state statutes. Foreclosure Recovery Inc. is not a law firm and does not provide legal counsel.</p>
<p style="margin: 0; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight',sans-serif;">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="https://usforeclosurerecovery.com/privacy-policy">Privacy Policy</a></p>
</td>
</tr></tbody>
</table>

<!-- Bottom bar -->
<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>

</div>
</center>
</body>
</html>"""

    return subject, html


def generate_agreement_html(lead: dict) -> str:
    """Generate a filled contingency agreement as HTML for attachment."""
    today = datetime.now().strftime("%B %d, %Y")
    name = f"{lead['first_name']} {lead['last_name']}"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Contingency Fee Agreement</title></head>
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
<p style="margin-left: 20px;">
  <strong>"Company":</strong> Foreclosure Recovery Inc., a Wyoming corporation, 30 N Gould St, Ste R, Sheridan, WY 82801<br />
  <strong>"Client":</strong> {name}, {lead['address']}
</p>

<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">1. SCOPE OF SERVICES</h3>
<p>The Company agrees to research, identify, and recover surplus funds (also known as "excess proceeds" or "overbid funds") resulting from the foreclosure sale of the Client's former property located at <strong>{lead['address']}</strong>, {lead['county']} County, {lead['state']}.</p>
<p>Services include: (a) researching public records to verify surplus fund existence and amount; (b) preparing and filing all necessary claims and legal documents; (c) communicating with state and county agencies; (d) coordinating with any required legal counsel; and (e) ensuring proper distribution of recovered funds to the Client.</p>

<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">2. CONTINGENCY FEE</h3>
<p>The Client agrees to pay the Company a contingency fee of <strong>thirty percent (30%)</strong> of the total surplus funds recovered. This fee is payable ONLY upon successful recovery and distribution of funds. If no funds are recovered, the Client owes nothing.</p>
<ul style="margin: 10px 0;">
  <li>No upfront fees, retainers, or out-of-pocket costs to the Client</li>
  <li>The Company bears all costs of research, filing, and administration</li>
  <li>Fee is calculated on the gross amount recovered before distribution</li>
</ul>

<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">3. CLIENT OBLIGATIONS</h3>
<p>The Client agrees to: (a) provide truthful and accurate information; (b) respond to communications in a timely manner; (c) sign any documents reasonably required for the claim; (d) not engage another party to pursue the same surplus funds during this agreement.</p>

<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">4. TERM AND TERMINATION</h3>
<p>This agreement remains in effect until the surplus funds are recovered and distributed, or until terminated by either party with 30 days written notice. If the Client terminates after the Company has filed a claim, the contingency fee remains payable on any funds subsequently recovered as a result of the Company's efforts.</p>

<h3 style="font-size: 16px; color: #09274c; border-bottom: 1px solid #09274c; padding-bottom: 4px;">5. NO GUARANTEE</h3>
<p>The Company makes no guarantee of recovery. The existence, amount, and recoverability of surplus funds depend on factors including state law, county procedures, and competing claims. The Company will exercise professional diligence in pursuing the claim.</p>

<div style="margin-top: 40px; page-break-before: always;">
  <p style="text-align: center; font-size: 12px; color: #7a8a9e; margin-bottom: 30px;">-- Page 5: Signature Page --</p>

  <h3 style="font-size: 16px; color: #09274c; text-align: center;">SIGNATURE PAGE</h3>

  <p>By signing below, the parties agree to the terms and conditions set forth in this Contingency Fee Agreement.</p>

  <table border="0" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
    <tr>
      <td width="48%" style="padding-bottom: 40px;">
        <div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div>
        <p style="margin: 4px 0 0; font-size: 13px;"><strong>{name}</strong> (Client)</p>
      </td>
      <td width="4%"></td>
      <td width="48%" style="padding-bottom: 40px;">
        <div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div>
        <p style="margin: 4px 0 0; font-size: 13px;"><strong>Date</strong></p>
      </td>
    </tr>
    <tr>
      <td width="48%" style="padding-bottom: 20px;">
        <div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div>
        <p style="margin: 4px 0 0; font-size: 13px;"><strong>Foreclosure Recovery Inc.</strong> (Company)</p>
      </td>
      <td width="4%"></td>
      <td width="48%" style="padding-bottom: 20px;">
        <div style="border-bottom: 1px solid #1a1a1a; height: 40px;"></div>
        <p style="margin: 4px 0 0; font-size: 13px;"><strong>Date</strong></p>
      </td>
    </tr>
  </table>

  <p style="margin-top: 30px; font-size: 13px; color: #5a6d82; text-align: center;">
    Please print this page, sign above, take a photo, and send it back to us via email at<br />
    <strong>claim@usforeclosurerecovery.com</strong> or text it to <strong>(888) 545-8007</strong>.
  </p>
</div>

</body>
</html>"""


def imap_append_draft(email_bytes: bytes):
    """Append email to IMAP Drafts folder via TLS."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    sock = ctx.wrap_socket(socket.socket(), server_hostname=IMAP_HOST)
    sock.connect((IMAP_HOST, IMAP_PORT))

    def recv():
        data = b""
        while True:
            chunk = sock.recv(4096)
            data += chunk
            if b"\r\n" in chunk:
                break
        return data.decode("utf-8", errors="replace")

    def send_cmd(tag, cmd):
        sock.sendall(f"{tag} {cmd}\r\n".encode())
        return recv()

    # Wait for greeting
    greeting = recv()
    print(f"  IMAP: {greeting.strip()[:60]}")

    # Login
    resp = send_cmd("A1", f"LOGIN {IMAP_USER} {IMAP_PASS}")
    if "OK" not in resp:
        print(f"  IMAP LOGIN FAILED: {resp.strip()}")
        sock.close()
        return False

    print("  IMAP: Login OK")

    # Try APPEND to Drafts
    size = len(email_bytes)
    sock.sendall(f'A2 APPEND "Drafts" (\\Draft \\Seen) {{{size}}}\r\n'.encode())
    resp = recv()

    if resp.strip().startswith("+"):
        sock.sendall(email_bytes + b"\r\n")
        resp = recv()
        if "OK" in resp:
            print("  IMAP: Draft appended to Drafts")
            send_cmd("A3", "LOGOUT")
            sock.close()
            return True

    # Fallback to INBOX.Drafts
    print("  IMAP: Trying INBOX.Drafts...")
    sock.sendall(f'A4 APPEND "INBOX.Drafts" (\\Draft \\Seen) {{{size}}}\r\n'.encode())
    resp = recv()

    if resp.strip().startswith("+"):
        sock.sendall(email_bytes + b"\r\n")
        resp = recv()
        if "OK" in resp:
            print("  IMAP: Draft appended to INBOX.Drafts")
            send_cmd("A5", "LOGOUT")
            sock.close()
            return True

    print(f"  IMAP: APPEND FAILED: {resp.strip()}")
    send_cmd("A6", "LOGOUT")
    sock.close()
    return False


def main():
    print("=== Creating Web Claim Email Draft ===")
    print(f"  Lead: {LEAD['first_name']} {LEAD['last_name']}")
    print(f"  Email: {LEAD['email']}")
    print(f"  Property: {LEAD['address']}")
    print()

    # Generate email
    subject, html = generate_web_claim_email(LEAD)
    print(f"  Subject: {subject}")

    # Generate agreement attachment
    agreement_html = generate_agreement_html(LEAD)
    import base64
    agreement_b64 = base64.b64encode(agreement_html.encode("utf-8")).decode("ascii")
    # Split into 76-char lines
    agreement_lines = "\r\n".join(
        agreement_b64[i:i+76] for i in range(0, len(agreement_b64), 76)
    )

    # Build MIME message
    now = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")
    mixed_boundary = f"mixed_{int(datetime.now().timestamp())}"
    alt_boundary = f"alt_{int(datetime.now().timestamp()) + 1}"

    name = f"{LEAD['first_name']}-{LEAD['last_name']}"
    agreement_filename = f"Contingency-Fee-Agreement-{name}.html"

    email_raw = "\r\n".join([
        f"From: {SENDER_NAME} <{SENDER_EMAIL}>",
        f"To: {LEAD['email']}",
        f"Subject: {subject}",
        f"Date: {now}",
        f"Message-ID: <{int(datetime.now().timestamp())}.webclaim@usforeclosurerecovery.com>",
        "MIME-Version: 1.0",
        f'Content-Type: multipart/mixed; boundary="{mixed_boundary}"',
        f"X-Claim-Ref: {LEAD['ref']}",
        "",
        f"--{mixed_boundary}",
        f'Content-Type: multipart/alternative; boundary="{alt_boundary}"',
        "",
        f"--{alt_boundary}",
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: quoted-printable",
        "",
        f"Dear {LEAD['first_name']}, thank you for submitting your claim. We are researching your property and will provide an update within 24 hours. Please reply with any details about the auction sale price or mortgage balance. Call (888) 545-8007.",
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
        f'Content-Type: text/html; charset=utf-8; name="{agreement_filename}"',
        "Content-Transfer-Encoding: base64",
        f'Content-Disposition: attachment; filename="{agreement_filename}"',
        "",
        agreement_lines,
        "",
        f"--{mixed_boundary}--",
        "",
    ])

    email_bytes = email_raw.encode("utf-8")
    print(f"  Email size: {len(email_bytes):,} bytes")
    print()

    # Append to IMAP Drafts
    success = imap_append_draft(email_bytes)

    if success:
        print("\n  Draft created successfully in claim@usforeclosurerecovery.com")
    else:
        print("\n  ERROR: Failed to create draft")
        sys.exit(1)


if __name__ == "__main__":
    main()
