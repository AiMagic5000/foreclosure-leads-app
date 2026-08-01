import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com").toLowerCase()

/**
 * Agent-found contact info. Lets the ASSIGNED agent add an email or phone they
 * researched onto their lead (company-provided or imported) so outreach can use
 * it. Rules:
 *  - caller must own the lead's assignment (or be admin)
 *  - blacklisted emails/phones are rejected (opt-outs stay opted out)
 *  - email: fills primary_email if empty, else appended to email_addresses
 *  - phone: fills primary_phone if empty BUT resets dnc_checked=false /
 *    can_contact=false (a fresh number must pass DNC scrub before voice/SMS);
 *    if a primary already exists it is appended to phone_numbers only.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await currentUser()
  // Clerk does not guarantee emailAddresses[0] is the primary. An agent who signs
  // in with a second address (e.g. their company mailbox) can land with the
  // non-pin address at [0] and get "This lead is not assigned to you." on a lead
  // they own. Collect every verified address, canonicalised, and match on any.
  const callerEmails = Array.from(
    new Set(
      [
        user?.emailAddresses?.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress,
        ...(user?.emailAddresses ?? []).map((e) => e.emailAddress),
      ]
        .filter(Boolean)
        .map((e) => canonicalEmail(String(e)))
    )
  )
  const callerEmail = callerEmails[0]
  const isAdmin = callerEmails.includes(ADMIN_EMAIL)

  const body = await request.json().catch(() => ({}))
  const leadId = String(body?.leadId || "").trim()
  const pinId = String(body?.operatorPinId || "").trim()
  const kind = String(body?.kind || "").trim() // "email" | "phone"
  const rawValue = String(body?.value || "").trim()
  if (!leadId || !kind || !rawValue) {
    return NextResponse.json({ error: "leadId, kind and value are required" }, { status: 400 })
  }

  // Ownership: the lead must be assigned to the caller's pin (admin bypasses).
  if (!isAdmin) {
    const { data: assignment } = await supabaseAdmin
      .from("operator_lead_assignments")
      .select("operator_pin_id")
      .eq("lead_id", leadId)
      .single()
    if (!assignment || assignment.operator_pin_id !== pinId) {
      return NextResponse.json({ error: "This lead is not assigned to you." }, { status: 403 })
    }
    const { data: pinRow } = await supabaseAdmin
      .from("user_pins")
      .select("email")
      .eq("id", pinId)
      .single()
    if (!pinRow || !callerEmails.includes(canonicalEmail(pinRow.email))) {
      return NextResponse.json({ error: "This lead is not assigned to you." }, { status: 403 })
    }
  }

  const { data: lead } = await supabaseAdmin
    .from("foreclosure_leads")
    .select("id, primary_email, email_addresses, primary_phone, secondary_phone, phone_numbers")
    .eq("id", leadId)
    .single()
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  if (kind === "email") {
    const email = rawValue.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "That doesn't look like a valid email address." }, { status: 400 })
    }
    const { data: bl } = await supabaseAdmin
      .from("email_blacklist").select("email").eq("email", email).limit(1)
    if (bl && bl.length > 0) {
      return NextResponse.json({ error: "That email has opted out of communications and can't be added." }, { status: 409 })
    }
    const existing: string[] = (lead.email_addresses || []).map((e: string) => e.toLowerCase())
    if (lead.primary_email?.toLowerCase() === email || existing.includes(email)) {
      return NextResponse.json({ error: "That email is already on this lead." }, { status: 409 })
    }
    const update: Record<string, unknown> = {
      email_addresses: [...(lead.email_addresses || []), email],
    }
    if (!lead.primary_email) update.primary_email = email
    const { error } = await supabaseAdmin.from("foreclosure_leads").update(update).eq("id", leadId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, primaryEmail: update.primary_email || lead.primary_email })
  }

  if (kind === "phone") {
    const digits = rawValue.replace(/\D/g, "").slice(-10)
    if (digits.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit US phone number." }, { status: 400 })
    }
    const variants = [digits, "1" + digits, "+1" + digits]
    const { data: bl } = await supabaseAdmin
      .from("phone_blacklist").select("phone_number").in("phone_number", variants).limit(1)
    if (bl && bl.length > 0) {
      return NextResponse.json({ error: "That number has opted out of communications and can't be added." }, { status: 409 })
    }
    const norm = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-10)
    const existing: string[] = (lead.phone_numbers || []).map((p: string) => norm(p))
    if (norm(lead.primary_phone) === digits || norm(lead.secondary_phone) === digits || existing.includes(digits)) {
      return NextResponse.json({ error: "That phone number is already on this lead." }, { status: 409 })
    }
    const pretty = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    const update: Record<string, unknown> = {
      phone_numbers: [...(lead.phone_numbers || []), pretty],
    }
    let dncNote = false
    if (!lead.primary_phone) {
      // Fresh number on a phone-less lead: usable for records immediately, but it
      // must pass DNC scrub before voice drops / SMS light up.
      update.primary_phone = pretty
      update.dnc_checked = false
      update.can_contact = false
      dncNote = true
    } else if (!lead.secondary_phone) {
      update.secondary_phone = pretty
    }
    const { error } = await supabaseAdmin.from("foreclosure_leads").update(update).eq("id", leadId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, primaryPhone: update.primary_phone || lead.primary_phone, dncPending: dncNote })
  }

  return NextResponse.json({ error: "kind must be email or phone" }, { status: 400 })
}
