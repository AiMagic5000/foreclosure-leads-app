import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"
import { buildMergeContext } from "@/lib/surplus/merge-context"
import { getStateRule } from "@/lib/surplus/state-rules"
import { generateFilledAgreementEN, agreementFilename } from "@/lib/agreement-docx"

// Agent first-touch claimant email — sends via Resend from a rotating, warm-up-capped
// sending domain. Replaces the old "log into webmail to send" flow (webmail sending is
// blocked). The agent edits the branded draft in the My Leads preview and hits Send;
// this route runs deliverability guardrails, picks an under-cap domain, and sends.

export const maxDuration = 30

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn"
const MV_API_KEY = process.env.MILLIONVERIFIER_API_KEY || "OmAwrEQRicATEtyqyyGyWkig5"

// A browser UA is REQUIRED — MillionVerifier is behind Cloudflare and 403s (error 1010)
// the default urllib/node UA.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// From-address pool per sending domain — spreads the sending fingerprint across
// several mailboxes instead of one blasting address (no mailbox provisioning
// needed; Resend sends from any address on a verified domain). Rotated per send.
const SENDING_LOCALPARTS = ["outreach", "contact", "support", "claims", "info"]

// Warm-up ramp: max sends/day for a domain by age (days since warmup_start).
function dailyCapForAge(days: number): number {
  if (days <= 2) return 25
  if (days <= 6) return 50
  if (days <= 13) return 100
  if (days <= 20) return 200
  return 400
}

interface SendingDomain {
  domain: string
  active: boolean
  warmup_start: string | null
  priority: number | null
  paused_reason: string | null
}

