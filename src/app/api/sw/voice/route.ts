import { NextRequest, NextResponse } from "next/server"
import { readJson } from "@/lib/pbx-storage"

export const dynamic = "force-dynamic"

// Shared secret so only SignalWire (configured with ?t=) can drive the IVR.
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const TForce = "+18889073234" // toll-free caller ID for the forward leg (STIR/SHAKEN signed)
const APP = "https://usforeclosureleads.com"
// Menu audio is served from Vercel (not foreclosure-db storage) so the phone never
// goes to dead air when that storage is unreachable/overloaded. See public/pbx/.
const PHONE_VOICE = process.env.SW_TTS_VOICE || "elevenlabs.rachel"
const MENU_URL = `${APP}/pbx/888-menu.mp3`

function xml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

type ExtRec = { forwarding_phone?: string; sip_endpoint?: string; agent_name?: string; agent_email?: string; active?: boolean; ai_cover?: boolean }

// Safety net used ONLY when the storage backend (foreclosure-db) is unreachable —
// e.g. overloaded/down — so a valid extension still forwards instead of dead-airing.
// Storage stays the source of truth (the admin page writes there); this is stale-
// tolerant because it is bypassed the moment storage responds. Keep the core agents
// here; refresh from the live extensions.json when storage is healthy.
const FALLBACK_EXTENSIONS: Record<string, ExtRec> = {
  "1":  { agent_name: "Allie", sip_endpoint: "allie-desk", forwarding_phone: "+17028449326", active: true },
  "2":  { agent_name: "Corey", forwarding_phone: "+14709303796", active: true },
  "10": { agent_name: "Rochelle", forwarding_phone: "+19106247825", active: true },
  "11": { agent_name: "Kevin", forwarding_phone: "+18177986336", active: true },
  "20": { agent_name: "Roger", forwarding_phone: "+14242475008", active: true },
  "24": { agent_name: "Danny", forwarding_phone: "+16612195085", active: true },
}

async function loadExtensions(): Promise<Record<string, ExtRec>> {
  // Storage is the source of truth — the admin page writes there. Time-boxed, because
  // a slow read here delays the whole IVR (see lib/pbx-storage for the 6s answer budget).
  const parsed = await readJson<Record<string, ExtRec>>("extensions.json")
  if (parsed && Object.keys(parsed).length) return parsed
  return FALLBACK_EXTENSIONS
}

