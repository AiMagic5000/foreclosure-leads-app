import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendAdminNotification, sendEmail } from "@/lib/email"
import { canonicalEmail } from "@/lib/email-alias"
import { BRAND_HEADER, BRAND_FOOTER } from "@/lib/email-brand"

const UNIT_PRICE = 2.5
const SUPPORT_PHONE = "(888) 907-3234"

function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Invoice emailed to the agent when they buy leads past the 125/week cap.
// Wrapped in the canonical brand header + FULL footer from email-brand.
function buildAgentInvoiceHtml(
  firstName: string,
  invoiceNo: string,
  qty: number,
  total: number
): string {
  const body = `<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #ffffff; padding: 30px 40px 10px; font-size: 15.5px; color: #2f3b4a; line-height: 1.7; font-family: Arial,Helvetica,sans-serif;">
<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 18px">Thanks for grabbing more leads. Here's your invoice.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14.5px;margin:0 0 18px">
<tbody>
<tr><td style="padding:9px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;width:180px">Invoice #</td><td style="padding:9px 12px;border:1px solid #e2e8f0">${invoiceNo}</td></tr>
<tr><td style="padding:9px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Extra leads</td><td style="padding:9px 12px;border:1px solid #e2e8f0">${qty}</td></tr>
<tr><td style="padding:9px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Price per lead</td><td style="padding:9px 12px;border:1px solid #e2e8f0">$${money(UNIT_PRICE)}</td></tr>
<tr><td style="padding:11px 12px;border:1px solid #e2e8f0;background:#09274c;color:#ffffff;font-weight:700">Total due</td><td style="padding:11px 12px;border:1px solid #e2e8f0;background:#09274c;color:#ffffff;font-weight:700;font-size:17px">$${money(total)}</td></tr>
</tbody></table>
<p style="margin:0 0 6px">We'll follow up with a secure payment link shortly. As soon as it's paid, your ${qty} extra leads are issued to your dashboard within 24 hours.</p>
<p style="margin:14px 0 18px">Questions? Call ${SUPPORT_PHONE} or reply to this email.</p>
</td></tr></tbody></table>`
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif">${BRAND_HEADER}${body}${BRAND_FOOTER}</body></html>`
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  const userEmail = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress) || "unknown"
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || ""

  const body = await request.json().catch(() => ({}))
  const quantity = Math.min(Math.max(1, Math.floor(Number(body?.quantity) || 0)), 500)
  if (quantity < 1) {
    return NextResponse.json({ error: "invalid_quantity" }, { status: 400 })
  }
  const total = Number((quantity * UNIT_PRICE).toFixed(2))
  const invoiceNo = `XL-${Date.now().toString(36).toUpperCase()}`

  // Best-effort operator pin lookup for the billing record.
  let operatorPinId: string | null = null
  try {
    const { data: pin } = await supabaseAdmin
      .from("user_pins")
      .select("id")
      .ilike("email", userEmail)
      .eq("is_active", true)
      .maybeSingle()
    operatorPinId = (pin as { id?: string } | null)?.id || null
  } catch { /* best-effort */ }

  try {
    await supabaseAdmin.from("extra_lead_purchases").insert({
      clerk_id: userId,
      operator_pin_id: operatorPinId,
      user_email: userEmail,
      user_name: userName,
      quantity,
      unit_price: UNIT_PRICE,
      total,
      invoice_number: invoiceNo,
      status: "invoiced",
    })
  } catch (e) {
    console.error("Extra-lead purchase persist failed (continuing to email):", e)
  }

  // Admin notification so the team can collect payment + issue the extra leads.
  await sendAdminNotification(
    `Extra Leads Purchase: ${quantity} @ $${money(UNIT_PRICE)} = $${money(total)} - ${userEmail}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
<div style="background:#059669;padding:20px 24px;color:#fff"><h2 style="margin:0;font-size:18px">Extra Leads Purchase</h2></div>
<div style="padding:24px;font-size:14px;color:#334155">
<p style="margin:0 0 12px">An agent bought leads past the weekly cap. Send a payment link, then issue the leads once paid.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;width:160px">Agent</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${userName || "N/A"} &lt;${userEmail}&gt;</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Invoice #</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${invoiceNo}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Quantity</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${quantity}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Total</td><td style="padding:8px 12px;border:1px solid #e2e8f0"><strong>$${money(total)}</strong></td></tr>
</table></div></div>`
  )

  // Invoice to the agent (best-effort, never blocks the response).
  if (userEmail.includes("@") && userEmail !== "unknown") {
    const firstName = (userName || "").trim().split(/\s+/)[0] || "there"
    sendEmail(
      userEmail,
      `Your invoice for ${quantity} extra leads - $${money(total)}`,
      buildAgentInvoiceHtml(firstName, invoiceNo, quantity, total)
    ).catch((e) => console.error("Agent invoice email failed:", e))
  }

  return NextResponse.json({
    success: true,
    invoiceNumber: invoiceNo,
    quantity,
    unitPrice: UNIT_PRICE,
    total,
    message: `Invoice for ${quantity} extra leads ($${money(total)}) is on its way to your email.`,
  })
}
