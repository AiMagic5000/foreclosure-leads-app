import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"
import { resolveImpersonationTarget } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

// One-time UI notice acknowledgements, stored in user_activity keyed by the agent's
// canonical email (same pattern as social_link_setting). localStorage caches for
// instant UX; this server flag is the source of truth.
//
// Impersonation-aware: when an admin is viewing-as an agent (asPinId), the ack is
// checked/recorded against the AGENT's identity — so the admin preview reflects what
// that agent actually sees, and acking on their behalf marks the agent, not the admin.

async function effectiveEmail(asPinId: string | null): Promise<string | null> {
  if (asPinId) {
    const target = await resolveImpersonationTarget(asPinId) // returns null unless caller is admin
    if (target?.email) return canonicalEmail(target.email)
  }
  const user = await currentUser()
  const e = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress)
  return e && e !== "unknown" ? e : null
}

// GET /api/user/ack-notice?action=email_send_notice_ack[&asPinId=...] -> { acknowledged }
export async function GET(req: NextRequest) {
  const action = String(req.nextUrl.searchParams.get("action") || "").trim()
  if (!action) return NextResponse.json({ error: "action is required" }, { status: 400 })
  const email = await effectiveEmail(req.nextUrl.searchParams.get("asPinId"))
  if (!email) return NextResponse.json({ acknowledged: false }, { status: 401 })

  const { data } = await supabaseAdmin
    .from("user_activity")
    .select("id")
    .eq("user_id", email)
    .eq("action", action)
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ acknowledged: !!data })
}

// POST { action, asPinId? } -> records the acknowledgement (idempotent).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const action = String(body?.action || "").trim()
  if (!action) return NextResponse.json({ error: "action is required" }, { status: 400 })
  const email = await effectiveEmail(body?.asPinId ? String(body.asPinId) : null)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from("user_activity")
    .select("id")
    .eq("user_id", email)
    .eq("action", action)
    .limit(1)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabaseAdmin.from("user_activity").insert({
      user_id: email,
      action,
      details: { at: new Date().toISOString() },
    })
    if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })
  }

  return NextResponse.json({ acknowledged: true })
}
