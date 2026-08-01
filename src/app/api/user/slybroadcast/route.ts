import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"
import { sendVoiceUploadRequestEmail } from "@/lib/agent-voice-automation"
import { resolveCallerEmails } from "@/lib/caller-identity"

export const dynamic = "force-dynamic"

async function pinForUser(email: string | string[]) {
  // Dup pins can exist per email — never .single() (throws). Prefer the pin that
  // already has SlyBroadcast creds, else the first active one.
  // Takes EVERY address on the caller's Clerk account: [0] is not guaranteed to
  // be the one that owns the pin, and creds saved against the wrong email land on
  // nothing, so voice drops stay dark with no error the agent can see.
  const emails = (Array.isArray(email) ? email : [email]).filter(Boolean)
  for (const e of emails) {
    const { data } = await supabaseAdmin
      .from("user_pins")
      .select("id, email, slybroadcast_email, slybroadcast_password")
      .ilike("email", e)
      .eq("is_active", true)
    const rows = data || []
    const best = rows.find((r) => r.slybroadcast_email && r.slybroadcast_password) || rows[0]
    if (best) return best
  }
  return null
}

async function pinById(id: string) {
  const { data } = await supabaseAdmin
    .from("user_pins")
    .select("id, email, slybroadcast_email, slybroadcast_password")
    .eq("id", id)
    .single()
  return data
}

// GET — current agent's (or impersonated user's) SlyBroadcast connection status
export async function GET(req: NextRequest) {
  const user = await currentUser()
  const callerEmails = resolveCallerEmails(user)
  const email = callerEmails[0]
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const asPinId = req.nextUrl.searchParams.get("asPinId")
  const target = asPinId ? await resolveImpersonationTarget(asPinId) : null
  if (asPinId && !target) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const pin = target ? await pinById(target.pinId) : await pinForUser(callerEmails)

  const sbEmail = pin?.slybroadcast_email || ""
  const sbPass = pin?.slybroadcast_password || ""
  return NextResponse.json({
    connected: !!(sbEmail && sbPass),
    emailMasked: sbEmail,
  })
}

// POST — save the agent's own SlyBroadcast credentials to their pin
export async function POST(req: NextRequest) {
  const user = await currentUser()
  const callerEmails = resolveCallerEmails(user)
  const email = callerEmails[0]
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const sbEmail = String(body?.email || "").trim()
  const sbPass = String(body?.password || "").trim()
  if (!sbEmail || !sbPass) {
    return NextResponse.json({ error: "Both SlyBroadcast email and password are required" }, { status: 400 })
  }

  const asPinId = String(body?.asPinId || "")
  const target = asPinId ? await resolveImpersonationTarget(asPinId) : null
  if (asPinId && !target) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const pin = target ? await pinById(target.pinId) : await pinForUser(callerEmails)
  if (!pin) {
    return NextResponse.json({ error: "No active operator profile found for your account. Contact support." }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from("user_pins")
    .update({ slybroadcast_email: sbEmail, slybroadcast_password: sbPass })
    .eq("id", pin.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyAccountActivity(email, "Connected SlyBroadcast")
  // Automation: ask the agent to upload a voice sample so we can clone their voice
  // and make every drop personalized. Best-effort — never block connecting.
  await sendVoiceUploadRequestEmail(email)
  return NextResponse.json({ success: true })
}
