import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveOperatorConfig } from "@/lib/operator-config"
import { isRequestAdmin } from "@/lib/admin-guard"

const ADMIN_EMAIL_LOWER = "coreypearsonemail@gmail.com"


// Canonical field keys the client maps CSV columns to.
type CanonicalRow = {
  owner_name?: string
  property_address?: string
  city?: string
  state?: string
  state_abbr?: string
  zip_code?: string
  county?: string
  primary_phone?: string
  primary_email?: string
  amount?: string
  case_number?: string
  notes?: string
}

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim()
}

// Parse a free-form money string ("$12,500.00", "12500") into a number, or null.
function parseAmount(raw: unknown): number | null {
  const s = clean(raw).replace(/[^0-9.\-]/g, "")
  if (!s) return null
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const leadType = clean(body?.leadType) || "imported"
    const rows: CanonicalRow[] = Array.isArray(body?.rows) ? body.rows : []

    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 })
    }

    // Resolve the importing operator (same pin/operator resolution used by the
    // SMS + email routes). Admins may impersonate via operatorPinId.
    const requesterIsAdmin = await isRequestAdmin()
    const config = await resolveOperatorConfig({
      requesterIsAdmin,
      clerkEmail: userEmail,
      operatorPinId: clean(body?.operatorPinId) || null,
      leadId: null,
    })

    // Must resolve to a real operator pin unless the caller is the primary admin.
    const isAdminUser = userEmail === ADMIN_EMAIL_LOWER
    if (!config.pinId && !isAdminUser) {
      return NextResponse.json(
        { error: "Could not resolve your agent profile. Please refresh the page and try again." },
        { status: 422 }
      )
    }

    // Gate: lead assignment is ADMIN-ONLY. Importing creates operator_lead_assignments
    // (it assigns the imported leads to an operator), so only the primary admin may do
    // it — agents can no longer self-import/self-assign leads.
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Lead assignment is handled by the admin. Contact support to have leads added to your account." },
        { status: 403 }
      )
    }

    const operatorPinId = config.pinId
    const assignedBy = isAdminUser ? "admin" : userEmail
    const source = `imported:${leadType}:${operatorPinId || "admin"}`
    const nowIso = new Date().toISOString()

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || {}
      const ownerName = clean(row.owner_name)
      const propertyAddress = clean(row.property_address)
      const primaryPhone = clean(row.primary_phone)
      const primaryEmail = clean(row.primary_email)

      // Skip rows with no identifying data at all.
      if (!ownerName && !propertyAddress && !primaryPhone && !primaryEmail) {
        skipped++
        continue
      }

      const insertRow: Record<string, unknown> = {
        // owner_name is NOT NULL in the schema -- never insert null.
        owner_name: ownerName || "Unknown Owner",
        property_address: propertyAddress,
        city: clean(row.city) || null,
        state: clean(row.state) || null,
        state_abbr: clean(row.state_abbr).toUpperCase() || null,
        zip_code: clean(row.zip_code) || null,
        county: clean(row.county) || null,
        primary_phone: primaryPhone || null,
        primary_email: primaryEmail || null,
        overage_amount: parseAmount(row.amount),
        case_number: clean(row.case_number) || null,
        // notes has no dedicated column on foreclosure_leads; carry it on the
        // assignment row instead (see below).
        source,
        lead_type: leadType,
        status: "new",
        scraped_at: nowIso,
        // Imported leads are the operator's own list. Mark DNC-checked so the
        // assignment trigger (enforce_dnc_on_assignment) allows the assignment.
        dnc_checked: true,
        on_dnc: false,
        can_contact: true,
      }

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("foreclosure_leads")
        .insert(insertRow)
        .select("id")
        .single()

      if (insertErr || !inserted?.id) {
        skipped++
        errors.push(`Row ${i + 1}: insert failed${insertErr ? ` (${insertErr.message})` : ""}`)
        continue
      }

      const newLeadId = String(inserted.id)

      // Assign the brand-new lead to the importing operator so it shows in
      // "My Leads". New id => no UNIQUE(lead_id) conflict. Admin imports without
      // a resolved pin are inserted but left unassigned.
      if (operatorPinId) {
        const { error: assignErr } = await supabaseAdmin
          .from("operator_lead_assignments")
          .insert({
            lead_id: newLeadId,
            operator_pin_id: operatorPinId,
            assigned_by: assignedBy,
            assigned_at: nowIso,
            status: "active",
            notes: clean(row.notes) || null,
          })

        if (assignErr) {
          errors.push(`Row ${i + 1}: imported but assignment failed (${assignErr.message})`)
        }
      }

      imported++
    }

    return NextResponse.json({ imported, skipped, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
