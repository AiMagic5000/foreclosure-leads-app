import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

const AMARIYON_STATES = [
  "AL","AK","AZ","AR","GA","ID","MI","MN","MS","MO",
  "NE","NV","NH","OR","RI","TN","VA","WV","WY","TX",
]

export const dynamic = "force-dynamic"

async function adminCheck(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  return email === ADMIN_EMAIL.toLowerCase()
}

export async function GET(request: NextRequest) {
  if (!(await adminCheck())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const state = request.nextUrl.searchParams.get("state")?.toUpperCase()
  if (!state || !AMARIYON_STATES.includes(state)) {
    return NextResponse.json({ error: "Invalid or missing state" }, { status: 400 })
  }
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100", 10)

  const { data: candidates, error } = await supabaseAdmin
    .from("foreclosure_leads")
    .select(
      "id, owner_name, property_address, city, state_abbr, county, primary_phone, primary_email, dnc_checked, on_dnc, overage_amount, sale_date, source, status, lead_tier"
    )
    .eq("state_abbr", state)
    .in("status", ["new", "skip_traced", "contacted", "master", "diamond", "skip_trace_failed"])
    .gte("overage_amount", 5000)
    .order("overage_amount", { ascending: false, nullsFirst: false })
    .limit(Math.min(limit, 500))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: assignments } = await supabaseAdmin
    .from("operator_lead_assignments")
    .select("lead_id")
    .eq("status", "active")
  const assignedSet = new Set((assignments || []).map((r) => r.lead_id))

  const filtered = (candidates || []).filter((lead) => {
    if (assignedSet.has(lead.id)) return false
    const reachable =
      (lead.primary_email && lead.primary_email.trim() !== "") ||
      (lead.primary_phone && lead.dnc_checked && !lead.on_dnc)
    return reachable
  })

  return NextResponse.json({
    state,
    count: filtered.length,
    leads: filtered.slice(0, limit),
  })
}
