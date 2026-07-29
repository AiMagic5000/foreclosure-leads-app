import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { readJson } from "@/lib/pbx-storage"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Voicemail capture for the no-answer path: when an extension rings out and the AI
// toggle is OFF, /api/sw/voice plays the "currently helping another agent" message and
// <Record>s. The Record action posts here — we thank the caller, pull the recording into
// public storage, and email the agent + support@ a listen link so no call is ever lost.
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const SW_PROJECT = process.env.SIGNALWIRE_PROJECT_ID || ""
const SW_TOKEN = process.env.SIGNALWIRE_API_TOKEN || ""
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn"
const RESEND_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const SUPPORT = "support@usforeclosureleads.com"
const PHONE_VOICE = process.env.SW_TTS_VOICE || "elevenlabs.rachel"
const PUBLIC_BASE = "https://foreclosure-db.alwaysencrypted.com/storage/v1/object/public/voicedrops"

function xml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

async function agentEmailForExt(ext: string): Promise<{ email?: string; name?: string }> {
  const map = await readJson<Record<string, { agent_email?: string; agent_name?: string }>>("extensions.json")
  const rec = map?.[(ext || "").replace(/\D/g, "")]
  return { email: rec?.agent_email, name: rec?.agent_name }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) return xml(`<Hangup/>`)
  const ext = url.searchParams.get("ext") || ""

  let recUrl = "", from = "", sid = "", duration = ""
  try {
    const f = await req.formData()
    recUrl = String(f.get("RecordingUrl") || "")
    from = String(f.get("From") || url.searchParams.get("from") || "")
    sid = String(f.get("CallSid") || `vm-${Date.now()}`)
    duration = String(f.get("RecordingDuration") || "")
  } catch { /* no body */ }

  // Caller-facing close happens regardless of what the plumbing below does.
  const goodbye = xml(
    `<Say voice="${PHONE_VOICE}">Thank you. We received your message and will call you back shortly. Goodbye.</Say><Hangup/>`,
  )

  if (!recUrl) return goodbye

  try {
    // Pull the audio (SignalWire recordings need basic auth), park it in the public
    // voicedrops bucket so the email link plays with one tap.
    let publicUrl = ""
    if (SW_PROJECT && SW_TOKEN) {
      const auth = Buffer.from(`${SW_PROJECT}:${SW_TOKEN}`).toString("base64")
      // RecordingUrl sometimes already carries an extension (.wav) — appending .mp3
      // blindly makes a dead ".wav.mp3" URL (Ron ext-21 VM, 2026-07-22). Try the mp3
      // rendition first, then the URL as given.
      const candidates = recUrl.match(/\.(wav|mp3)$/)
        ? [recUrl.replace(/\.wav$/, ".mp3"), recUrl]
        : [`${recUrl}.mp3`, recUrl]
      for (const cu of candidates) {
        const r = await fetch(cu, { headers: { Authorization: `Basic ${auth}` }, signal: AbortSignal.timeout(20000) })
        if (!r.ok) continue
        const isMp3 = cu.endsWith(".mp3")
        const buf = Buffer.from(await r.arrayBuffer())
        const path = `vm/${sid}${isMp3 ? ".mp3" : ".wav"}`
        const { error } = await supabaseAdmin.storage.from("voicedrops").upload(path, buf, {
          contentType: isMp3 ? "audio/mpeg" : "audio/wav", upsert: true,
        })
        if (!error) publicUrl = `${PUBLIC_BASE}/${path}`
        break
      }
    }

    const { email: agentEmail, name: agentName } = await agentEmailForExt(ext)
    const when = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    })
    const listen = publicUrl || `${recUrl}.mp3 (SignalWire login required)`
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;max-width:600px">
      <div style="background:linear-gradient(135deg,#1E3A5F,#2563eb);padding:18px;border-radius:10px 10px 0 0">
        <h2 style="color:#fff;margin:0;font-size:18px">🎙 New Voicemail — Extension ${ext || "?"}</h2>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:18px">
        <p style="margin:0 0 6px"><strong>From:</strong> ${from || "unknown caller"}</p>
        <p style="margin:0 0 6px"><strong>Length:</strong> ${duration || "?"} seconds</p>
        <p style="margin:0 0 14px"><strong>Received:</strong> ${when} PT</p>
        ${publicUrl ? `<p style="margin:0 0 14px;text-align:center"><a href="${publicUrl}" style="display:inline-block;background:#09274c;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 26px;border-radius:8px">▶ Listen to the voicemail</a></p>` : `<p style="margin:0 0 14px">${listen}</p>`}
        <p style="margin:0;font-size:12px;color:#64748b">The caller heard: "${agentName || "your agent"} is currently helping another agent — please leave a message." Call them back as soon as you're free.</p>
      </div></div>`

    const recipients = Array.from(new Set([agentEmail, SUPPORT].filter(Boolean))) as string[]
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": RESEND_UA },
      body: JSON.stringify({
        from: "US Foreclosure Recovery <support@usforeclosureleads.com>",
        to: recipients,
        subject: `🎙 Voicemail for ext ${ext || "?"} — ${from || "unknown"}`,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (e) {
    console.error("[sw-vm] processing failed:", e instanceof Error ? e.message : String(e))
  }
  return goodbye
}

export async function GET(req: NextRequest) { return POST(req) }
