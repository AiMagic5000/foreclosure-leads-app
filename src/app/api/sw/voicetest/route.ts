import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Voice sampler — we originate a REST call to the owner's cell pointing Url here, and he
// hears each candidate TTS engine announce itself. Ordered safest-first so if an engine
// string is unsupported and kills the document, everything before it still played.
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"

const SAMPLES: Array<[string, string]> = [
  ["Polly.Joanna-Neural", "Voice one. Hi, thanks for calling. Corey is helping another client at the moment, but I'm the office assistant and I'm happy to help."],
  ["gcloud.en-US-Neural2-F", "Voice two. Hi, thanks for calling. Corey is helping another client at the moment, but I'm the office assistant and I'm happy to help."],
  ["elevenlabs.rachel", "Voice three. Hi, thanks for calling. Corey is helping another client at the moment, but I'm the office assistant and I'm happy to help."],
  ["elevenlabs.bella", "Voice four. Hi, thanks for calling. Corey is helping another client at the moment, but I'm the office assistant and I'm happy to help."],
]

function handle(req: NextRequest): NextResponse {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) {
    return new NextResponse("", { status: 403 })
  }
  const body = SAMPLES.map(([v, text]) => `<Say voice="${v}">${text}</Say><Pause length="1"/>`).join("")
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}<Say voice="Polly.Joanna-Neural">That was all four voices. Text Claude which number you liked. Goodbye.</Say><Hangup/></Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } },
  )
}

export function POST(req: NextRequest) { return handle(req) }
export function GET(req: NextRequest) { return handle(req) }
