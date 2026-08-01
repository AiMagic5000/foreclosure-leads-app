import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveOperatorConfig } from "@/lib/operator-config"
import { isRequestAdmin } from "@/lib/admin-guard"

const ADMIN_EMAIL_LOWER = "coreypearsonemail@gmail.com"

// Paid plans allowed to import their OWN leads. "basic"/"free_webcast" are NOT paid.
const PAID_PACKAGES = new Set([
  "partnership",
  "junior_owner_operator",
  "owner_operator",
  "admin",
])

// Canonical field keys the client maps CSV columns to. Agents often bring rich
// lists from other sources, so we accept a full name OR first/last, a separate
// mailing/current address, and up to three phones + three emails — everything
// gets imported (extras fan out into the phone_numbers/email_addresses arrays).
type CanonicalRow = {
  owner_name?: string
  first_name?: string
  last_name?: string
  property_address?: string
  mailing_address?: string
  city?: string
  state?: string
  state_abbr?: string
  zip_code?: string
  county?: string
  primary_phone?: string
  secondary_phone?: string
  phone_3?: string
  primary_email?: string
  secondary_email?: string
  email_3?: string
  amount?: string
  case_number?: string
  notes?: string
}

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim()
}

// Collect non-empty, de-duplicated values (used for the phone / email lists).
function collectList(...vals: unknown[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of vals) {
    const s = clean(v)
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase())
      out.push(s)
    }
  }
  return out
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

    // Gate: paid plans only. Basic / free are rejected with an upgrade prompt.
    // Paid agents may import THEIR OWN leads (and have them show in My Leads).
    // Company-pipeline assignment stays admin-only (Fresh Leads / leads-assign).
    if (!isAdminUser && !PAID_PACKAGES.has(config.packageType)) {
      return NextResponse.json({ error: "upgrade_required" }, { status: 403 })
    }

    const operatorPinId = config.pinId
    const assignedBy = isAdminUser ? "admin" : userEmail
    const source = `imported:${leadType}:${operatorPinId || "admin"}`
    const nowIso = new Date().toISOString()

    // Dedupe: never create a duplicate of a lead this operator already has.
    // Re-importing the same file must NOT spawn duplicate rows — doing so also
    // orphans the agent's notes/progress on the original copy. An agent's leads
    // are theirs; we don't duplicate or overwrite them. Match on property address
    // (strong identity), else owner name + phone.
    const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim()
    const dkey = (addr: string, name: string, phone: string) => {
      const a = norm(addr)
      if (a) return "a:" + a
      return "np:" + norm(name) + "|" + (phone || "").replace(/\D/g, "")
    }
    const seenKeys = new Set<string>()
    if (operatorPinId) {
      const { data: assigns } = await supabaseAdmin
        .from("operator_lead_assignments")
        .select("lead_id")
        .eq("operator_pin_id", operatorPinId)
        .eq("status", "active")
      const leadIds = (assigns || []).map((a: { lead_id: string }) => a.lead_id).filter(Boolean)
      for (let j = 0; j < leadIds.length; j += 1000) {
        const { data: exist } = await supabaseAdmin
          .from("foreclosure_leads")
          .select("property_address, owner_name, primary_phone")
          .in("id", leadIds.slice(j, j + 1000))
        for (const l of exist || []) {
          seenKeys.add(dkey(l.property_address || "", l.owner_name || "", l.primary_phone || ""))
        }
      }
    }

    let imported = 0
    let skipped = 0
    let duplicates = 0
    const errors: string[] = []
    // Returned so the UI can offer one-click skip tracing on exactly this batch.
    const leadIds: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || {}
      // Name: prefer an explicit full name; otherwise stitch first + last.
      const ownerName = clean(row.owner_name) || [clean(row.first_name), clean(row.last_name)].filter(Boolean).join(" ")
      const propertyAddress = clean(row.property_address)
      const mailingAddress = clean(row.mailing_address)
      // Phones / emails: any of the mapped columns; extras go into the arrays.
      const phones = collectList(row.primary_phone, row.secondary_phone, row.phone_3)
      const emails = collectList(row.primary_email, row.secondary_email, row.email_3).map((e) => e.toLowerCase())

      // Skip rows with no identifying data at all.
      if (!ownerName && !propertyAddress && !mailingAddress && phones.length === 0 && emails.length === 0) {
        skipped++
        continue
      }

      // Already have this lead (from a prior import or same file) — skip so we
      // don't duplicate the operator's list or bury their existing notes/progress.
      const key = dkey(propertyAddress, ownerName, phones[0] || "")
      if (seenKeys.has(key)) {
        duplicates++
        continue
      }
      seenKeys.add(key)

      const insertRow: Record<string, unknown> = {
        // owner_name is NOT NULL in the schema -- never insert null.
        owner_name: ownerName || "Unknown Owner",
        property_address: propertyAddress || null,
        mailing_address: mailingAddress || null,
        city: clean(row.city) || null,
        state: clean(row.state) || null,
        state_abbr: clean(row.state_abbr).toUpperCase() || null,
        zip_code: clean(row.zip_code) || null,
        county: clean(row.county) || null,
        primary_phone: phones[0] || null,
        secondary_phone: phones[1] || null,
        // Keep every phone/email the agent provided (arrays), not just the first.
        phone_numbers: phones.length ? phones : null,
        primary_email: emails[0] || null,
        email_addresses: emails.length ? emails : null,
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
      leadIds.push(newLeadId)
    }

    return NextResponse.json({ imported, skipped, duplicates, errors, leadIds })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