function normPhone(p: string): string {
  const d = (p || "").replace(/\D/g, "")
  if (d.length === 11 && d.startsWith("1")) return `+${d}`
  if (d.length === 10) return `+1${d}`
  return p.startsWith("+") ? p : `+${d}`
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) {
    return xml(`<Say>Configuration error.</Say><Hangup/>`)
  }
  const step = url.searchParams.get("step") || "entry"
  let digits = ""
  let fromNum = ""
  try {
    const form = await req.formData()
    digits = String(form.get("Digits") || "")
    fromNum = String(form.get("From") || "")
  } catch { /* GET / no body */ }

  // URLs embedded in XML attributes/text MUST escape & as &amp; — SignalWire's
  // parser rejects the whole document on a raw ampersand (support ticket 52879).
  const gatherUrl = `${APP}/api/sw/voice?t=${WEBHOOK_TOKEN}&amp;step=connect`
  const entryUrl = `${APP}/api/sw/voice?t=${WEBHOOK_TOKEN}&amp;step=entry`
  const recCb = `${APP}/api/sw/recording?t=${WEBHOOK_TOKEN}&amp;ext=${encodeURIComponent(digits.trim())}&amp;from=${encodeURIComponent(fromNum)}`

  if (step !== "connect") {
    // Greeting + recording disclosure + collect extension. numDigits=2 submits
    // the moment a 2-digit extension is typed (all extensions are 1-2 digits) —
    // no trailing # or long wait needed. (Rebecca Young, 2026-07-14: her "17"
    // entry was rejected and the dead-air wait read as a broken system.)
    return xml(
      `<Gather input="dtmf" numDigits="2" timeout="8" finishOnKey="#" action="${gatherUrl}" method="POST">` +
        `<Play>${MENU_URL}</Play>` +
      `</Gather>` +
      `<Redirect method="POST">${entryUrl}</Redirect>`
    )
  }

  // step=connect: look up the entered extension. Strip every non-digit so
  // "17#", "*17", or a stray keypress can never reject a valid extension.
  const exts = await loadExtensions()
  const cleanExt = digits.replace(/[^0-9]/g, "")
  const rec = exts[cleanExt]
  const aiUrlFor = (ext: string, name: string) =>
    `${APP}/api/sw/ai?t=${WEBHOOK_TOKEN}` +
    `&amp;ext=${encodeURIComponent(ext)}` +
    `&amp;from=${encodeURIComponent(fromNum)}` +
    `&amp;name=${encodeURIComponent(name)}`

  // Extension we don't know at all (mis-key, or a number the caller invented).
  // Re-prompt, but BOUNDED: the old code redirected to the menu unconditionally, so a
  // caller who kept entering an unprovisioned extension looped until SignalWire killed
  // the call — which reads exactly like being hung up on. After two tries the office
  // AI picks up and takes a message instead of dumping the caller.
  if (!rec) {
    const tries = Number(url.searchParams.get("try") || "0") + 1
    if (tries >= 2) {
      return xml(
        `<Say voice="${PHONE_VOICE}">Let me get you to someone who can help.</Say>` +
        `<Redirect method="POST">${aiUrlFor("2", "")}</Redirect>`
      )
    }
    return xml(
      `<Say voice="${PHONE_VOICE}">Sorry, that extension was not recognized. Let's try again.</Say>` +
      `<Redirect method="POST">${entryUrl}&amp;try=${tries}</Redirect>`
    )
  }

  // A KNOWN agent whose extension has no way to ring — inactive, or no forwarding cell
  // and no SIP endpoint. These are real, paying agents who publish this extension to
  // claimants (16 of them on 2026-07-29, James Misiora ext 18 among them). They used to
  // hear "extension was not recognized" and get looped back to the menu, so both the
  // agent and their claimants were silently dropped. Hand them to the AI receptionist:
  // it takes the message and ai-summary emails the agent at their agent_email.
  const reachable = rec.active !== false && Boolean(rec.forwarding_phone || rec.sip_endpoint)
  if (!reachable) {
    return xml(`<Redirect method="POST">${aiUrlFor(cleanExt, rec.agent_name || "")}</Redirect>`)
  }

  // "AI covers me": when the agent has flipped their extension to AI coverage, hand the
  // answered call to the SignalWire-native voice AI (SWML `ai` verb) instead of dialing.
  // The AI greets, answers common questions, and takes a message, then emails the agent.
  // When ai_cover is off (the default) this branch is skipped and the call dials as before.
  if (rec.ai_cover) {
    return xml(`<Redirect method="POST">${aiUrlFor(cleanExt, rec.agent_name || "")}</Redirect>`)
  }

  // Ring the SIP desk phone and the forwarding cell together — first to answer wins.
  const SIP_DOMAIN = "start-my-business-inc-da771e59eccb.sip.signalwire.com"
  const targets =
    (rec.sip_endpoint ? `<Sip>sip:${rec.sip_endpoint}@${SIP_DOMAIN}</Sip>` : "") +
    (rec.forwarding_phone ? `<Number>${normPhone(rec.forwarding_phone)}</Number>` : "")
  // No answer after ~4 rings (24s) -> the AI receptionist takes the call BY DEFAULT
  // (owner rule 2026-07-22): it answers questions and takes the message, so callers
  // never hit a dumb voicemail. With ai_cover ON the AI answers instantly (above).
  const noAnswerAiUrl = aiUrlFor(cleanExt, rec.agent_name || "")
  return xml(
    `<Say voice="${PHONE_VOICE}">Please hold while we connect you.</Say>` +
    `<Dial answerOnBridge="true" callerId="${TForce}" timeout="24" ` +
      `record="record-from-answer-dual" recordingStatusCallback="${recCb}" recordingStatusCallbackEvent="completed">` +
      targets +
    `</Dial>` +
    `<Redirect method="POST">${noAnswerAiUrl}</Redirect>`
  )
}

export async function POST(req: NextRequest) { return handle(req) }
export async function GET(req: NextRequest) { return handle(req) }
