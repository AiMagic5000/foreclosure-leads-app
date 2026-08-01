import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"
import { resolveCallerEmails, resolvePinForEmails } from "@/lib/caller-identity"

// Browser UA required — api.textbee.dev is behind Cloudflare (default UA => 1010/403).
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const TEXTBEE_BASE = "https://api.textbee.dev/api/v1/gateway/devices"

export const dynamic = "force-dynamic"

// Accepts a single address or every address on the caller's Clerk account.
// Never .single(): duplicate user_pins rows for one email nulled this out and
// returned "No active operator profile found for your account. Contact support."
// to real agents — which also made it impossible to connect TextBee at all, so
// texting could never be fixed from the agent's side.
async function pinForUser(email: string | string[]) {
  const emails = (Array.isArray(email) ? email : [email]).filter(Boolean)
  return resolvePinForEmails(emails, "id, email, textbee_api_key, textbee_device_id, package_type, is_active, slybroadcast_email")
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
  const callerEmails = resolveCallerEmails(user)
  const email = callerEmails[0]
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const asPinId = req.nextUrl.searchParams.get("asPinId")
  const target = asPinId ? await resolveImpersonationTarget(asPinId) : null
  if (asPinId && !target) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const pin = target ? await pinById(target.pinId) : await pinForUser(callerEmails)
  const apiKey = pin?.textbee_api_key || ""
  const deviceId = pin?.textbee_device_id || ""
  const connected = !!(apiKey && deviceId)

  // NEVER return the agent's inbound SMS. Their device carries their personal
  // messages, so pulling that feed onto our platform would expose private texts to
  // anyone with dashboard or admin access. Their replies belong in their own TextBee
  // app and nowhere else. Connection status and masked credentials only.
  return NextResponse.json({
    connected,
    deviceId: deviceId ? `…${deviceId.slice(-6)}` : "",
    apiKeyMasked: apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : "",
  })
}

// POST — save the agent's own TextBee credentials to their pin
export async function POST(req: NextRequest) {
  const user = await currentUser()
  const callerEmails = resolveCallerEmails(user)
  const email = callerEmails[0]
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
  const pin = target ? await pinById(target.pinId) : await pinForUser(callerEmails)
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
