import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import * as tls from "tls"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const SENDER_EMAIL = "claim@usforeclosurerecovery.com"
const SENDER_NAME = "Foreclosure Recovery Inc."
const IMAP_HOST = "imap.hostinger.com"
const IMAP_PORT = 993
const IMAP_USER = SENDER_EMAIL
const IMAP_PASS = process.env.IMAP_CLAIM_PASSWORD || "Thepassword#123"

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// State-specific statutory windows (years) for claiming foreclosure surplus funds
const STATE_CLAIM_WINDOWS: Record<string, number> = {
  AL: 1, AK: 1, AZ: 1, AR: 2, CA: 1, CO: 1, CT: 1, DE: 2, FL: 1, GA: 1,
  HI: 1, ID: 1, IL: 1, IN: 1, IA: 2, KS: 2, KY: 1, LA: 1, ME: 1, MD: 3,
  MA: 3, MI: 1, MN: 1, MS: 1, MO: 2, MT: 1, NE: 2, NV: 1, NH: 1, NJ: 2,
  NM: 1, NY: 5, NC: 1, ND: 2, OH: 2, OK: 2, OR: 2, PA: 2, RI: 1, SC: 1,
  SD: 1, TN: 1, TX: 2, UT: 1, VT: 1, VA: 1, WA: 1, WV: 1, WI: 1, WY: 1, DC: 2,
}

function getStateName(abbr: string): string {
  const names: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
    KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
    MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
    NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
    OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
  }
  return names[abbr.toUpperCase()] || abbr
}

function calculateDeadline(saleDate: string, stateAbbr: string): { daysRemaining: number; deadlineDate: string; urgency: string; stateName: string; claimYears: number } | null {
  if (!saleDate) return null
  const sale = new Date(saleDate)
  if (isNaN(sale.getTime())) return null
  const stateKey = (stateAbbr || "").toUpperCase()
  const claimYears = STATE_CLAIM_WINDOWS[stateKey] || 1
  const deadline = new Date(sale)
  deadline.setFullYear(deadline.getFullYear() + claimYears)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (daysRemaining < 0) return null
  const deadlineDate = deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const urgency = daysRemaining <= 60 ? "critical" : daysRemaining <= 120 ? "high" : "standard"
  const stateName = getStateName(stateKey)
  return { daysRemaining, deadlineDate, urgency, stateName, claimYears }
}

