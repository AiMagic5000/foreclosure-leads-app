import { NextRequest, NextResponse, after } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { buildSmbPhonePrompt } from "@/lib/smb-phone-knowledge"
import { readJson, readJsonResult, writeJson, removeObject } from "@/lib/pbx-storage"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// SMB (startmybusiness.us) AI receptionist — answers its direct number on the first
// ring. Same cXML speech-loop engine as the USFR receptionist (/api/sw/ai), with the
// SMB brain. Extras per owner spec (2026-07-22):
//   * text-back: on pickup we SMS the caller from the owner's TextBee so they can
//     continue by text ("reply here about your business"); number is recorded in
//     smb_textback so the R740xd notifier relays their replies to xscore10.
//   * transcript: call summary emails Corey + support@startmybusiness.us, and the raw
//     JSON is parked in pbx-config/smb-calls/ for the xscore10 SMTP relay (Resend
//     cannot deliver to Proton — the LAN forwarder does it).
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const APP = "https://usforeclosureleads.com"
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ""
// claude-3-5-haiku-latest removed 2026-07-29 — retired, 404s on every call.
const MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929"]
// SignalWire drops the call ~6s after it starts ringing, so no single step on the
// answer path may outlive that budget. See lib/pbx-storage for the measurements.
const MODEL_TIMEOUT_MS = 8000
const VOICE = process.env.SW_TTS_VOICE || "elevenlabs.rachel"
const MAX_TURNS = 10
const TEXTBEE_KEY = "a9e1fefe-6fc9-4422-91d1-667425d5c5c2"
const TEXTBEE_DEVICE = "688a8bbc6cd203ecb5781c50"
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn"

type Msg = { role: "user" | "assistant"; content: string }
type CallState = { history: Msg[]; noinput: number; wrapping?: boolean }

function xml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
const statePath = (sid: string) => `smb-calls/state-${sid}.json`

// Time-boxed (see lib/pbx-storage): losing a turn of memory beats losing the caller.
async function loadState(sid: string): Promise<CallState> {
  return (await readJson<CallState>(statePath(sid))) ?? { history: [], noinput: 0 }
}
async function saveState(sid: string, st: CallState): Promise<void> {
  await writeJson(statePath(sid), st)
}

async function anthropic(system: string, messages: Msg[], maxTokens: number): Promise<string> {
  for (const model of MODELS) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
        signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      })
      if (!r.ok) { if (r.status === 404) continue; return "" }
      const j = (await r.json()) as { content?: Array<{ type: string; text?: string }> }
      return (j.content || []).map((b) => b.text || "").join("").trim()
    } catch { continue }
  }
  return ""
}

function smbSystem(): string {
  return (
    buildSmbPhonePrompt() +
    "\n\nPHONE-CALL OUTPUT RULES (critical):\n" +
    "- Live phone call: 1-3 short spoken sentences. Plain text only.\n" +
    "- Caller speech comes from speech-to-text and may be garbled — interpret generously.\n" +
    "- NEVER append [DONE] while the caller is still giving details. After collecting the callback " +
    "day/time, repeat it back and ask if there is anything else. Only [DONE] once they clearly finish."
  )
}

