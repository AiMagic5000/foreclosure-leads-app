import { NextRequest, NextResponse, after } from "next/server"
import { buildPhonePrompt } from "@/lib/phone-ai-knowledge"
import { readJson, writeJson, removeObject } from "@/lib/pbx-storage"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Away-coverage phone AI — PURE cXML (LaML). The first build returned SWML from a
// <Redirect>, but a laml_webhooks number rejects SWML and drops the call (live test
// 2026-07-21: caller heard a hangup). cXML has no `ai` verb, so this is a turn loop:
// <Say> speaks, <Gather input="speech"> transcribes the caller, Claude writes the next
// line, repeat. Conversation state lives in pbx-config storage keyed by CallSid.
// When the AI wraps up (or the caller goes silent twice) we summarize the transcript
// and hand it to /api/sw/ai-summary, which emails the covering agent + support@.
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const APP = "https://usforeclosureleads.com"
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ""
// Haiku first — per-turn latency matters more than depth on a phone call.
// claude-3-5-haiku-latest was removed 2026-07-29: it is retired and 404s on every
// call, so it only ever burned a round trip before falling out of the chain.
const MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929"]
// Per-model ceiling. SignalWire abandons the turn long before a 20s model wait
// could return, so a slow model must cost us a fallback, not the caller.
const MODEL_TIMEOUT_MS = 8000
const VOICE = process.env.SW_TTS_VOICE || "elevenlabs.rachel"  // premium engine, billed via SignalWire
const MAX_TURNS = 10

type Msg = { role: "user" | "assistant"; content: string }
type CallState = { history: Msg[]; noinput: number; wrapping?: boolean }

function xml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

// <Say> content must be XML-safe; the model is told plain-text-only, this is the backstop.
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const statePath = (sid: string) => `ai-calls/${sid}.json`

// Both helpers are time-boxed (see lib/pbx-storage). A slow foreclosure-db must cost
// the AI a turn of memory, never the call itself.
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
      if (!r.ok) {
        if (r.status === 404) continue // model retired -> next in chain
        return ""
      }
      const j = (await r.json()) as { content?: Array<{ type: string; text?: string }> }
      return (j.content || []).map((b) => b.text || "").join("").trim()
    } catch { continue }
  }
  return ""
}

function phoneSystem(agentName: string): string {
  return (
    buildPhonePrompt(agentName) +
    "\n\nPHONE-CALL OUTPUT RULES (critical):\n" +
    "- You are SPEAKING on a live phone call. Reply with 1-3 short spoken sentences only.\n" +
    "- Plain text only: no lists, no markdown, no emojis, no stage directions.\n" +
    "- The caller's words come from speech-to-text and may be garbled — interpret generously.\n" +
    "- When you have finished helping AND collected their name, callback number, and best time " +
    "(or the caller is done), close warmly and append the exact token [DONE] at the very end.\n" +
    "- NEVER append [DONE] while the caller is still giving details (a callback day, a time, a number). " +
    "After they give a callback time, repeat it back and ask if there is anything else you can help with. " +
    "Only [DONE] after the caller clearly finishes: goodbye, thanks, that is all, or confirms nothing else."
  )
}

