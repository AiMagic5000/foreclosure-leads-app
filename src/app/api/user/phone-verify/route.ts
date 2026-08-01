import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"
import { resolveCallerEmails } from "@/lib/caller-identity"

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
  const callerEmails = resolveCallerEmails(user)
  const email = callerEmails[0]
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

// Put the number the agent just saved onto their PBX extension record, so the phone tree
// can forward their extension to them. Previously nothing carried it across, which is why
// 13 active agents had an extension that could not ring.
async function syncExtensionForwarding(email: string, e164: string): Promise<void> {
  const { data: pin } = await supabaseAdmin
    .from("user_pins")
    .select("extension, display_name, full_name, email, sender_email")
    .ilike("email", email)
    .eq("is_active", true)
    .maybeSingle()
  const ext = String(pin?.extension || "").replace(/[^0-9]/g, "")
  if (!ext) return

  const BUCKET = "pbx-config", FILE = "extensions.json"
  const { data: blob } = await supabaseAdmin.storage.from(BUCKET).download(FILE)
  if (!blob) return
  const table = JSON.parse(await blob.text()) as Record<string, Record<string, unknown>>
  const prev = table[ext] || {}
  table[ext] = {
    ...prev,
    forwarding_phone: e164,
    agent_name: pin?.display_name || pin?.full_name || prev.agent_name || "",
    agent_email: pin?.sender_email || prev.agent_email || pin?.email || email,
    active: true,
  }
  await supabaseAdmin.storage.from(BUCKET).upload(
    FILE,
    new Blob([JSON.stringify(table, null, 2)], { type: "application/json" }),
    { upsert: true },
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const action = String(body?.action || "")
  const { email, error } = await targetEmail(req, body?.asPinId || null)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })

  const phone = String(body?.phone || "").trim()
  const digits = phone.replace(/\D/g, "")

  const country = String(body?.country || "US")
  const e164 = toE164(phone, country)

  // SAVE the number. No SMS code (owner decision 2026-07-29).
  //
  // We only need this number so the PBX can forward the agent's extension to them. It was
  // never an identity check, but it was gated behind a 6-digit SMS code — and that code
  // routinely never arrived (carrier filtering of a shared consumer gateway to some
  // numbers). Agents then sat unable to finish setup, and because the old build also gated
  // training on phone_verified, the failed text could cost them their videos too. Two paid
  // agents hit that wall in one week and both needed manual database surgery.
  //
  // So: they type it, we save it, done. Paid access never depends on it.
  if (action === "send" || action === "save") {
    if (digits.length < 10 || e164.replace(/\D/g, "").length < 11) {
      return NextResponse.json({ error: "Enter a valid phone number for the selected country." }, { status: 400 })
    }
    if (body?.consent !== true) return NextResponse.json({ error: "Please agree to the communications consent." }, { status: 400 })

    // UPDATE then INSERT if it matched nothing. A plain .update() on a missing users row
    // affects zero rows and still returns no error, so the agent saw "saved" while nothing
    // was stored — two active paid agents (ext 3 and ext 25) had a pin but no users row and
    // could never self-serve a number. Reported success must mean stored.
    const patch = {
      profile_phone: e164,
      sms_consent: true,
      sms_consent_at: new Date().toISOString(),
      phone_verified: true,
    }
    const { data: updated, error: upErr } = await supabaseAdmin
      .from("users")
      .update(patch)
      .ilike("email", email as string)
      .select("email")
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    if (!updated || updated.length === 0) {
      const { error: insErr } = await supabaseAdmin
        .from("users")
        .insert({ email: (email as string).toLowerCase(), ...patch })
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    // Any half-finished code request from the old flow is now meaningless — clear it so a
    // stale row can never make the number look unconfirmed again.
    await supabaseAdmin.from("phone_verifications").delete().ilike("email", email as string)

    // Push it straight to the PBX so their extension can actually ring them. Best effort:
    // a storage hiccup must not fail the save, and the sync job reconciles either way.
    try {
      await syncExtensionForwarding(email as string, e164)
    } catch (e) {
      console.error("[phone-verify] extension forwarding sync failed:", e instanceof Error ? e.message : String(e))
    }

    return NextResponse.json({ sent: true, saved: true, verified: true, phone: e164 })
  }

  // Kept only so a browser tab left open on the old two-step screen still succeeds instead
  // of erroring. The code itself is no longer checked — the number was already saved and
  // marked verified when they pressed save.
  if (action === "confirm") {
    const { data: row } = await supabaseAdmin.from("phone_verifications").select("*").eq("email", email as string).maybeSingle()
    if (!row) {
      const { data: u } = await supabaseAdmin.from("users").select("profile_phone").ilike("email", email as string).maybeSingle()
      return NextResponse.json({ verified: true, phone: u?.profile_phone || null })
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

    await notifyAccountActivity(email as string, "Verified phone number", row.phone, undefined, (await currentUser())?.emailAddresses?.[0]?.emailAddress)
    return NextResponse.json({ verified: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
