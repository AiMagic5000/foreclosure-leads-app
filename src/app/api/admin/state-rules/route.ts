import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { clearStateRuleCache } from "@/lib/surplus/state-rules"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
export const dynamic = "force-dynamic"

async function adminCheck(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  return email === ADMIN_EMAIL.toLowerCase() ? email : null
}

// GET /api/admin/state-rules — full surplus_state_rules grid
export async function GET() {
  const admin = await adminCheck()
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from("surplus_state_rules")
    .select("*")
    .order("state", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const verified = (data || []).filter((r: { legal_status: string }) => r.legal_status === "verified").length
  return NextResponse.json({ success: true, rules: data || [], total: data?.length || 0, verified, unverified: (data?.length || 0) - verified })
}

// PATCH /api/admin/state-rules  { state, fields }  — update a row; flipping legal_status='verified'
// stamps verified_date + verified_by. Editable fields are whitelisted.
const EDITABLE = new Set([
  "foreclosure_type", "covers", "claim_deadline_text", "claim_deadline_months",
  "fund_holder", "venue_text", "nonattorney_recovery_allowed", "fee_cap_pct",
  "fee_cap_text", "solicitation_restrictions", "statute_refs", "legal_status",
  "research_confidence", "notes",
])

export async function PATCH(request: NextRequest) {
  const admin = await adminCheck()
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 })

  const body = await request.json()
  const state = String(body?.state || "").toUpperCase()
  if (state.length !== 2) return NextResponse.json({ error: "valid 2-letter state required" }, { status: 400 })

  const fields = body?.fields && typeof body.fields === "object" ? body.fields : {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(fields)) {
    if (EDITABLE.has(k)) update[k] = v
  }
  if (update.legal_status === "verified") {
    update.verified_date = new Date().toISOString().slice(0, 10)
    update.verified_by = admin
  }

  const { data, error } = await supabaseAdmin
    .from("surplus_state_rules")
    .update(update)
    .eq("state", state)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  clearStateRuleCache()
  return NextResponse.json({ success: true, rule: data })
}
