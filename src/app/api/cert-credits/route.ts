import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { FREE_LIMIT, PRICE_PER_LETTER_CENTS, certWeekStart, certWeekReset, freeUsedForPin } from "@/lib/surplus/cert-credits"
import { BRAND_HEADER, BRAND_FOOTER_COMPANY } from "@/lib/email-brand"
import nodemailer from "@/lib/nodemailer-relay-shim"

export const dynamic = "force-dynamic"

const ADMIN_EMAILS = new Set(["coreypearsonemail@gmail.com"])
const SMTP_HOST = "smtp.hostinger.com"
const SMTP_PORT = 465
const SMTP_USER = "support@usforeclosurerecovery.com"
const SMTP_PASS = process.env.IMAP_SUPPORT_PASSWORD || "Thepassword#1234"

type PinRow = { id: string; email: string | null; full_name: string | null }

async function pinByEmail(email: string): Promise<PinRow | null> {
  const { data } = await supabaseAdmin.from("user_pins").select("id, email, full_name").ilike("email", email).limit(1)
  return data?.[0] || null
}
async function pinById(id: string): Promise<PinRow | null> {
  const { data } = await supabaseAdmin.from("user_pins").select("id, email, full_name").eq("id", id).limit(1)
  return data?.[0] || null
}

// Resolve the agent the request is ABOUT. A regular agent can only see their own
// credits; an admin can pass ?pinId= (view-as) to see any agent's real numbers.
async function resolveTarget(callerEmail: string, paramPinId: string | null) {
  const callerIsAdmin = ADMIN_EMAILS.has(callerEmail)
  if (callerIsAdmin && paramPinId) {
    const p = await pinById(paramPinId)
    if (p) return { pin: p, email: (p.email || "").toLowerCase(), isAdmin: ADMIN_EMAILS.has((p.email || "").toLowerCase()) }
  }
  const p = await pinByEmail(callerEmail)
  return { pin: p, email: callerEmail, isAdmin: callerIsAdmin }
}

export async function GET(req: NextRequest) {
  const user = await currentUser()
  const callerEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  if (!callerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const paramPinId = new URL(req.url).searchParams.get("pinId")
  const { pin, isAdmin } = await resolveTarget(callerEmail, paramPinId)

  const used = isAdmin || !pin ? 0 : await freeUsedForPin(supabaseAdmin, pin.id, certWeekStart().toISOString())
  return NextResponse.json({
    freeLimit: FREE_LIMIT,
    freeUsed: used,
    freeRemaining: isAdmin ? 9999 : Math.max(0, FREE_LIMIT - used),
    pricePerLetter: PRICE_PER_LETTER_CENTS / 100,
    resetAt: certWeekReset().toISOString(),
    isAdmin,
    agentName: pin?.full_name || null,
  })
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  const callerEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  if (!callerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const qty = Math.floor(Number(body.qty))
  if (!qty || qty < 1 || qty > 500) {
    return NextResponse.json({ error: "Enter a quantity between 1 and 500." }, { status: 400 })
  }

  const { pin, email } = await resolveTarget(callerEmail, body.pinId ? String(body.pinId) : null)
  const billEmail = (pin?.email || email).toLowerCase()
  const agentName = pin?.full_name || billEmail

  const amountCents = qty * PRICE_PER_LETTER_CENTS
  const total = `$${(amountCents / 100).toFixed(2)}`

  const { error: insErr } = await supabaseAdmin.from("cert_credit_requests").insert({
    agent_email: billEmail, agent_pin_id: pin?.id ? String(pin.id) : null, qty, amount_cents: amountCents, status: "invoiced",
  })
  if (insErr) {
    return NextResponse.json({ error: "Could not record the request. Please try again." }, { status: 500 })
  }

  const invoiceBody = `
    <table style="max-width:600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:32px 40px;font-family:Arial,sans-serif;color:#33404f;font-size:15px;line-height:1.6;">
    <p style="margin:0 0 16px;">Hi ${agentName},</p>
    <p style="margin:0 0 16px;">Here is your invoice for the additional certified letters you requested. These are mailed in addition to your ${FREE_LIMIT} free weekly certified letters.</p>
    <table border="0" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:1px solid #e5e9ef;">
      <tbody>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eef0f4;">Certified letters requested</td><td style="padding:10px 14px;border-bottom:1px solid #eef0f4;text-align:right;font-weight:bold;">${qty}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eef0f4;">Price per letter (print + certified mailing)</td><td style="padding:10px 14px;border-bottom:1px solid #eef0f4;text-align:right;">$${(PRICE_PER_LETTER_CENTS/100).toFixed(2)}</td></tr>
      <tr><td style="padding:12px 14px;font-weight:bold;color:#09274c;">Total due</td><td style="padding:12px 14px;text-align:right;font-weight:bold;color:#09274c;font-size:18px;">${total}</td></tr>
      </tbody>
    </table>
    <p style="margin:0 0 16px;">Once payment clears, we print and mail these certified letters to the current claimant addresses on your leads. Reply to this email to pay by card, or call <a style="color:#09274c;" href="tel:+18885458007">(888) 545-8007</a>.</p>
    <p style="margin:24px 0 4px;">Thank you,</p>
    <p style="margin:0;font-weight:bold;color:#09274c;">The Team at Foreclosure Recovery Inc.</p>
    </td></tr></tbody></table>`
  const html = `<div style="background-color:#eef1f5;padding:24px 0;">${BRAND_HEADER}${invoiceBody}${BRAND_FOOTER_COMPANY}</div>`

  try {
    const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    await transporter.sendMail({
      from: `"Foreclosure Recovery Inc." <${SMTP_USER}>`,
      to: billEmail, cc: "coreypearsonemail@gmail.com",
      subject: `Invoice: ${qty} certified letter${qty > 1 ? "s" : ""} — ${total}`,
      html,
    })
  } catch { /* recorded even if relay hiccups */ }

  return NextResponse.json({ ok: true, qty, total, message: `Invoice for ${total} sent to ${billEmail}.` })
}
