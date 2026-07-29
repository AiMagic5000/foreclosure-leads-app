import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const SW_PROJECT = process.env.SIGNALWIRE_PROJECT_ID || ""
const SW_TOKEN = process.env.SIGNALWIRE_API_TOKEN || ""
const REC_BUCKET = "call-recordings"

async function ensureBucket() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try { await (supabaseAdmin.storage as any).createBucket(REC_BUCKET, { public: false }) } catch { /* exists */ }
}

// SignalWire posts here when a recording completes (configured on <Dial recordingStatusCallback>).
export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) {
    return new NextResponse("", { status: 403 })
  }
  const ext = url.searchParams.get("ext") || ""
  const fromClaimant = url.searchParams.get("from") || ""

  let f: FormData
  try { f = await req.formData() } catch { return new NextResponse("", { status: 200 }) }
  const recUrl = String(f.get("RecordingUrl") || "")
  const callSid = String(f.get("CallSid") || f.get("RecordingSid") || `rec-${Date.now()}`)
  const duration = String(f.get("RecordingDuration") || "")
  const to = String(f.get("To") || "")

  // Best-effort: pull the audio into our own storage so it's retained + has a stable URL.
  let storedPath = ""
  try {
    if (recUrl && SW_PROJECT && SW_TOKEN) {
      await ensureBucket()
      const auth = Buffer.from(`${SW_PROJECT}:${SW_TOKEN}`).toString("base64")
      const recFetchUrl = recUrl.match(/\.(wav|mp3)$/) ? recUrl.replace(/\.wav$/, ".mp3") : `${recUrl}.mp3`
      const r = await fetch(recFetchUrl, { headers: { Authorization: `Basic ${auth}` } })
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer())
        const path = `ext-${ext || "unknown"}/${callSid}.mp3`
        const { error } = await supabaseAdmin.storage.from(REC_BUCKET).upload(path, buf, {
          contentType: "audio/mpeg", upsert: true,
        })
        if (!error) storedPath = path
      }
    }
  } catch (e) {
    console.error("[sw-recording] download/store failed:", e instanceof Error ? e.message : String(e))
  }

  // Save metadata (no DB schema change — JSON in the config bucket).
  try {
    const meta = {
      call_sid: callSid, extension: ext, from: fromClaimant, to,
      duration_sec: duration, signalwire_url: recUrl, stored_path: storedPath,
      recorded_at: new Date().toISOString(),
    }
    await supabaseAdmin.storage.from("pbx-config").upload(
      `recordings/${callSid}.json`,
      new Blob([JSON.stringify(meta, null, 1)], { type: "application/json" }),
      { upsert: true }
    )
  } catch (e) {
    console.error("[sw-recording] metadata save failed:", e instanceof Error ? e.message : String(e))
  }

  return new NextResponse("", { status: 200 })
}
