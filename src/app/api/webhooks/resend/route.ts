import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// Resend bounce/complaint webhook. On a hard bounce or spam complaint we
// permanently suppress the address and flag every matching lead bad_email=true
// so no agent (and no automated send) ever touches it again. This is the ongoing
// backstop that prevents a repeat of the MXRoute block (2026-07-16): the fatal
// pattern was re-sending to dead addresses. Configure in Resend -> Webhooks with
// ?t=<secret>. events: email.bounced, email.complained.
const SECRET = process.env.RESEND_WEBHOOK_SECRET || "usfr-resend-3b9f1c"

const SUPPRESS_TYPES = new Set(["email.bounced", "email.complained"])

export async function POST(req: NextRequest) {
  if (new URL(req.url).searchParams.get("t") !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  let evt: { type?: string; data?: { to?: string[] | string; email?: string; bounce?: { type?: string } } }
  try {
    evt = await req.json()
  } catch {
    return NextResponse.json({ ok: true }) // ignore unparseable, never retry-loop
  }
  const type = evt?.type || ""
  if (!SUPPRESS_TYPES.has(type)) return NextResponse.json({ ok: true, ignored: type })

  const rawTo = evt?.data?.to
  const emails = (Array.isArray(rawTo) ? rawTo : rawTo ? [rawTo] : [])
    .concat(evt?.data?.email ? [evt.data.email] : [])
    .map((e) => String(e).toLowerCase().trim())
    .filter((e) => e.includes("@"))
  if (!emails.length) return NextResponse.json({ ok: true, noRecipient: true })

  const reason = type === "email.complained" ? "complaint" : `bounce:${evt?.data?.bounce?.type || "hard"}`

  try {
    await supabaseAdmin
      .from("email_suppression")
      .upsert(emails.map((email) => ({ email, reason, source: "resend_webhook" })), { onConflict: "email", ignoreDuplicates: true })
    // Flag matching leads on every email column we outreach from.
    for (const email of emails) {
      await supabaseAdmin.from("foreclosure_leads").update({ bad_email: true }).ilike("primary_email", email)
      await supabaseAdmin.from("foreclosure_leads").update({ bad_email: true }).ilike("secondary_email", email)
    }
  } catch (e) {
    console.error("resend webhook suppression failed:", e)
    // 200 anyway so Resend doesn't retry-storm; we can replay from the event log.
  }
  return NextResponse.json({ ok: true, suppressed: emails.length })
}
