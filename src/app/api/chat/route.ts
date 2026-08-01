import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import nodemailer from '@/lib/nodemailer-relay-shim'
import { HOMEOWNER_INTEL } from "@/lib/chatbot-intel"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const SMTP_HOST = process.env.SMTP_HOST || "smtp.hostinger.com"
const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
const SMTP_USER = process.env.SMTP_USER || "support@usforeclosurerecovery.com"
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_SUPPORT_PASSWORD || process.env.IMAP_SUPPORT_PASSWORD || "Thepassword#1234"

// Transcript recipient — support inbox only. The Hostinger forward
// (support@ -> xscore10) mirrors it to the owner, so a single copy lands there.
const TRANSCRIPT_TO = ["support@usforeclosureleads.com"]

const SYSTEM_PROMPT = `You are the assistant for Foreclosure Recovery Inc., an asset-recovery administration company that helps people claim surplus funds left over after a foreclosure sale.

Voice and rules:
- Always speak as "we" (the company), never "I".
- Say "state" rather than "county" when referring to where funds are held.
- Be warm, concise, and professional. Keep replies short (2-4 sentences).
- You are not a law firm and do not give legal advice.
- Help visitors understand surplus funds, how our recovery process works (no upfront cost, contingency fee), and answer questions about the dashboard and agent programs (Asset Recovery Agent $995, Owner Operator $7,495).
- When someone seems interested or has a specific claim, collect their name, phone, and email and tell them our recovery agent Allie Pearson will follow up. Encourage them to call (888) 545-8007.
- If you don't know something, say so and offer to connect them with our team.

${HOMEOWNER_INTEL}`

type Msg = { role: "user" | "assistant"; content: string }

// Self-healing model selection. If a model is deprecated/retired (Anthropic
// returns 404 not_found_error), fall forward to the next candidate instead of
// 500-ing the chatbot. Ordered: env override -> pinned current models -> the
// "-latest" aliases as a permanent safety net (they auto-track live models).
// The last model that worked is cached so we don't re-probe dead ids per request.
// Ids verified against Anthropic /v1/models (2026-07-06). Ordered cheapest-first
// for a support chatbot; each is a real, current id so a single retirement just
// falls to the next. Keep a "-latest" alias last as an ultimate net.
const MODEL_CANDIDATES: string[] = [
  process.env.CLAUDE_MODEL,
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-5-20250929",
  "claude-sonnet-5",
  "claude-3-5-haiku-latest",
].filter((m): m is string => !!m)

let healthyModel: string | null = null

function isModelGoneError(e: unknown): boolean {
  const err = e as { status?: number; error?: { type?: string }; message?: string } | undefined
  if (!err) return false
  if (err.status === 404) return true
  if (err.error?.type === "not_found_error") return true
  return /model|not_found|deprecat/i.test(err.message || "")
}

async function createWithFallback(client: Anthropic, args: Omit<Anthropic.MessageCreateParamsNonStreaming, "model">) {
  // Try the cached-healthy model first, then the ordered candidates (deduped).
  const ordered = [healthyModel, ...MODEL_CANDIDATES].filter((m): m is string => !!m)
  const tried = new Set<string>()
  let lastErr: unknown = null
  for (const model of ordered) {
    if (tried.has(model)) continue
    tried.add(model)
    try {
      const res = await client.messages.create({ ...args, model })
      if (healthyModel !== model) {
        healthyModel = model
        console.log(`[chat] model self-heal: now using "${model}"`)
      }
      return res
    } catch (e) {
      lastErr = e
      if (isModelGoneError(e)) {
        console.error(`[chat] model "${model}" unavailable, trying next candidate`)
        if (healthyModel === model) healthyModel = null
        continue
      }
      throw e // non-model error (rate limit, auth, network) — don't burn candidates
    }
  }
  throw lastErr
}

async function emailTranscript(messages: Msg[], meta: { name?: string; email?: string; sessionId?: string }) {
  const lines = messages.map((m) => `${m.role === "user" ? "Visitor" : "Foreclosure Recovery Inc."}: ${m.content}`).join("\n\n")
  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a">
      <h2 style="color:#1E3A5F;margin:0 0 8px">New chatbot conversation</h2>
      <p style="margin:0 0 4px"><strong>Name:</strong> ${meta.name || "—"}</p>
      <p style="margin:0 0 4px"><strong>Email:</strong> ${meta.email || "—"}</p>
      <p style="margin:0 0 12px"><strong>Session:</strong> ${meta.sessionId || "—"}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0"/>
      <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;line-height:1.5">${lines.replace(/</g, "&lt;")}</pre>
    </div>`
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  await transporter.sendMail({
    from: `"Foreclosure Recovery Inc. Chatbot" <${SMTP_USER}>`,
    to: TRANSCRIPT_TO.join(", "),
    replyTo: meta.email || undefined,
    subject: `Chatbot conversation${meta.name ? ` — ${meta.name}` : ""}`,
    html,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = String(body?.action || "message")
    const messages: Msg[] = Array.isArray(body?.messages) ? body.messages.slice(-30) : []

    if (action === "transcript") {
      if (!messages.some((m) => m.role === "user")) {
        return NextResponse.json({ ok: true, skipped: true })
      }
      try {
        await emailTranscript(messages, { name: body?.name, email: body?.email, sessionId: body?.sessionId })
      } catch (e) {
        console.error("[chat] transcript email failed:", e)
        return NextResponse.json({ ok: false, error: "email_failed" })
      }
      return NextResponse.json({ ok: true })
    }

    // action === "message" — get an assistant reply
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        reply: "Thanks for reaching out. Our team will follow up — please call us at (888) 545-8007 for immediate help.",
      })
    }
    const client = new Anthropic({ apiKey })
    const convo: Anthropic.MessageParam[] = messages
      .filter((m) => m.content?.trim())
      .map((m) => ({ role: m.role, content: m.content }))

    const response = await createWithFallback(client, {
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: convo.length ? convo : [{ role: "user", content: "Hello" }],
    })
    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim()

    return NextResponse.json({ reply: reply || "How can we help you with your surplus funds claim?" })
  } catch (e) {
    console.error("[chat] error:", e)
    return NextResponse.json(
      { reply: "Sorry, something went wrong on our end. Please call us at (888) 545-8007 and we'll help right away." },
      { status: 200 },
    )
  }
}