// Wrap up: turn the transcript into the structured message + email it via ai-summary.
// Always invoked through after() — it runs a model call plus an HTTP round trip, which
// used to sit BEFORE the goodbye <Say> and left the caller in silence until SignalWire
// dropped the call. Off the response path it can take the time it needs.
async function finishCall(sid: string, ext: string, from: string, name: string, st: CallState): Promise<void> {
  try {
    const transcript = st.history.map((m) => `${m.role === "user" ? "Caller" : "Assistant"}: ${m.content}`).join("\n")
    const raw = await anthropic(
      "Output ONLY one JSON object with keys: caller_name (string or null), callback_number (string or null), " +
      "callback_time (string or null), reason (short string), is_agent (boolean), urgency (low|normal|high), " +
      "summary (2-3 sentences). Use only what the caller actually said; null when never given.",
      [{ role: "user", content: `Call transcript:\n${transcript || "(caller said nothing)"}` }],
      500,
    )
    const summaryUrl =
      `${APP}/api/sw/ai-summary?t=${WEBHOOK_TOKEN}&ext=${encodeURIComponent(ext)}` +
      `&from=${encodeURIComponent(from)}&name=${encodeURIComponent(name)}`
    await fetch(summaryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_prompt_data: raw || transcript.slice(0, 800) }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (e) {
    console.error("[sw-ai] finish failed:", e instanceof Error ? e.message : String(e))
  }
  await removeObject(statePath(sid))
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) return xml(`<Hangup/>`)
  const ext = url.searchParams.get("ext") || ""
  let from = url.searchParams.get("from") || ""
  const agentName = (url.searchParams.get("name") || "").split(" ")[0] || "your specialist"
  const step = url.searchParams.get("step") || "greet"

  let sid = "", speech = "", formFrom = ""
  try {
    const f = await req.formData()
    sid = String(f.get("CallSid") || "")
    speech = String(f.get("SpeechResult") || "").trim()
    formFrom = String(f.get("From") || "")
  } catch { /* GET */ }
  if (!from) from = formFrom
  if (!sid) sid = `nosid-${ext}-${from.replace(/\D/g, "")}`

  const turnUrl =
    `${APP}/api/sw/ai?t=${WEBHOOK_TOKEN}&amp;step=turn&amp;ext=${encodeURIComponent(ext)}` +
    `&amp;from=${encodeURIComponent(from)}&amp;name=${encodeURIComponent(url.searchParams.get("name") || "")}`
  const gather =
    `<Gather input="speech" action="${turnUrl}" method="POST" timeout="6" speechTimeout="auto" language="en-US">` +
    `</Gather>` +
    // Gather falls through on silence — route back with an empty SpeechResult so the
    // turn handler counts the no-input instead of the call dying.
    `<Redirect method="POST">${turnUrl}</Redirect>`

  if (step !== "turn") {
    const greeting =
      `Hi, thanks for calling. ${agentName} is helping another client at the moment, but I'm the ` +
      `office assistant and I'm happy to help. May I ask who's calling, and what can we do for you today?`
    // Nothing reads this state until the caller's first turn, which cannot arrive until
    // the greeting has finished playing (~10s of speech). Writing it after the response
    // keeps the answer path to pure compute — the greet webhook is what SignalWire times
    // out on, and a slow storage write here is what dropped calls before the caller
    // heard a word.
    after(() => saveState(sid, { history: [{ role: "assistant", content: greeting }], noinput: 0 }))
    return xml(`<Say voice="${VOICE}">${esc(greeting)}</Say>${gather}`)
  }

  const st = await loadState(sid)

  if (!speech) {
    if (st.wrapping) {
      // Caller went quiet after our wrap-up line — NOW it's safe to end.
      const bye = `Thank you so much for calling. Have a wonderful day. Goodbye.`
      st.history.push({ role: "assistant", content: bye })
      after(() => finishCall(sid, ext, from, agentName, st))
      return xml(`<Say voice="${VOICE}">${esc(bye)}</Say><Hangup/>`)
    }
    st.noinput += 1
    if (st.noinput >= 2) {
      const bye =
        `No problem at all. We'll have ${agentName} give you a call back at the number you're calling from. ` +
        `Thank you so much, and have a wonderful day. Goodbye.`
      st.history.push({ role: "assistant", content: bye })
      after(() => finishCall(sid, ext, from, agentName, st))
      return xml(`<Say voice="${VOICE}">${esc(bye)}</Say><Hangup/>`)
    }
    await saveState(sid, st)
    return xml(`<Say voice="${VOICE}">I'm sorry, I didn't catch that. Could you say that again?</Say>${gather}`)
  }

  st.noinput = 0
  st.wrapping = false
  st.history.push({ role: "user", content: speech })
  const turns = st.history.filter((m) => m.role === "user").length

  let system = phoneSystem(agentName)
  if (turns >= MAX_TURNS - 1) {
    system += "\n\nThe call has run long — wrap up NOW: confirm their callback number, close warmly, append [DONE]."
  }
  let reply = await anthropic(system, st.history, 250)
  if (!reply) {
    const bye =
      `I'm so sorry, we're having a little trouble on our end. We'll have ${agentName} call you right back ` +
      `at the number you're calling from. Thank you for your patience. Goodbye.`
    st.history.push({ role: "assistant", content: bye })
    after(() => finishCall(sid, ext, from, agentName, st))
    return xml(`<Say voice="${VOICE}">${esc(bye)}</Say><Hangup/>`)
  }

  const done = reply.includes("[DONE]") || turns >= MAX_TURNS
  reply = reply.replace(/\[DONE\]/g, "").trim()
  st.history.push({ role: "assistant", content: reply })

  if (done) {
    if (turns >= MAX_TURNS) {
      after(() => finishCall(sid, ext, from, agentName, st))
      return xml(`<Say voice="${VOICE}">${esc(reply)}</Say><Hangup/>`)
    }
    // Linger: speak the wrap-up but keep the mic open one more turn, so a caller who
    // is still talking (e.g. adding their callback time) is never cut off mid-sentence.
    st.wrapping = true
    await saveState(sid, st)
    return xml(`<Say voice="${VOICE}">${esc(reply)}</Say>${gather}`)
  }
  await saveState(sid, st)
  return xml(`<Say voice="${VOICE}">${esc(reply)}</Say>${gather}`)
}

export async function POST(req: NextRequest) { return handle(req) }
export async function GET(req: NextRequest) { return handle(req) }
