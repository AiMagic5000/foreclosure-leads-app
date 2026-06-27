import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// Shared secret so only SignalWire (configured with ?t=) can drive the IVR.
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const TForce = "+18889073234" // toll-free caller ID for the forward leg (STIR/SHAKEN signed)
const APP = "https://usforeclosureleads.com"
const MENU_URL = "https://foreclosure-db.alwaysencrypted.com/storage/v1/object/public/voicedrops/pbx/888-menu.mp3"

function xml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

type ExtRec = { forwarding_phone: string; agent_name?: string; active?: boolean }

async function loadExtensions(): Promise<Record<string, ExtRec>> {
  try {
    const { data } = await supabaseAdmin.storage.from("pbx-config").download("extensions.json")
    if (!data) return {}
    return JSON.parse(await data.text()) as Record<string, ExtRec>
  } catch {
    return {}
  }
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

  const gatherUrl = `${APP}/api/sw/voice?t=${WEBHOOK_TOKEN}&step=connect`
  const entryUrl = `${APP}/api/sw/voice?t=${WEBHOOK_TOKEN}&step=entry`
  const recCb = `${APP}/api/sw/recording?t=${WEBHOOK_TOKEN}&ext=${encodeURIComponent(digits.trim())}&from=${encodeURIComponent(fromNum)}`

  if (step !== "connect") {
    // Greeting + recording disclosure + collect extension.
    return xml(
      `<Gather input="dtmf" numDigits="4" timeout="8" finishOnKey="#" action="${gatherUrl}" method="POST">` +
        `<Play>${MENU_URL}</Play>` +
      `</Gather>` +
      `<Redirect method="POST">${entryUrl}</Redirect>`
    )
  }

  // step=connect: look up the entered extension.
  const exts = await loadExtensions()
  const rec = exts[digits.trim()]
  if (!rec || rec.active === false || !rec.forwarding_phone) {
    return xml(
      `<Say voice="Polly.Joanna">Sorry, that extension was not recognized. Let's try again.</Say>` +
      `<Redirect method="POST">${entryUrl}</Redirect>`
    )
  }
  const cell = normPhone(rec.forwarding_phone)
  return xml(
    `<Say voice="Polly.Joanna">Please hold while we connect you.</Say>` +
    `<Dial answerOnBridge="true" callerId="${TForce}" timeout="30" ` +
      `record="record-from-answer-dual" recordingStatusCallback="${recCb}" recordingStatusCallbackEvent="completed">` +
      `<Number>${cell}</Number>` +
    `</Dial>` +
    `<Say voice="Polly.Joanna">The party you are trying to reach is not available. Please call again later. Goodbye.</Say><Hangup/>`
  )
}

export async function POST(req: NextRequest) { return handle(req) }
export async function GET(req: NextRequest) { return handle(req) }