// Start-of-day (UTC) ISO for "sent today" counting.
function startOfUtcDayISO(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await currentUser()
    const userEmail = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress)
    if (!userEmail || userEmail === "unknown") {
      return NextResponse.json({ error: "Could not resolve your account." }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const leadId = String(body?.leadId || "").trim()
    const toEmailRaw = String(body?.toEmail || "").trim()
    const toEmail = toEmailRaw.toLowerCase()
    const subject = String(body?.subject || "").trim()
    const html = String(body?.html || "")

    // --- Input validation ---
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 })
    }
    if (!toEmail || !EMAIL_RE.test(toEmail)) {
      return NextResponse.json({ error: "A valid recipient email is required." }, { status: 400 })
    }
    if (!subject) {
      return NextResponse.json({ error: "A subject line is required." }, { status: 400 })
    }
    if (!html || html.length < 40) {
      return NextResponse.json({ error: "The email body is empty." }, { status: 400 })
    }

    // --- Resolve the agent's sending identity from their pin ---
    const { data: pin } = await supabaseAdmin
      .from("user_pins")
      .select("id, sender_email, display_name, email")
      .ilike("email", userEmail)
      .eq("is_active", true)
      .maybeSingle()

    const agentPinId = (pin as { id?: string } | null)?.id || null
    const senderBusinessEmail = (pin as { sender_email?: string } | null)?.sender_email || null
    const displayName =
      (pin as { display_name?: string } | null)?.display_name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "Foreclosure Recovery"
    const replyTo = senderBusinessEmail || (pin as { email?: string } | null)?.email || userEmail

    // --- Guardrail: suppression list (bounced/complained) ---
    {
      const { data: sup } = await supabaseAdmin
        .from("email_suppression")
        .select("email")
        .eq("email", toEmail)
        .maybeSingle()
      if (sup) {
        return NextResponse.json(
          {
            error: "suppressed",
            message: "That address previously bounced and is suppressed. Reach this homeowner by phone or voicemail instead.",
          },
          { status: 409 }
        )
      }
    }

    // --- Guardrail: lead exists + not flagged as a dead email ---
    // Full row: the contingency agreement is regenerated here so the claimant gets
    // the attachment on the send path too, not just in the staged draft.
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single()
    if (leadErr || !lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 })
    }
    if (lead.bad_email === true) {
      return NextResponse.json(
        {
          error: "bad_email",
          message: "This lead's email is flagged as undeliverable. Reach this homeowner by phone or voicemail instead.",
        },
        { status: 409 }
      )
    }

    // --- Guardrail: real-time MillionVerifier check (browser UA required) ---
    try {
      const mvUrl = `https://api.millionverifier.com/api/v3/?api=${MV_API_KEY}&email=${encodeURIComponent(
        toEmail
      )}&timeout=12`
      const mvRes = await fetch(mvUrl, { headers: { "User-Agent": BROWSER_UA } })
      if (mvRes.ok) {
        const mv = (await mvRes.json()) as { result?: string }
        const result = String(mv?.result || "").toLowerCase()
        if (result === "invalid" || result === "disposable") {
          // Flag the lead + suppress so nobody hits it again.
          await supabaseAdmin.from("foreclosure_leads").update({ bad_email: true }).eq("id", leadId)
          await supabaseAdmin
            .from("email_suppression")
            .upsert({ email: toEmail, reason: "mv_invalid", source: "presend" }, { onConflict: "email" })
          return NextResponse.json(
            {
              error: "invalid_email",
              message:
                "That email address failed verification (undeliverable). It's been flagged so you don't hit it again — reach this homeowner by phone or voicemail.",
            },
            { status: 409 }
          )
        }
        // ok / catch_all / unknown -> proceed
      }
      // MV unreachable / non-200 -> fail open (don't block a legit send on a MV hiccup).
    } catch {
      // Verification service hiccup — fail open.
    }

    // --- Pick a sending domain (rotation + warm-up cap) ---
    const { data: domains } = await supabaseAdmin
      .from("sending_domains")
      .select("domain, active, warmup_start, priority, paused_reason")
      .eq("active", true)
      .order("priority", { ascending: true })

    const activeDomains = (domains || []) as SendingDomain[]
    if (activeDomains.length === 0) {
      return NextResponse.json(
        { error: "no_domain", message: "No sending domain is available right now. Use the call or voicemail buttons today." },
        { status: 503 }
      )
    }

    const dayStart = startOfUtcDayISO()
    const now = Date.now()

    // For each domain: today's cap + today's send count. Choose the under-cap domain
    // with the FEWEST sends today (spreads load evenly across the warm-up pool).
    let chosenDomain: string | null = null
    let chosenRemaining = 0
    let fewest = Number.POSITIVE_INFINITY

    for (const d of activeDomains) {
      const start = d.warmup_start ? new Date(d.warmup_start).getTime() : now
      const ageDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
      const cap = dailyCapForAge(ageDays)

      const { count } = await supabaseAdmin
        .from("email_send_log")
        .select("id", { count: "exact", head: true })
        .eq("sending_domain", d.domain)
        .gte("sent_at", dayStart)
      const sentToday = count || 0

      if (sentToday < cap && sentToday < fewest) {
        fewest = sentToday
        chosenDomain = d.domain
        chosenRemaining = cap - sentToday - 1
      }
    }

    if (!chosenDomain) {
      return NextResponse.json(
        {
          error: "daily_cap",
          message:
            "Today's email sending limit is reached while our new domains warm up. Use the call or voicemail buttons today — email opens back up tomorrow.",
        },
        { status: 429 }
      )
    }

    // --- Send via Resend ---
    // Rotate the from-address across the pool (by that domain's send count today)
    // so no single mailbox carries all the volume.
    const localPart = SENDING_LOCALPARTS[fewest % SENDING_LOCALPARTS.length]
    const fromHeader = `${displayName} · Foreclosure Recovery <${localPart}@${chosenDomain}>`
    // Attach the filled contingency agreement. Same generator the draft builder uses,
    // so the DOCX and the e-sign link always agree. Never block the send on it — a
    // template problem must not stop the claimant hearing from their agent.
    let attachments: { filename: string; content: string }[] | undefined
    try {
      const rule = await getStateRule(String(lead.state || lead.state_abbr || ""))
      const mergeCtx = buildMergeContext(lead as Parameters<typeof buildMergeContext>[0], rule)
      const buf = generateFilledAgreementEN(mergeCtx)
      attachments = [{
        filename: agreementFilename(mergeCtx.claimantName),
        content: buf.toString("base64"),
      }]
    } catch (e) {
      console.error("[email-send] agreement attach skipped:", e instanceof Error ? e.message : "unknown")
    }

    let resendId: string | null = null
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [toEmail],
          reply_to: replyTo,
          subject,
          html,
          ...(attachments ? { attachments } : {}),
        }),
      })
      const resendData = (await resendRes.json().catch(() => ({}))) as { id?: string; message?: string }
      if (!resendRes.ok) {
        console.error("[email-send] Resend error", resendRes.status)
        return NextResponse.json({ error: "send_failed", message: "Send failed, please try again." }, { status: 502 })
      }
      resendId = resendData?.id || null
    } catch (e) {
      console.error("[email-send] Resend request threw", e instanceof Error ? e.message : "unknown")
      return NextResponse.json({ error: "send_failed", message: "Send failed, please try again." }, { status: 502 })
    }

    // --- Log the send + advance the lead ---
    try {
      await supabaseAdmin.from("email_send_log").insert({
        sending_domain: chosenDomain,
        agent_pin_id: agentPinId,
        lead_id: leadId,
        to_email: toEmail,
        resend_id: resendId,
      })
    } catch (e) {
      // Send already went out — a log failure must not error the agent.
      console.error("[email-send] send log insert failed", e instanceof Error ? e.message : "unknown")
    }

    try {
      await supabaseAdmin
        .from("foreclosure_leads")
        .update({ email_draft_created: true, email_draft_created_at: new Date().toISOString() })
        .eq("id", leadId)
      await supabaseAdmin
        .from("foreclosure_leads")
        .update({ status: "contacted" })
        .eq("id", leadId)
        .in("status", ["new", "skip_traced"])
    } catch (e) {
      console.error("[email-send] lead status update failed", e instanceof Error ? e.message : "unknown")
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${toEmail}.`,
      domain: chosenDomain,
      remainingToday: Math.max(0, chosenRemaining),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[email-send] fatal", message)
    return NextResponse.json({ error: "server_error", message: "Something went wrong. Please try again." }, { status: 500 })
  }
}
