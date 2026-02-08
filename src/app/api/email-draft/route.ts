import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const N8N_WEBHOOK_URL = process.env.N8N_EMAIL_DRAFT_WEBHOOK || ""
const SENDER_EMAIL = "claim@usforeclosurerecovery.com"
const SENDER_NAME = "Foreclosure Recovery Inc."

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function populateTemplate(lead: Record<string, string>): {
  subject: string
  html: string
} {
  const firstName = lead.first_name || lead.owner_name?.split(" ")[0] || "Homeowner"
  const lastName = lead.last_name || lead.owner_name?.split(" ").slice(1).join(" ") || ""
  const propertyAddress = lead.property_address || "your property"
  const city = lead.city || ""
  const state = lead.state || ""
  const fullAddress = city && state ? `${propertyAddress}, ${city}, ${state}` : propertyAddress
  const county = lead.county || ""
  const apn = lead.parcel_id || lead.apn_number || ""
  const propertyType = lead.property_type || "Residential"
  const caseNumber = lead.case_number || ""
  const recipientEmail = lead.primary_email || ""

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
<p style="margin: 0; font-size: 12px; color: #7a8a9e; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 18px;">${formatDate()}<br /><span style="color: #09274c; font-weight: 600;">Ref: <span style="color: #0a0a0a; font-size: 14px; font-weight: 500;">${caseNumber}</span></span></p>
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
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">I recently left a voicemail regarding this matter and wanted to follow up in writing. My name is Corey Pearson, and I am reaching out from Foreclosure Recovery Inc. on behalf of Allie Pearson, your assigned recovery agent.</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">We are writing to inform you that the property referenced below has been identified as having excess equity proceeds associated with the foreclosure sale. After the lending institution has been satisfied from the auction, the remaining balance is to be distributed to the former owner of record.</p>
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
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">County:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${county}</td></tr>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">APN:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${apn}</td></tr>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">State:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${state}</td></tr>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">Property Type:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${propertyType}</td></tr>
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
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Please be aware that your state has a statutory window for the former owner to initiate this process. We encourage you to respond at your earliest convenience so we can preserve your position within the applicable timeframe.</p>
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
<p style="margin: 0; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight', sans-serif;">&copy; 2025 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="https://usforeclosurerecovery.com/privacy-policy">Privacy Policy</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="#">Unsubscribe</a></p>
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
      city: String(lead.city || ""),
      state: String(lead.state || ""),
      county: String(lead.county || ""),
      parcel_id: String(lead.parcel_id || lead.apn_number || ""),
      case_number: String(lead.case_number || ""),
      property_type: String(lead.property_type || "Residential"),
      primary_email: recipientEmail,
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

    // Create draft mode: send to n8n webhook for IMAP draft creation
    if (action === "create_draft") {
      if (!N8N_WEBHOOK_URL) {
        return NextResponse.json({ error: "Email draft webhook not configured" }, { status: 500 })
      }

      const webhookRes = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
          subject,
          html,
          leadId,
          ownerName: leadData.owner_name,
        }),
      })

      if (!webhookRes.ok) {
        const errText = await webhookRes.text()
        return NextResponse.json({ error: `Draft creation failed: ${errText}` }, { status: 500 })
      }

      const result = await webhookRes.json()

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
        ...result,
      })
    }

    return NextResponse.json({ error: "Invalid action. Use 'preview' or 'create_draft'" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
