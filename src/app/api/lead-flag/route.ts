import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

// Agent-driven lead designation. Lets an operator mark a bad email/phone (turns it red,
// skipped in outreach) or mark the whole lead bad/dead so they can re-sort their inventory.
// Per-lead columns on foreclosure_leads (leads are exclusive — one lead = one agent).
const ALLOWED: Record<string, string> = {
  bad_email: "bad_email",
  bad_phone: "bad_phone",
  agent_status: "agent_status", // null = active, or "bad" | "dead"
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    leadId?: string
    pinId?: string
    field?: string
    value?: unknown
  }
  const { leadId, pinId, field } = body
  if (!leadId || !pinId || !field) {
    return NextResponse.json({ error: "leadId, pinId and field are required" }, { status: 400 })
  }
  const column = ALLOWED[field]
  if (!column) return NextResponse.json({ error: "Invalid field" }, { status: 400 })

  // Ownership: the lead must be assigned to this operator.
  const { data: assignment } = await supabaseAdmin
    .from("operator_lead_assignments")
    .select("lead_id")
    .eq("lead_id", leadId)
    .eq("operator_pin_id", pinId)
    .maybeSingle()
  if (!assignment) {
    return NextResponse.json({ error: "Lead is not assigned to this operator" }, { status: 403 })
  }

  let value: boolean | string | null
  if (field === "agent_status") {
    const v = String(body.value || "")
    value = v === "bad" || v === "dead" ? v : null // anything else clears it (restore to active)
  } else {
    value = Boolean(body.value)
  }

  const { error } = await supabaseAdmin
    .from("foreclosure_leads")
    .update({ [column]: value })
    .eq("id", leadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
