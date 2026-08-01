import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Outbound-call handler for SignalWire SIP Credentials (agent desk phones).
// Set as the credential's call_request_url so EVERY outbound call an agent
// places from their SIP desk phone is recorded by default, dialed out with the
// toll-free caller ID, and the recording lands in the same call-recordings bucket
// as inbound transfers (via /api/sw/recording).
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const TForce = "+18889073234" // toll-free caller ID (STIR/SHAKEN signed)
const APP = "https://usforeclosureleads.com"

function xml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
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
  let to = ""
  let from = ""
  try {
    const form = await req.formData()
    // The number the agent dialed. SignalWire sends the destination in `To`
    // (SIP calls may put it in the request URI too, but To is the reliable one).
    to = String(form.get("To") || form.get("Called") || "")
    from = String(form.get("From") || "")
  } catch { /* GET / no body */ }

  const dest = normPhone(to.replace(/^sip:/, "").split("@")[0])
  // & must be escaped as &amp; inside cXML attributes (SignalWire rejects raw &).
  const recCb =
    `${APP}/api/sw/recording?t=${WEBHOOK_TOKEN}&amp;dir=outbound&amp;from=${encodeURIComponent(from)}&amp;to=${encodeURIComponent(dest)}`

  if (!dest || dest.replace(/\D/g, "").length < 10) {
    return xml(`<Say voice="Polly.Joanna">Sorry, that number was not recognized.</Say><Hangup/>`)
  }
  // Record every leg from answer, both sides, and PSTN-dial the destination with
  // the toll-free caller ID.
  return xml(
    `<Dial answerOnBridge="true" callerId="${TForce}" timeout="45" ` +
      `record="record-from-answer-dual" recordingStatusCallback="${recCb}" recordingStatusCallbackEvent="completed">` +
      `<Number>${dest}</Number>` +
    `</Dial>` +
    `<Hangup/>`
  )
}

export async function POST(req: NextRequest) { return handle(req) }
export async function GET(req: NextRequest) { return handle(req) }
