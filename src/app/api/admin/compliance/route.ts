import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
export const dynamic = "force-dynamic"

async function adminCheck(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const user = await currentUser()
  return user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// GET /api/admin/compliance — compliance monitor feed:
// gate document counts, recent would-block events, failing-check frequency, copy reviews, state verification status.
export async function GET() {
  if (!(await adminCheck())) return NextResponse.json({ error: "Admin only" }, { status: 403 })

  try {
    const [docsRes, blocksRes, reviewsRes, rulesRes] = await Promise.all([
      supabaseAdmin.from("generated_documents").select("gate_passed, gate_blocked, gate_mode, state, created_at").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("send_blocks").select("*").order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("outreach_copy_reviews").select("id, agent_id, passed, violations, created_at").order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("surplus_state_rules").select("state, legal_status, nonattorney_recovery_allowed, fee_cap_pct, research_confidence"),
    ])

    const docs = docsRes.data || []
    const blocks = blocksRes.data || []
    const reviews = reviewsRes.data || []
    const rules = rulesRes.data || []

    // Tally failing checks across recent blocks.
    const checkTally: Record<string, number> = {}
    const stateTally: Record<string, number> = {}
    for (const b of blocks) {
      const state = (b as { state?: string }).state || "??"
      stateTally[state] = (stateTally[state] || 0) + 1
      const fails = (b as { failed_checks?: Array<{ name?: string }> }).failed_checks || []
      for (const f of fails) {
        const name = f?.name || "unknown"
        checkTally[name] = (checkTally[name] || 0) + 1
      }
    }

    const verifiedStates = rules.filter((r: { legal_status: string }) => r.legal_status === "verified").length
    const blockingStates = rules.filter((r: { nonattorney_recovery_allowed: string }) => r.nonattorney_recovery_allowed === "no").map((r: { state: string }) => r.state)

    return NextResponse.json({
      success: true,
      summary: {
        documents_total: docs.length,
        documents_would_pass: docs.filter((d: { gate_passed: boolean }) => d.gate_passed).length,
        documents_would_block: docs.filter((d: { gate_passed: boolean }) => !d.gate_passed).length,
        documents_actually_blocked: docs.filter((d: { gate_blocked: boolean }) => d.gate_blocked).length,
        gate_mode: (docs[0] as { gate_mode?: string })?.gate_mode || "shadow",
        states_total: rules.length,
        states_verified: verifiedStates,
        states_unverified: rules.length - verifiedStates,
        attorney_only_states: blockingStates,
        copy_reviews_total: reviews.length,
        copy_reviews_failed: reviews.filter((r: { passed: boolean }) => !r.passed).length,
      },
      top_failing_checks: Object.entries(checkTally).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
      blocks_by_state: Object.entries(stateTally).sort((a, b) => b[1] - a[1]).map(([state, count]) => ({ state, count })),
      recent_blocks: blocks.slice(0, 30),
      recent_copy_reviews: reviews,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 })
  }
}