// Text-back: SMS the caller from the owner's TextBee + record for the reply-notifier.
async function textBack(from: string): Promise<void> {
  const digits = from.replace(/\D/g, "")
  if (digits.length < 10) return
  const to = digits.length === 10 ? `+1${digits}` : `+${digits}`
  // One text-back per caller per 7 days. CLAIM BEFORE SENDING: the marker is written
  // first, so a storage hiccup costs at most one missed text instead of re-texting the
  // same caller on every call. (Writing it after the send is why one caller got 8
  // identical texts while storage was down on 2026-07-28.)
  const marker = `smb-calls/textback-${digits}.json`
  const seen = await readJsonResult<{ at?: number }>(marker)
  // Fail CLOSED when storage does not answer: skipping one text-back is harmless,
  // but treating an unreadable marker as "never texted" re-sends on every call —
  // that is how one caller got 8 identical texts on 07-28. A confirmed `absent`
  // (storage answered, no marker) still sends, so first-time callers are unaffected.
  if (seen.status === "unavailable") return
  if (seen.status === "found" && seen.value.at && Date.now() - seen.value.at < 7 * 86400e3) return

  if (!(await writeJson(marker, { at: Date.now(), to }))) {
    // Could not claim -> cannot guarantee this is the only send. Skip rather than risk a loop.
    console.error("[smb-ai] textback claim failed or timed out, skipping send")
    return
  }

  try {
    await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE}/send-sms`, {
      method: "POST",
      headers: { "x-api-key": TEXTBEE_KEY, "User-Agent": BROWSER_UA, "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients: [to],
        message:
          "Thanks for calling Start My Business Inc (startmybusiness.us)! If it's easier to text, " +
          "reply right here and tell us about your business - we answer by text too.",
      }),
      signal: AbortSignal.timeout(15000),
    })
    // registry row so the R740xd notifier can match replies -> xscore10
    await supabaseAdmin.from("smb_textback").insert({ phone: to }).then(() => undefined, () => undefined)
  } catch (e) {
    console.error("[smb-ai] textback failed:", e instanceof Error ? e.message : String(e))
  }
}

// Always invoked through after(): a model call plus an email send used to sit BEFORE
// the goodbye <Say>, leaving the caller in silence until SignalWire dropped the call.
async function finishCall(sid: string, from: string, st: CallState): Promise<void> {
  try {
    const transcript = st.history.map((m) => `${m.role === "user" ? "Caller" : "Receptionist"}: ${m.content}`).join("\n")
    const raw = await anthropic(
      "Output ONLY one JSON object: caller_name (string|null), callback_number (string|null), " +
      "callback_time (string|null), business_type (string|null), reason (short string), " +
      "urgency (low|normal|high), summary (2-3 sentences). Only what the caller actually said.",
      [{ role: "user", content: `Call transcript:\n${transcript || "(caller said nothing)"}` }], 500)
    let s: Record<string, unknown> = {}
    try { s = JSON.parse((raw.match(/\{[\s\S]*\}/) || ["{}"])[0]) } catch { s = { summary: raw.slice(0, 500) } }
    const when = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    const g = (k: string) => esc(String(s[k] ?? ""))
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;max-width:600px">
      <div style="background:linear-gradient(135deg,#081533,#1d4ed8);padding:18px;border-radius:10px 10px 0 0">
        <h2 style="color:#fff;margin:0;font-size:18px">📞 SMB Call — Receptionist Took It</h2></div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:18px">
        <p style="margin:0 0 5px"><strong>Caller:</strong> ${g("caller_name") || "Unknown"} (${esc(from)})</p>
        <p style="margin:0 0 5px"><strong>Callback:</strong> ${g("callback_number") || esc(from)} ${g("callback_time") ? "— best time: " + g("callback_time") : ""}</p>
        <p style="margin:0 0 5px"><strong>Business:</strong> ${g("business_type") || "?"}</p>
        <p style="margin:0 0 5px"><strong>Reason:</strong> ${g("reason")}</p>
        <p style="margin:0 0 10px"><strong>Summary:</strong> ${g("summary")}</p>
        <p style="margin:0;font-size:12px;color:#64748b">${when} PT — text-back SMS was sent; replies relay to you automatically.</p>
      </div></div>`
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": BROWSER_UA },
      body: JSON.stringify({
        from: "SMB Receptionist <support@usforeclosureleads.com>",
        to: ["coreypearsonemail@gmail.com", "support@startmybusiness.us"],
        subject: `📞 SMB call: ${String(s["caller_name"] || from)} — ${String(s["reason"] || "new inquiry").slice(0, 60)}`,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    })
    // park for the xscore10 SMTP relay on the LAN
    await writeJson(`smb-calls/done-${sid}.json`, {
      sid, from, summary: s, transcript, at: new Date().toISOString(),
    })
  } catch (e) {
    console.error("[smb-ai] finish failed:", e instanceof Error ? e.message : String(e))
  }
  await removeObject(statePath(sid))
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) return xml(`<Hangup/>`)
  const step = url.searchParams.get("step") || "greet"

  let sid = "", speech = "", from = url.searchParams.get("from") || ""
  try {
    const f = await req.formData()
    sid = String(f.get("CallSid") || "")
    speech = String(f.get("SpeechResult") || "").trim()
    if (!from) from = String(f.get("From") || "")
  } catch { /* GET */ }
  if (!sid) sid = `smb-${from.replace(/\D/g, "")}`

  const turnUrl =
    `${APP}/api/sw/smb-ai?t=${WEBHOOK_TOKEN}&amp;step=turn&amp;from=${encodeURIComponent(from)}`
  const gather =
    `<Gather input="speech" action="${turnUrl}" method="POST" timeout="6" speechTimeout="auto" language="en-US"></Gather>` +
    `<Redirect method="POST">${turnUrl}</Redirect>`

  if (step !== "turn") {
    const greeting =
      `Thanks for calling Start My Business — this is the front desk. ` +
      `How can we help you and your business today?`
    // Neither of these is needed to speak the greeting, and together they were ~4-8s
    // against a loaded foreclosure-db — well past SignalWire's ~6s answer budget, so
    // the call died before the caller heard a word. Both run after the response is
    // flushed: state is only read on the caller's first turn (which cannot arrive
    // until the greeting finishes playing), and the text-back's send-once marker
    // still gates it, so nobody gets a duplicate.
    after(async () => {
      await saveState(sid, { history: [{ role: "assistant", content: greeting }], noinput: 0 })
      await textBack(from)
    })
    return xml(`<Say voice="${VOICE}">${esc(greeting)}</Say>${gather}`)
  }

  const st = await loadState(sid)

  if (!speech) {
    if (st.wrapping) {
      const bye = `Thank you so much for calling Start My Business. Have a wonderful day. Goodbye.`
      st.history.push({ role: "assistant", content: bye })
      after(() => finishCall(sid, from, st))
      return xml(`<Say voice="${VOICE}">${esc(bye)}</Say><Hangup/>`)
    }
    st.noinput += 1
    if (st.noinput >= 2) {
      const bye =
        `No problem — we also just sent you a text, so reply there any time and tell us about your ` +
        `business. Thanks for calling Start My Business. Goodbye.`
      st.history.push({ role: "assistant", content: bye })
      after(() => finishCall(sid, from, st))
      return xml(`<Say voice="${VOICE}">${esc(bye)}</Say><Hangup/>`)
    }
    await saveState(sid, st)
    return xml(`<Say voice="${VOICE}">I'm sorry, I didn't catch that. Could you say that again?</Say>${gather}`)
  }

  st.noinput = 0
  st.wrapping = false
  st.history.push({ role: "user", content: speech })
  const turns = st.history.filter((m) => m.role === "user").length

  let system = smbSystem()
  if (turns >= MAX_TURNS - 1) system += "\n\nThe call has run long — confirm their callback number, close warmly, append [DONE]."
  let reply = await anthropic(system, st.history, 250)
  if (!reply) {
    const bye =
      `I'm so sorry, we're having a little trouble on our end. We just texted you — reply there and ` +
      `a business specialist will get right back to you. Thank you. Goodbye.`
    st.history.push({ role: "assistant", content: bye })
    after(() => finishCall(sid, from, st))
    return xml(`<Say voice="${VOICE}">${esc(bye)}</Say><Hangup/>`)
  }

  const done = reply.includes("[DONE]") || turns >= MAX_TURNS
  reply = reply.replace(/\[DONE\]/g, "").trim()
  st.history.push({ role: "assistant", content: reply })

  if (done) {
    if (turns >= MAX_TURNS) {
      after(() => finishCall(sid, from, st))
      return xml(`<Say voice="${VOICE}">${esc(reply)}</Say><Hangup/>`)
    }
    st.wrapping = true
    await saveState(sid, st)
    return xml(`<Say voice="${VOICE}">${esc(reply)}</Say>${gather}`)
  }
  await saveState(sid, st)
  return xml(`<Say voice="${VOICE}">${esc(reply)}</Say>${gather}`)
}

export async function POST(req: NextRequest) { return handle(req) }
export async function GET(req: NextRequest) { return handle(req) }
