import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveOperatorConfig } from "@/lib/operator-config"
import { isRequestAdmin } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Agent-facing skip trace for IMPORTED leads (the admin /api/skip-trace stays admin-only
// and batch-oriented). The Import success screen posts the freshly imported leadIds here;
// we verify every one belongs to THIS agent, submit the phone-less ones to Tracerfy in a
// single trace job, and flag them for the nightly DNC scrub. Phones + DNC status then
// flow onto the leads automatically via the existing results/scrub pipeline.
const ADMIN_EMAIL_LOWER = "coreypearsonemail@gmail.com"
const TRACERFY_API_KEY = process.env.TRACERFY_API_KEY || ""
const TRACERFY_BASE = process.env.TRACERFY_API_URL || "https://tracerfy.com/v1/api"
const PAID_PACKAGES = new Set(["partnership", "junior_owner_operator", "owner_operator", "admin"])
const MAX_BATCH = 200

const US_STATES: Record<string, string> = {
  illinois:"IL",indiana:"IN",iowa:"IA",ohio:"OH",georgia:"GA",florida:"FL",texas:"TX",alabama:"AL",arkansas:"AR",
  missouri:"MO",california:"CA","new york":"NY",michigan:"MI",wisconsin:"WI",minnesota:"MN",kentucky:"KY",tennessee:"TN",
  virginia:"VA","north carolina":"NC","south carolina":"SC",pennsylvania:"PA",maryland:"MD","new jersey":"NJ",kansas:"KS",
  oklahoma:"OK",nevada:"NV",arizona:"AZ",oregon:"OR",washington:"WA",colorado:"CO",mississippi:"MS",louisiana:"LA",
  nebraska:"NE",connecticut:"CT",massachusetts:"MA","new mexico":"NM",utah:"UT",idaho:"ID",montana:"MT",
}
// Agents often paste a full address into one field ("140 E Genessee St Leland ,Illinois 60531").
// Tracerfy needs street/city/state/zip split out, so parse them when the columns are empty.
function parseAddress(full: string): { street: string; city: string; state: string; zip: string } {
  const a = (full || "").replace(/\s+/g, " ").trim()
  const zipM = a.match(/(\d{5})(?:-\d{4})?\s*$/)
  const zip = zipM ? zipM[1] : ""
  const a2 = zipM ? a.slice(0, zipM.index).trim() : a
  let left = a2, stateRaw = ""
  const ci = a2.lastIndexOf(",")
  if (ci >= 0) { left = a2.slice(0, ci).trim(); stateRaw = a2.slice(ci + 1).trim() }
  else { const t = a2.split(" "); stateRaw = t[t.length - 1] || ""; left = t.slice(0, -1).join(" ") }
  const state = US_STATES[stateRaw.toLowerCase()] || stateRaw.slice(0, 2).toUpperCase()
  const lt = left.trim().split(" ")
  const city = lt.length ? lt[lt.length - 1].replace(/,$/, "") : ""
  const street = lt.length > 1 ? lt.slice(0, -1).join(" ") : left
  return { street: street.replace(/[ ,]+$/, ""), city, state, zip }
}

function splitOwnerName(full: string): { first: string; last: string } {
  const parts = (full || "").trim().split(/\s+/)
  if (parts.length <= 1) return { first: parts[0] || "", last: "" }
  return { first: parts[0], last: parts[parts.length - 1] }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!TRACERFY_API_KEY) {
      return NextResponse.json({ error: "Skip tracing is temporarily unavailable" }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const requestedIds: string[] = Array.isArray(body?.leadIds) ? body.leadIds.slice(0, MAX_BATCH) : []
    if (requestedIds.length === 0) {
      return NextResponse.json({ error: "leadIds required" }, { status: 400 })
    }

    const requesterIsAdmin = await isRequestAdmin()
    const config = await resolveOperatorConfig({
      requesterIsAdmin,
      clerkEmail: userEmail,
      operatorPinId: null,
      leadId: null,
    })
    const isAdminUser = userEmail === ADMIN_EMAIL_LOWER
    if (!config.pinId && !isAdminUser) {
      return NextResponse.json({ error: "Could not resolve your agent profile" }, { status: 422 })
    }
    if (!isAdminUser && !PAID_PACKAGES.has(config.packageType)) {
      return NextResponse.json({ error: "upgrade_required" }, { status: 403 })
    }

    // Ownership gate: only leads actively assigned to THIS agent can be traced by them.
    let ownedIds = requestedIds
    if (!isAdminUser) {
      const { data: assigns } = await supabaseAdmin
        .from("operator_lead_assignments")
        .select("lead_id")
        .eq("operator_pin_id", config.pinId)
        .eq("status", "active")
        .in("lead_id", requestedIds)
      ownedIds = (assigns || []).map((a: { lead_id: string }) => a.lead_id)
    }
    if (ownedIds.length === 0) {
      return NextResponse.json({ error: "None of those leads are in your list" }, { status: 403 })
    }

    const { data: leads } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("id, owner_name, property_address, mailing_address, city, state_abbr, zip_code, primary_phone")
      .in("id", ownedIds)

    const traceable = (leads || []).filter(
      (l) => !l.primary_phone && (l.property_address || l.mailing_address) && l.owner_name,
    )
    const alreadyHavePhone = (leads || []).filter((l) => !!l.primary_phone)

    let queueId: string | null = null
    if (traceable.length > 0) {
      const jsonData = traceable.map((lead) => {
        const { first, last } = splitOwnerName(lead.owner_name || "")
        let street = lead.property_address || lead.mailing_address || ""
        let city = lead.city || "", state = lead.state_abbr || "", zip = lead.zip_code || ""
        if (!city || !state || !zip) {
          const p = parseAddress(street)
          if (!city) city = p.city
          if (!state) state = p.state
          if (!zip) zip = p.zip
          if (p.city && p.state) street = p.street  // only trim the address if we successfully split it
        }
        return { first_name: first, last_name: last, address: street, city, state, zip }
      })
      const formData = new FormData()
      formData.append("json_data", JSON.stringify(jsonData))
      formData.append("first_name_column", "first_name")
      formData.append("last_name_column", "last_name")
      formData.append("address_column", "address")
      formData.append("city_column", "city")
      formData.append("state_column", "state")
      formData.append("zip_column", "zip")
      formData.append("mail_address_column", "address")
      formData.append("mail_city_column", "city")
      formData.append("mail_state_column", "state")
      formData.append("mailing_zip_column", "zip")
      formData.append("trace_type", "normal")

      const traceRes = await fetch(`${TRACERFY_BASE}/trace/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TRACERFY_API_KEY}` },
        body: formData,
      })
      if (!traceRes.ok) {
        const errText = (await traceRes.text()).slice(0, 200)
        return NextResponse.json({ error: `Skip trace submit failed: ${errText}` }, { status: 502 })
      }
      const traceResult = await traceRes.json()
      queueId = String(traceResult.queue_id || traceResult.id || "")

      await supabaseAdmin
        .from("foreclosure_leads")
        .update({ status: "skip_tracing", skip_trace_queue_id: queueId })
        .in("id", traceable.map((l) => l.id))
    }

    // Numbers the agent imported themselves get re-verified by the nightly DNC scrub;
    // until then the existing per-phone "Run DNC check" button also works immediately.
    if (alreadyHavePhone.length > 0) {
      await supabaseAdmin
        .from("foreclosure_leads")
        .update({ dnc_checked: false })
        .in("id", alreadyHavePhone.map((l) => l.id))
    }

    return NextResponse.json({
      success: true,
      submitted: traceable.length,
      queueId,
      dncQueued: alreadyHavePhone.length,
      skippedNoAddress: ownedIds.length - traceable.length - alreadyHavePhone.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
