import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com").toLowerCase()

/**
 * Delete a lead the agent IMPORTED themselves. Hard rule: an agent can only
 * delete their own imported leads (source `imported:<type>:<pinId>`), never a
 * company/pipeline lead. Admin can delete any lead. Removes the assignment and
 * the lead row (imported leads are exclusive to the importer, so no other agent
 * loses data).
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await currentUser()
  const email = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress)
  const isAdmin = email === ADMIN_EMAIL

  const body = await request.json().catch(() => ({}))
  const leadId = String(body?.leadId || "").trim()
  const operatorPinId = String(body?.operatorPinId || "").trim()
  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 })

  // Load the lead's source to classify it.
  const { data: lead } = await supabaseAdmin
    .from("foreclosure_leads")
    .select("id, source")
    .eq("id", leadId)
    .single()
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  const source = String(lead.source || "")
  const isImported = source.startsWith("imported:")

  if (!isAdmin) {
    // Non-admins may ONLY delete their own imported leads.
    if (!isImported) {
      return NextResponse.json(
        { error: "Only leads you imported can be deleted. Company-provided leads cannot be removed." },
        { status: 403 }
      )
    }
    // Verify the caller owns the pin the lead was imported under.
    // Imported source is `imported:<type>:<pinId>` — the trailing segment is the pin.
    const importedPin = source.split(":").pop() || ""
    if (!operatorPinId || importedPin !== operatorPinId) {
      return NextResponse.json({ error: "This is not one of your imported leads." }, { status: 403 })
    }
    const { data: pinRow } = await supabaseAdmin
      .from("user_pins")
      .select("email")
      .eq("id", operatorPinId)
      .single()
    // canonicalEmail folds merged logins; matches the resolver used everywhere else.
    const owns = !!pinRow && canonicalEmail(pinRow.email) === email
    if (!owns) {
      return NextResponse.json({ error: "This is not one of your imported leads." }, { status: 403 })
    }
  }

  // Remove the assignment(s) then the lead row.
  await supabaseAdmin.from("operator_lead_assignments").delete().eq("lead_id", leadId)
  const { error: delErr } = await supabaseAdmin.from("foreclosure_leads").delete().eq("id", leadId)
  if (delErr) {
    return NextResponse.json({ error: `Delete failed: ${delErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: leadId })
}
