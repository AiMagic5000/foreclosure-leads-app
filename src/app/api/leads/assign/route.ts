import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

// Map operator pin IDs to their company agent email for email drafts/templates
const OPERATOR_AGENT_EMAIL: Record<string, string> = {
  "afa2241b-2d24-43d4-a4b6-7f073d1d696f": "rebecca@usforeclosurerecovery.com",
  "2afaac84-4c21-49fd-91ec-783f3c1c1dc5": "joshua@usforeclosurerecovery.com",
  "b0feeac4-2992-497b-9273-35a80a76b8b6": "contact@premiersurplusclaims.com",
}

async function verifyAdmin(): Promise<{ authorized: boolean; email?: string; error?: string }> {
  const { userId } = await auth()
  if (!userId) {
    return { authorized: false, error: "Unauthorized" }
  }
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
    return { authorized: false, error: "Admin access required" }
  }
  return { authorized: true, email }
}

// GET: Fetch assigned leads for an operator
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const pinId = request.nextUrl.searchParams.get("pinId")
  if (!pinId) {
    return NextResponse.json({ error: "pinId is required" }, { status: 400 })
  }

  // Verify the pinId belongs to the requesting user or user is admin
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  const isAdmin = email === ADMIN_EMAIL.toLowerCase()

  if (!isAdmin) {
    // Verify the pin belongs to this user
    const { data: pinRow } = await supabaseAdmin
      .from("user_pins")
      .select("email")
      .eq("id", pinId)
      .single()

    if (!pinRow || pinRow.email?.toLowerCase() !== email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
  }

  // Use RPC function to fetch leads via JOIN (avoids .in() URL length limit with many leads)
  const { data: leads, error } = await supabaseAdmin
    .rpc("get_operator_leads", { p_pin_id: pinId })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }

  return NextResponse.json({ leads: leads || [] })
}

// POST: Assign leads to an operator (admin only)
export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin()
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.error }, { status: 403 })
  }

  const { leadIds, operatorPinId, notes } = await request.json()

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "leadIds array is required" }, { status: 400 })
  }

  if (!operatorPinId) {
    return NextResponse.json({ error: "operatorPinId is required" }, { status: 400 })
  }

  // Verify the operator exists and has owner_operator role
  const { data: operator } = await supabaseAdmin
    .from("user_pins")
    .select("id, email, role")
    .eq("id", operatorPinId)
    .single()

  if (!operator) {
    return NextResponse.json({ error: "Operator not found" }, { status: 404 })
  }

  // CRITICAL: Enforce lead exclusivity -- each lead can only belong to ONE agent
  // Check which leads are already assigned to ANY other agent
  const { data: existingAssignments } = await supabaseAdmin
    .from("operator_lead_assignments")
    .select("lead_id, operator_pin_id")
    .in("lead_id", leadIds)
    .eq("status", "active")

  const alreadyAssigned = (existingAssignments || [])
    .filter((a) => a.operator_pin_id !== operatorPinId)
    .map((a) => a.lead_id)

  const availableLeadIds = leadIds.filter(
    (id: string) => !alreadyAssigned.includes(id)
  )

  if (availableLeadIds.length === 0) {
    return NextResponse.json({
      error: "All requested leads are already assigned to other agents",
      alreadyAssignedCount: alreadyAssigned.length,
    }, { status: 409 })
  }

  // Build insert rows (only unassigned leads)
  const rows = availableLeadIds.map((leadId: string) => ({
    lead_id: leadId,
    operator_pin_id: operatorPinId,
    assigned_by: adminCheck.email,
    notes: notes || null,
  }))

  const { data, error } = await supabaseAdmin
    .from("operator_lead_assignments")
    .upsert(rows, { onConflict: "lead_id" })
    .select("id")

  if (error) {
    return NextResponse.json({ error: "Failed to assign leads" }, { status: 500 })
  }

  // Set agent_email on the leads so email drafts use the correct agent profile
  const agentEmail = OPERATOR_AGENT_EMAIL[operatorPinId]
  if (agentEmail && availableLeadIds.length > 0) {
    await supabaseAdmin
      .from("foreclosure_leads")
      .update({ agent_email: agentEmail })
      .in("id", availableLeadIds)
  }

  return NextResponse.json({
    success: true,
    assigned: data?.length || 0,
    skippedAlreadyAssigned: alreadyAssigned.length,
    operatorEmail: operator.email,
  })
}

// DELETE: Remove lead assignments (admin only)
export async function DELETE(request: NextRequest) {
  const adminCheck = await verifyAdmin()
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.error }, { status: 403 })
  }

  const { assignmentIds } = await request.json()

  if (!assignmentIds || !Array.isArray(assignmentIds)) {
    return NextResponse.json({ error: "assignmentIds array is required" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("operator_lead_assignments")
    .delete()
    .in("id", assignmentIds)

  if (error) {
    return NextResponse.json({ error: "Failed to remove assignments" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
