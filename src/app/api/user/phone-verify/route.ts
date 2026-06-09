import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"
import crypto from "crypto"

export const dynamic = "force-dynamic"

const TEXTBEE_KEY = process.env.TEXTBEE_API_KEY
const TEXTBEE_DEVICE = process.env.TEXTBEE_DEVICE_ID
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

// Supports US/Canada (+1) and UK (+44). Country is the ISO code from the form.
function toE164(p: string, country?: string): string {
  const raw = (p || "").trim()
  if (raw.startsWith("+")) return "+" + raw.replace(/\D/g, "")
  const d = raw.replace(/\D/g, "")
  if (country === "GB") return "+44" + d.replace(/^0+/, "")
  // Default US/Canada (NANP, +1)
  if (d.length === 11 && d[0] === "1") return "+" + d
  if (d.length === 10) return "+1" + d
  return d ? "+" + d : ""
}

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

async function sendSms(phone: string, message: string): Promise<boolean> {
  const to = toE164(phone)
  if (!TEXTBEE_KEY || !TEXTBEE_DEVICE || !to) return false
  try {
    const res = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE}/send-sms`, {
      method: "POST",
      headers: { "x-api-key": TEXTBEE_KEY, "User-Agent": UA, "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: [to], message }),
    })
    return res.ok
  } catch {
    return false
  }
}

const WELCOME_SMS =
  "Welcome to the team! We're here for you 7 days a week, 9-5 Pacific. Any questions, always ask -- just reply to this text. We're not successful unless you are. Call (888) 545-8007 or email support@usforeclosureleads.com. -Corey Pearson. Reply STOP to opt out."

export async function POST(req: NextRequest) {
  const body = await req.json()
  const action = String(body?.action || "")
  const { email, error } = await targetEmail(req, body?.asPinId || null)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })

  const phone = String(body?.phone || "").trim()
  const digits = phone.replace(/\D/g, "")

  const country = String(body?.country || "US")
  const e164 = toE164(phone, country)

  if (action === "send") {
    if (digits.length < 10 || e164.replace(/\D/g, "").length < 11) {
      return NextResponse.json({ error: "Enter a valid phone number for the selected country." }, { status: 400 })
    }
    if (body?.consent !== true) return NextResponse.json({ error: "Please agree to the communications consent." }, { status: 400 })

    const code = String(crypto.randomInt(100000, 1000000))
    const expires = new Date(Date.now() + 10 * 60_000).toISOString()
    // Store the E.164 form so the drip engine + later sends use the correct country code.
    const { error: upErr } = await supabaseAdmin
      .from("phone_verifications")
      .upsert({ email, phone: e164, code, attempts: 0, expires_at: expires, created_at: new Date().toISOString() }, { onConflict: "email" })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const ok = await sendSms(e164, `Your Foreclosure Recovery verification code is ${code}. It expires in 10 minutes.`)
    if (!ok) return NextResponse.json({ error: "Couldn't send the code. Check the number and try again." }, { status: 502 })
    return NextResponse.json({ sent: true })
  }

  if (action === "confirm") {
    const code = String(body?.code || "").trim()
    const { data: row } = await supabaseAdmin.from("phone_verifications").select("*").eq("email", email as string).maybeSingle()
    if (!row) return NextResponse.json({ error: "Request a new code." }, { status: 400 })
    if (new Date(row.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Code expired — request a new one." }, { status: 400 })
    if (row.attempts >= 5) return NextResponse.json({ error: "Too many attempts — request a new code." }, { status: 429 })
    if (row.code !== code) {
      await supabaseAdmin.from("phone_verifications").update({ attempts: row.attempts + 1 }).eq("email", email as string)
      return NextResponse.json({ error: "Incorrect code." }, { status: 400 })
    }

    // Verified — save the phone, mark verified, enroll the drip + welcome.
    await supabaseAdmin
      .from("users")
      .update({ profile_phone: row.phone, sms_consent: true, sms_consent_at: new Date().toISOString(), phone_verified: true })
      .ilike("email", email as string)
    await supabaseAdmin.from("phone_verifications").delete().eq("email", email as string)

    // Enroll in the SMS drip (idempotent) + fire welcome only on first verification.
    try {
      const { data: existing } = await supabaseAdmin.from("sms_drips").select("id").eq("phone", row.phone).maybeSingle()
      if (!existing) {
        await supabaseAdmin.from("sms_drips").insert({
          phone: row.phone, email, step: 1, active: true, opted_out: false,
          next_send_at: new Date(Date.now() + 24 * 3600_000).toISOString(), last_sent_at: new Date().toISOString(),
        })
        await sendSms(row.phone, WELCOME_SMS)
      }
    } catch { /* non-fatal */ }

    await notifyAccountActivity(email as string, "Verified phone number", row.phone)
    return NextResponse.json({ verified: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
