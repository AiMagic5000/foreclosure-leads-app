import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// SignalWire POSTs here when an AI-covered call ends (post_prompt_url on the `ai` verb).
// We pull the structured summary the AI produced (name, callback number, reason) and
// email it to the covering agent + support@ so nothing the caller said is lost while the
// agent was away. support@ forwards a copy to xscore10 (the app-wide notify convention).
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn"
const RESEND_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const SUPPORT = "support@usforeclosureleads.com"

type Summary = {
  caller_name?: string | null
  callback_number?: string | null
  callback_time?: string | null
  reason?: string | null
  is_agent?: boolean
  urgency?: string | null
  summary?: string | null
}

// The post_prompt result can arrive as an object, or as a raw string with JSON embedded.
function coerceSummary(pp: unknown): Summary {
  if (pp && typeof pp === "object" && !Array.isArray(pp)) {
    const o = pp as Record<string, unknown>
    if (typeof o.parsed === "object" && o.parsed) return coerceSummary(o.parsed)
    if (Array.isArray(o.parsed) && o.parsed.length) return coerceSummary(o.parsed[0])
    if (typeof o.raw === "string") return coerceSummary(o.raw)
    return o as Summary
  }
  if (typeof pp === "string") {
    const m = pp.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) as Summary } catch { /* fall through */ } }
    return { summary: pp.slice(0, 800) }
  }
  return {}
}

async function agentEmailForExt(ext: string): Promise<{ email?: string; name?: string }> {
  if (!ext) return {}
  try {
    const { data } = await supabaseAdmin.storage.from("pbx-config").download("extensions.json")
    if (!data) return {}
    const map = JSON.parse(await data.text()) as Record<
      string,
      { agent_email?: string; agent_name?: string }
    >
    const rec = map[ext.replace(/\D/g, "")]
    return { email: rec?.agent_email, name: rec?.agent_name }
  } catch {
    return {}
  }
}

function esc(s: string): string {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) return new NextResponse("", { status: 403 })

  const ext = url.searchParams.get("ext") || ""
  const fromNum = url.searchParams.get("from") || ""

  let payload: Record<string, unknown> = {}
  try {
    payload = (await req.json()) as Record<string, unknown>
  } catch {
    try {
      const f = await req.formData()
      payload = Object.fromEntries(f.entries())
    } catch {
      /* empty */
    }
  }

  const s = coerceSummary(
    payload.post_prompt_data ?? payload.post_prompt ?? payload.parsed ?? payload,
  )
  const callerName = (s.caller_name || "Unknown caller").toString()
  const callback = (s.callback_number || fromNum || "not provided").toString()
  const callbackTime = (s.callback_time || "").toString()
  const reason = (s.reason || s.summary || "(no reason captured)").toString()
  const isAgent = s.is_agent === true
  const urgency = (s.urgency || "normal").toString()

  const { email: agentEmail, name: agentName } = await agentEmailForExt(ext)
  const when = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
  const urgColor = urgency === "high" ? "#dc2626" : urgency === "low" ? "#64748b" : "#d97706"

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;max-width:600px">
    <div style="background:linear-gradient(135deg,#1E3A5F,#2563eb);padding:18px;border-radius:10px 10px 0 0">
      <h2 style="color:#fff;margin:0;font-size:18px">📞 New Message — Your AI Assistant Took a Call</h2>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:18px">
      <p style="margin:0 0 6px"><strong>Caller:</strong> ${esc(callerName)}</p>
      <p style="margin:0 0 6px"><strong>Callback number:</strong> ${esc(callback)}</p>
      ${callbackTime ? `<p style="margin:0 0 6px"><strong>Best time to call:</strong> ${esc(callbackTime)}</p>` : ""}
      <p style="margin:0 0 6px"><strong>Reason:</strong> ${esc(reason)}</p>
      <p style="margin:0 0 6px"><strong>Type:</strong> ${isAgent ? "Agent / platform support" : "Homeowner / prospect"}</p>
      <p style="margin:0 0 6px"><strong>Urgency:</strong> <span style="color:${urgColor};font-weight:bold;text-transform:capitalize">${esc(urgency)}</span></p>
      ${s.summary ? `<div style="margin:12px 0 0;padding:12px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:4px"><strong>Summary:</strong><br>${esc(String(s.summary))}</div>` : ""}
      <p style="margin:14px 0 0;font-size:12px;color:#64748b">Answered for extension ${esc(ext || "?")}${agentName ? ` (${esc(agentName)})` : ""} at ${esc(when)} PT while you were away. Please call them back as soon as you're free.</p>
    </div></div>`

  const recipients = Array.from(new Set([agentEmail, SUPPORT].filter(Boolean))) as string[]
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": RESEND_UA,
      },
      body: JSON.stringify({
        from: "US Foreclosure Recovery <support@usforeclosureleads.com>",
        to: recipients,
        reply_to: callback && /\d/.test(callback) ? undefined : SUPPORT,
        subject: `📞 Message from ${callerName} — ${callback}`,
        html,
      }),
    })
  } catch (e) {
    console.error("[sw-ai-summary] resend failed:", e instanceof Error ? e.message : String(e))
  }

  // Retain the raw message alongside the call recordings for the record.
  try {
    await supabaseAdmin.storage.from("pbx-config").upload(
      `ai-messages/ext-${ext || "unknown"}-${Date.now()}.json`,
      new Blob([JSON.stringify({ ext, fromNum, summary: s, recorded_at: new Date().toISOString() }, null, 1)], {
        type: "application/json",
      }),
      { upsert: true },
    )
  } catch {
    /* best effort */
  }

  return NextResponse.json({ ok: true })
}
