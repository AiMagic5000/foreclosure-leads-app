import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

// Per-lead, per-operator notes. Stored in public.lead_notes (PK lead_id+operator_pin_id),
// so notes persist across sessions for every lead the operator has — issued or imported.

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const leadId = request.nextUrl.searchParams.get("leadId")
  const pinId = request.nextUrl.searchParams.get("pinId")
  if (!leadId || !pinId) {
    return NextResponse.json({ error: "leadId and pinId are required" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("lead_notes")
    .select("notes, updated_at")
    .eq("lead_id", leadId)
    .eq("operator_pin_id", pinId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data?.notes || "", updatedAt: data?.updated_at || null })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    leadId?: string
    pinId?: string
    notes?: string
  }
  const { leadId, pinId } = body
  const notes = typeof body.notes === "string" ? body.notes : ""
  if (!leadId || !pinId) {
    return NextResponse.json({ error: "leadId and pinId are required" }, { status: 400 })
  }
  if (notes.length > 20000) {
    return NextResponse.json({ error: "Notes too long" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("lead_notes")
    .upsert(
      { lead_id: leadId, operator_pin_id: pinId, notes, updated_at: new Date().toISOString() },
      { onConflict: "lead_id,operator_pin_id" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
