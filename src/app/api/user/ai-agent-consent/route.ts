import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendAdminNotification } from "@/lib/email"

export const dynamic = "force-dynamic"

// Current version of the AI Agent likeness/voice + electronic-communication consent.
// Bump this string whenever the agreement text on the tab changes so we can tell
// which version a given agent actually agreed to.
export const CONSENT_VERSION = "ai-agent-consent-2026-06-08"

// GET — has this agent already given consent (for the current version)?
export async function GET() {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ consented: false }, { status: 401 })

  const { data } = await supabaseAdmin
    .from("user_activity")
    .select("details, created_at")
    .eq("user_id", email)
    .eq("action", "ai_agent_consent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const consented = !!data && (data.details as { version?: string } | null)?.version === CONSENT_VERSION
  return NextResponse.json({ consented, at: data?.created_at || null })
}

// POST — record that the agent agreed to the likeness + electronic-comms consent.
export async function POST(req: NextRequest) {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body?.agreed !== true) {
    return NextResponse.json({ error: "Consent not granted" }, { status: 400 })
  }

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email
  const at = new Date().toISOString()

  const { error } = await supabaseAdmin.from("user_activity").insert({
    user_id: email,
    action: "ai_agent_consent",
    details: {
      version: CONSENT_VERSION,
      name,
      agreed: true,
      scope: ["sms", "email", "ringless_voicemail", "ai_outbound_agent"],
      at,
    },
  })
  if (error) return NextResponse.json({ error: "Could not record consent" }, { status: 500 })

  // Best-effort: tell the team an agent opted into the AI program so we can build
  // their voice clone + avatar. Never block the response on email delivery.
  sendAdminNotification(
    `AI Agent consent: ${name}`,
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
      <p><strong>${name}</strong> (${email}) agreed to the AI Agent likeness + electronic-communication consent.</p>
      <p>Version: ${CONSENT_VERSION}<br/>When: ${at}</p>
      <p>Scope: SMS, email, ringless voicemail, AI outbound agent.</p>
    </div>`
  ).catch(() => {})

  return NextResponse.json({ consented: true, at })
}
