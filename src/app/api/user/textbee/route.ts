import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"

// Browser UA required — api.textbee.dev is behind Cloudflare (default UA => 1010/403).
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const TEXTBEE_BASE = "https://api.textbee.dev/api/v1/gateway/devices"

export const dynamic = "force-dynamic"

async function pinForUser(email: string) {
  const { data } = await supabaseAdmin
    .from("user_pins")
    .select("id, email, textbee_api_key, textbee_device_id")
    .ilike("email", email)
    .eq("is_active", true)
    .single()
  return data
}

async function pinById(id: string) {
  const { data } = await supabaseAdmin
    .from("user_pins")
    .select("id, email, textbee_api_key, textbee_device_id")
    .eq("id", id)
    .single()
  return data
}

// GET — current agent's (or, for an admin, the impersonated user's) TextBee status + inbound
export async function GET(req: NextRequest) {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const asPinId = req.nextUrl.searchParams.get("asPinId")
  const target = asPinId ? await resolveImpersonationTarget(asPinId) : null
  if (asPinId && !target) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const pin = target ? await pinById(target.pinId) : await pinForUser(email)
  const apiKey = pin?.textbee_api_key || ""
  const deviceId = pin?.textbee_device_id || ""
  const connected = !!(apiKey && deviceId)

  // Inbound SMS feed REMOVED 2026-06-19 (privacy): we no longer pull an agent's
  // received texts into the dashboard — their phone carries personal messages too.
  // Sending + connection status stay; STOP/opt-out scanning runs server-side only.
  const messages: never[] = []

  return NextResponse.json({
    connected,
    deviceId: deviceId ? `…${deviceId.slice(-6)}` : "",
    apiKeyMasked: apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : "",
    messages,
  })
}

// POST — save the agent's own TextBee credentials to their pin
export async function POST(req: NextRequest) {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const apiKey = String(body?.apiKey || "").trim()
  const deviceId = String(body?.deviceId || "").trim()
  if (!apiKey || !deviceId) {
    return NextResponse.json({ error: "Both API key and Device ID are required" }, { status: 400 })
  }

  const asPinId = String(body?.asPinId || "")
  const target = asPinId ? await resolveImpersonationTarget(asPinId) : null
  if (asPinId && !target) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const pin = target ? await pinById(target.pinId) : await pinForUser(email)
  if (!pin) {
    return NextResponse.json({ error: "No active operator profile found for your account. Contact support." }, { status: 404 })
  }

  // Validate the credentials against TextBee before saving.
  try {
    const test = await fetch(`${TEXTBEE_BASE}/${deviceId}/get-received-sms?page=1`, {
      headers: { "x-api-key": apiKey, "User-Agent": BROWSER_UA },
    })
    if (test.status === 401 || test.status === 403) {
      return NextResponse.json({ error: "TextBee rejected those credentials. Double-check the API key and Device ID." }, { status: 400 })
    }
  } catch {
    // network hiccup — allow save, the page status will reflect reality
  }

  const { error } = await supabaseAdmin
    .from("user_pins")
    .update({ textbee_api_key: apiKey, textbee_device_id: deviceId })
    .eq("id", pin.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyAccountActivity(email || "unknown", "Connected TextBee")
  return NextResponse.json({ success: true })
}
