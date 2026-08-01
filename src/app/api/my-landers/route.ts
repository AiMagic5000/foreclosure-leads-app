import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"
import { resolveImpersonationTarget } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

// Returns the caller's marketing lander URLs (agent page + claim-with lander)
// for the My Account tab. Both are set by the avatar/onboarding automation.
// Admins viewing-as an agent pass ?asPinId= (verified server-side) so the card
// shows the AGENT's links, not the admin's.
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const asPinId = new URL(req.url).searchParams.get("asPinId")
  const target = await resolveImpersonationTarget(asPinId)

  try {
    if (target) {
      const { data } = await supabaseAdmin
        .from("user_pins")
        .select("agent_page_url, claim_lander_url")
        .eq("id", target.pinId)
        .maybeSingle()
      return NextResponse.json({
        agentPageUrl: (data as { agent_page_url?: string | null } | null)?.agent_page_url || null,
        claimLanderUrl: (data as { claim_lander_url?: string | null } | null)?.claim_lander_url || null,
      })
    }

    const user = await currentUser()
    const email = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress) || ""
    if (!email) return NextResponse.json({ agentPageUrl: null, claimLanderUrl: null })

    const { data } = await supabaseAdmin
      .from("user_pins")
      .select("agent_page_url, claim_lander_url")
      .ilike("email", email)
      .eq("is_active", true)
      .maybeSingle()
    return NextResponse.json({
      agentPageUrl: (data as { agent_page_url?: string | null } | null)?.agent_page_url || null,
      claimLanderUrl: (data as { claim_lander_url?: string | null } | null)?.claim_lander_url || null,
    })
  } catch {
    return NextResponse.json({ agentPageUrl: null, claimLanderUrl: null })
  }
}
