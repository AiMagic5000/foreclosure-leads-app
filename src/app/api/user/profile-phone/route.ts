import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"

export const dynamic = "force-dynamic"

// Resolve the target email — the caller's own, or (admin only) an impersonated user's.
async function targetEmail(req: NextRequest, asPinIdFromBody?: string | null): Promise<{ email: string | null; error?: string }> {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return { email: null, error: "Unauthorized" }
  const asPinId = asPinIdFromBody ?? req.nextUrl.searchParams.get("asPinId")
  if (asPinId) {
    const target = await resolveImpersonationTarget(asPinId)
    if (!target) return { email: null, error: "Not authorized" }
    return { email: target.email }
  }
  return { email }
}

function digits(s: string) {
  return (s || "").replace(/[^\d]/g, "")
}

// GET — does this account have a phone on file? Returns the masked phone + consent.
export async function GET(req: NextRequest) {
  const { email, error } = await targetEmail(req)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  // Use limit(1) (not single()) — some accounts have duplicate users rows and single() errors on >1.
  const { data: rows } = await supabaseAdmin
    .from("users")
    .select("profile_phone, sms_consent, phone_verified")
    .ilike("email", email as string)
    .order("profile_phone", { ascending: false, nullsFirst: false })
    .limit(1)
  const data = rows?.[0]
  const phone = data?.profile_phone || ""
  return NextResponse.json({
    // hasPhone now means VERIFIED — an unverified number does not unlock content.
    hasPhone: !!data?.phone_verified,
    verified: !!data?.phone_verified,
    phone,
    smsConsent: !!data?.sms_consent,
  })
}

// POST — save the account's phone number + SMS consent.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, error } = await targetEmail(req, body?.asPinId || null)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })

  const phone = String(body?.phone || "").trim()
  const consent = body?.consent === true
  const d = digits(phone)
  if (d.length < 10) return NextResponse.json({ error: "Enter a valid phone number (at least 10 digits)." }, { status: 400 })
  if (!consent) return NextResponse.json({ error: "Please agree to the communications consent to continue." }, { status: 400 })

  // Admin setting a number while impersonating is trusted (no OTP). Self-saves go through
  // the OTP flow (/api/user/phone-verify) and never hit this path from the UI.
  const adminOverride = !!body?.asPinId
  const { error: upErr } = await supabaseAdmin
    .from("users")
    .update({ profile_phone: phone, sms_consent: true, sms_consent_at: new Date().toISOString(), phone_verified: adminOverride })
    .ilike("email", email as string)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  // Enroll the number in the SMS drip + fire the welcome text immediately (idempotent by phone).
  await enrollDrip(phone, email as string)
  await notifyAccountActivity(email as string, "Added phone number", phone)

  return NextResponse.json({ success: true, hasPhone: true, phone })
}

const WELCOME_SMS =
  "Welcome to the team! We're here for you 7 days a week, 9-5 Pacific. Any questions, always ask -- just reply to this text. We're not successful unless you are. Call (888) 545-8007 or email support@usforeclosureleads.com. -Corey Pearson. Reply STOP to opt out."

// TextBee needs E.164 — bare 10-digit US numbers don't deliver.
function toE164(p: string): string {
  const d = (p || "").replace(/\D/g, "")
  if (d.length === 10) return "+1" + d
  if (d.length === 11 && d[0] === "1") return "+" + d
  return d ? "+" + d : ""
}

async function sendTextbee(phone: string, message: string) {
  const apiKey = process.env.TEXTBEE_API_KEY
  const deviceId = process.env.TEXTBEE_DEVICE_ID
  const to = toE164(phone)
  if (!apiKey || !deviceId || !to) return
  try {
    await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        // api.textbee.dev is behind Cloudflare — a browser UA is required or it returns 1010.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipients: [to], message }),
    })
  } catch {
    // best-effort; the R740xd drip engine retries the sequence
  }
}

async function enrollDrip(phone: string, email: string) {
  try {
    const { data: existing } = await supabaseAdmin.from("sms_drips").select("id, opted_out").eq("phone", phone).maybeSingle()
    if (existing) {
      // Already enrolled — keep their opt-out state, just refresh the email link.
      await supabaseAdmin.from("sms_drips").update({ email, updated_at: new Date().toISOString() }).eq("id", existing.id)
      return
    }
    const next = new Date(Date.now() + 24 * 3600_000).toISOString() // step 2 in ~1 day
    await supabaseAdmin.from("sms_drips").insert({
      phone, email, step: 1, active: true, opted_out: false,
      next_send_at: next, last_sent_at: new Date().toISOString(),
    })
    await sendTextbee(phone, WELCOME_SMS)
  } catch {
    // non-fatal — the R740xd drip engine will pick it up
  }
}