function populateTemplate(lead: Record<string, string>): {
  subject: string
  html: string
} {
  const firstName = lead.first_name || lead.owner_name?.split(" ")[0] || "Homeowner"
  const lastName = lead.last_name || lead.owner_name?.split(" ").slice(1).join(" ") || ""
  const rawPropertyAddress = lead.property_address || ""
  const rawMailingAddress = lead.mailing_address || ""
  const city = lead.city || ""
  const state = lead.state || ""
  // If property_address exists, combine with city/state. If only mailing_address exists, use it as-is (already includes city/state/zip)
  const fullAddress = rawPropertyAddress
    ? (city && state ? `${rawPropertyAddress}, ${city}, ${state}` : rawPropertyAddress)
    : rawMailingAddress || "your property"
  const county = lead.county || ""
  const apn = lead.apn_number || lead.parcel_id || ""
  const propertyType = lead.property_type || "Residential"
  const caseNumber = lead.case_number || ""
  const recipientEmail = lead.primary_email || ""
  const estimatedSurplus = parseFloat(lead.overage_amount) || parseFloat(lead.estimated_surplus) || 0
  const deadlineInfo = calculateDeadline(lead.sale_date, lead.state)

  const subject = `Re: Property Equity Distribution -- ${fullAddress}`

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
@media only screen and (max-width: 620px) {
.email-container { width: 100% !important; max-width: 100% !important; }
.padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
.property-box { padding: 18px 16px !important; }
}
</style>
</head>
<body>
<center style="width: 100%; background-color: #f4f5f7;">
<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">Re: Forwarding address needed -- Property at ${fullAddress} -- Please respond at your earliest convenience.</div>
<div class="email-container" style="max-width: 600px; margin: 0 auto;">
<!--[if mso]><table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"><tr><td><![endif]-->
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 20px;">
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td align="left" valign="middle" width="55%"><a style="text-decoration: none;" href="https://usforeclosurerecovery.com" target="_blank" rel="noopener"><img style="display: block; max-width: 185px; height: auto;" src="https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/67ec5c05ff123f63a8f428c7_us%20foreclosure%20recovery.png" alt="Foreclosure Recovery Inc." width="185" /></a></td>
<td align="right" valign="middle" width="45%">
<p style="margin: 0; font-size: 12px; color: #7a8a9e; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 18px;">${formatDate()}${caseNumber ? `<br /><span style="color: #09274c; font-weight: 600;">Ref: <span style="color: #0a0a0a; font-size: 14px; font-weight: 500;">${caseNumber}</span></span>` : ""}</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;"><div style="border-top: 1px solid #e2e6eb;">&nbsp;</div></td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 10px 40px 0;">
<p style="margin: 0 0 6px; font-size: 11px; color: #7a8a9e; text-transform: uppercase; letter-spacing: 1.2px; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 600;">Re: Property Equity Distribution</p>
<h1 style="margin: 0 0 24px; font-size: 21px; color: #09274c; font-weight: bold; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 28px;">Forwarding Address Required for<br />Fund Distribution</h1>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Dear ${firstName} ${lastName},</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">I recently left a voicemail regarding this matter and wanted to follow up in writing. My name is <strong style="color: #09274c;">Corey Pearson</strong>, and I am reaching out from <strong style="color: #09274c;">Foreclosure Recovery Inc.</strong> on behalf of <strong style="color: #09274c;">Allie Pearson</strong>, your assigned recovery agent.</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">We are writing to inform you that the property referenced below has been identified as having <strong style="color: #09274c;">excess equity proceeds</strong> associated with the <strong style="color: #09274c;">foreclosure sale</strong>. After the lending institution has been satisfied from the auction, the remaining balance is to be distributed to the former owner of record.</p>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;">
<table style="border: 1px solid #dce1e8; border-radius: 6px; border-left: 4px solid #09274C;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td class="property-box" style="padding: 22px 24px;">
<p style="margin: 0 0 12px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Property on Record</p>
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">Address:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${fullAddress}</td></tr>
${county ? `<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">County:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${county}</td></tr>` : ""}
${apn ? `<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">APN:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${apn}</td></tr>` : ""}
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">State:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${state}</td></tr>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">Property Type:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${propertyType}</td></tr>
${estimatedSurplus > 0 ? `<tr><td style="padding: 8px 0 5px; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top; border-top: 1px solid #e2e6eb;" width="110">Est. Surplus:</td><td style="padding: 8px 0 5px; font-size: 16px; color: #1a7a3a; font-weight: 700; font-family: 'Inter Tight', sans-serif; border-top: 1px solid #e2e6eb;">${formatCurrency(estimatedSurplus)}</td></tr>` : ""}
</tbody>
</table>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 24px 40px 0;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">To ensure the proceeds are directed to the correct recipient, we need to confirm your <strong style="color: #09274c;">current forwarding address</strong>. This allows us to coordinate distribution once the lending institution has been made whole and the remaining balance is ready for release.</p>
${deadlineInfo ? `<table style="background-color: ${deadlineInfo.urgency === "critical" ? "#fff5f5" : deadlineInfo.urgency === "high" ? "#fffbeb" : "#f0f9ff"}; border-radius: 6px; border-left: 4px solid ${deadlineInfo.urgency === "critical" ? "#D82221" : deadlineInfo.urgency === "high" ? "#d97706" : "#09274c"};" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 4px; font-size: 11px; color: ${deadlineInfo.urgency === "critical" ? "#D82221" : "#09274c"}; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">${deadlineInfo.urgency === "critical" ? "URGENT" : "IMPORTANT"} -- ${deadlineInfo.stateName} Statutory Deadline</p>
<p style="margin: 0 0 6px; font-size: 15px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight', sans-serif;">Under ${deadlineInfo.stateName} law, former property owners have <strong style="color: #09274c;">${deadlineInfo.claimYears} year${deadlineInfo.claimYears > 1 ? "s" : ""}</strong> from the date of the foreclosure sale to claim surplus funds. Your deadline is <strong style="color: ${deadlineInfo.urgency === "critical" ? "#D82221" : "#09274c"};">${deadlineInfo.deadlineDate}</strong>.</p>
<p style="margin: 0; font-size: 14px; color: ${deadlineInfo.urgency === "critical" ? "#D82221" : "#5a6d82"}; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${deadlineInfo.urgency === "critical" ? "URGENT -- " : ""}${deadlineInfo.daysRemaining} days remaining to initiate your claim</p>
</td></tr></tbody>
</table>
<div style="height: 18px;">&nbsp;</div>` : `<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Please be aware that your state has a statutory window for the former owner to initiate this process. We encourage you to respond at your earliest convenience so we can preserve your position within the applicable timeframe.</p>`}
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;">
<table style="background-color: #f7f9fb; border-radius: 6px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 14px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">How to Respond</p>
<table style="margin-bottom: 12px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9742;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">By Phone</strong><br /><span style="color: #2c3e50;">Call Allie Pearson directly at </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="tel:+18885458007">(888) 545-8007</a></p></td>
</tr></tbody>
</table>
<table style="margin-bottom: 12px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9993;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">By Email</strong><br /><span style="color: #2c3e50;">Reply to this email or write to </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="mailto:claim@usforeclosurerecovery.com">claim@usforeclosurerecovery.com</a></p></td>
</tr></tbody>
</table>
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9635;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">Online</strong><br /><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="https://www.usforeclosurerecovery.com/claim-foreclosure-surplus-funds">usforeclosurerecovery.com</a></p></td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 12px;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">If this message has reached a family member or someone at this address, we kindly ask that you pass this information along to ${firstName} ${lastName} as soon as possible.</p>
<p style="margin: 0 0 24px; font-size: 15px; color: #2c3e50; line-height: 26px;">We appreciate your prompt attention to this matter.</p>
<table style="border-top: 1px solid #e2e6eb; padding-top: 20px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 20px;">
<p style="margin: 0 0 2px; font-size: 15px; color: #09274c; font-weight: bold; font-family: 'Inter Tight', sans-serif;">Corey Pearson</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;">Director, Foreclosure Recovery Inc.</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;">On behalf of <strong>Allie Pearson</strong> your Asset Recovery Agent</p>
<p style="margin: 8px 0 0; font-size: 13px; font-family: 'Inter Tight', sans-serif;"><a style="color: #09274c; text-decoration: none;" href="tel:+18885458007">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color: #09274c; text-decoration: none;" href="mailto:claim@usforeclosurerecovery.com">claim@usforeclosurerecovery.com</a></p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px 0;"><div style="border-top: 2px solid #D82221; width: 60px;">&nbsp;</div></td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 30px;">
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight', sans-serif;">Foreclosure Recovery Inc. &middot; 30 N Gould St, Ste R &middot; Sheridan, WY 82801</p>
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight', sans-serif;">This correspondence pertains to the property and individual(s) named above. Recovery of foreclosure surplus proceeds is subject to individual case evaluation and applicable state statutes. Foreclosure Recovery Inc. is not a law firm and does not provide legal counsel. Estimated timelines may vary based on state regulations and third-party response times.</p>
<p style="margin: 0; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight', sans-serif;">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="https://usforeclosurerecovery.com/privacy-policy">Privacy Policy</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="#">Unsubscribe</a></p>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</div>
</center>
</body>
</html>`

  return { subject, html }
}

function imapAppendDraft(emailContent: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: "IMAP connection timed out" })
    }, 15000)

    let buffer = ""
    let state = "connecting"
    let tagCounter = 1
    let resolved = false

    const done = (result: { success: boolean; error?: string }) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      try { socket.destroy() } catch (_e) { /* ignore */ }
      resolve(result)
    }

    const socket = tls.connect(
      { host: IMAP_HOST, port: IMAP_PORT, rejectUnauthorized: false },
      () => { /* connected */ }
    )

    socket.setEncoding("utf8")

    socket.on("data", (data: string) => {
      buffer += data
      const lines = buffer.split("\r\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (state === "connecting" && line.startsWith("* OK")) {
          state = "login"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGIN ${IMAP_USER} ${IMAP_PASS}\r\n`)
        } else if (state === "login" && /^A\d+ OK/.test(line)) {
          state = "append"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "login" && /^A\d+ (NO|BAD)/.test(line)) {
          done({ success: false, error: "IMAP login failed: " + line })
        } else if (state === "append" && line.startsWith("+")) {
          state = "appending"
          socket.write(emailContent + "\r\n")
        } else if (state === "append" && /^A\d+ NO/.test(line)) {
          // "Drafts" doesn't exist, try "INBOX.Drafts"
          state = "append2"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "INBOX.Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "appending" && /^A\d+ OK/.test(line)) {
          state = "logout"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGOUT\r\n`)
        } else if (state === "appending" && /^A\d+ NO/.test(line)) {
          // Shouldn't happen after successful + continuation, but try INBOX.Drafts
          state = "append2"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "INBOX.Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "append2" && line.startsWith("+")) {
          state = "appending2"
          socket.write(emailContent + "\r\n")
        } else if (state === "appending2" && /^A\d+ OK/.test(line)) {
          state = "logout"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGOUT\r\n`)
        } else if (state === "appending2" && /^A\d+ NO/.test(line)) {
          done({ success: false, error: "Could not append to Drafts: " + line })
        } else if (state === "logout") {
          done({ success: true })
        } else if (/^A\d+ (NO|BAD)/.test(line) && state !== "appending" && state !== "appending2") {
          done({ success: false, error: "IMAP error: " + line })
        }
      }
    })

    socket.on("error", (err: Error) => {
      done({ success: false, error: err.message })
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress
    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { leadId, action } = body

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const recipientEmail = lead.primary_email
    if (!recipientEmail) {
      return NextResponse.json({ error: "Lead has no email address" }, { status: 400 })
    }

    const leadData: Record<string, string> = {
      owner_name: String(lead.owner_name || ""),
      first_name: String(lead.owner_name || "").split(" ")[0] || "",
      last_name: String(lead.owner_name || "").split(" ").slice(1).join(" ") || "",
      property_address: String(lead.property_address || ""),
      mailing_address: String(lead.mailing_address || ""),
      city: String(lead.city || ""),
      state: String(lead.state || lead.state_abbr || ""),
      county: String(lead.county || ""),
      apn_number: String(lead.apn_number || ""),
      parcel_id: String(lead.parcel_id || ""),
      case_number: String(lead.case_number || ""),
      property_type: String(lead.property_type || "Residential"),
      primary_email: recipientEmail,
      overage_amount: String(lead.overage_amount || "0"),
      estimated_surplus: String(lead.estimated_surplus || "0"),
      sale_date: String(lead.sale_date || ""),
    }

    const { subject, html } = populateTemplate(leadData)

    // Preview mode: return populated HTML
    if (action === "preview") {
      return NextResponse.json({
        success: true,
        subject,
        html,
        to: recipientEmail,
        from: SENDER_EMAIL,
      })
    }

    // Create draft mode: IMAP APPEND directly to Hostinger Drafts folder
    if (action === "create_draft") {
      const boundary = "boundary_" + Date.now()
      const date = new Date().toUTCString()
      const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@usforeclosurerecovery.com>`

      const emailRaw = [
        `From: ${SENDER_NAME} <${SENDER_EMAIL}>`,
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        `Date: ${date}`,
        `Message-ID: ${messageId}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        `X-Lead-ID: ${leadId}`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: quoted-printable",
        "",
        "Please view this email in an HTML-capable email client.",
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: quoted-printable",
        "",
        html,
        "",
        `--${boundary}--`,
        "",
      ].join("\r\n")

      const imapResult = await imapAppendDraft(emailRaw)

      if (!imapResult.success) {
        return NextResponse.json({ error: `Draft creation failed: ${imapResult.error}` }, { status: 500 })
      }

      // Update lead record
      await supabaseAdmin
        .from("foreclosure_leads")
        .update({
          email_draft_created: true,
          email_draft_created_at: new Date().toISOString(),
        })
        .eq("id", leadId)

      return NextResponse.json({
        success: true,
        message: `Draft created in ${SENDER_EMAIL}`,
        to: recipientEmail,
        subject,
      })
    }

    return NextResponse.json({ error: "Invalid action. Use 'preview' or 'create_draft'" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
