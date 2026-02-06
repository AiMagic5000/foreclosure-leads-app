import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const TRACERFY_API_KEY = process.env.TRACERFY_API_KEY || ""
const TRACERFY_BASE = process.env.TRACERFY_API_URL || "https://tracerfy.com/v1/api"

interface TracerfyQueue {
  id: number
  created_at: string
  pending: boolean
  download_url: string | null
  rows_uploaded: number
  credits_deducted: number
  queue_type: string
  trace_type: string
}

interface TracerfyResult {
  first_name: string
  last_name: string
  address: string
  city: string
  state: string
  zip: string
  phone_1?: string
  phone_2?: string
  phone_3?: string
  phone_4?: string
  phone_5?: string
  phone_6?: string
  phone_7?: string
  phone_8?: string
  email_1?: string
  email_2?: string
  email_3?: string
  email_4?: string
  email_5?: string
  mail_address?: string
  mail_city?: string
  mail_state?: string
  mail_zip?: string
}

function splitOwnerName(fullName: string): { first: string; last: string } {
  const cleaned = fullName.replace(/[.,]/g, "").trim()
  const parts = cleaned.split(/\s+/)
  if (parts.length === 0) return { first: "", last: "" }
  if (parts.length === 1) return { first: parts[0], last: "" }
  // Check if format is "LAST, FIRST" (common in court records)
  if (fullName.includes(",")) {
    const [last, ...rest] = fullName.split(",").map(s => s.trim())
    return { first: rest.join(" ") || "", last: last || "" }
  }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

async function tracerfyFetch(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${TRACERFY_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TRACERFY_API_KEY}`,
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tracerfy API error ${res.status}: ${text}`)
  }
  return res.json()
}

// GET: check queue status or get analytics
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userEmail = user.emailAddresses?.[0]?.emailAddress
    if (userEmail !== ADMIN_EMAIL) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const queueId = searchParams.get("queueId")

    if (action === "analytics") {
      const data = await tracerfyFetch("/analytics/")
      return NextResponse.json(data)
    }

    if (action === "queues") {
      const data = await tracerfyFetch("/queues/")
      return NextResponse.json(data)
    }

    if (action === "status" && queueId) {
      const data = await tracerfyFetch(`/queue/${queueId}`)
      return NextResponse.json(data)
    }

    if (action === "import" && queueId) {
      return importResults(queueId)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: submit a batch of leads to Tracerfy
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userEmail = user.emailAddresses?.[0]?.emailAddress
    if (userEmail !== ADMIN_EMAIL) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    if (!TRACERFY_API_KEY) {
      return NextResponse.json({ error: "TRACERFY_API_KEY not configured" }, { status: 500 })
    }

    const body = await request.json()
    const batchSize = Math.min(body.batchSize || 100, 1000)
    const priority = body.priority || "best_data" // best_data | highest_surplus | newest

    // Fetch leads that need skip tracing
    let query = supabaseAdmin
      .from("foreclosure_leads")
      .select("id, owner_name, property_address, city, state_abbr, zip_code, county, estimated_surplus")
      .is("primary_phone", null)
      .neq("status", "dead")
      .limit(batchSize)

    // Prioritize leads with best data (address+city) for highest hit rate
    if (priority === "best_data") {
      query = query
        .not("property_address", "eq", "")
        .not("city", "is", null)
        .order("estimated_surplus", { ascending: false, nullsFirst: false })
    } else if (priority === "highest_surplus") {
      query = query.order("estimated_surplus", { ascending: false, nullsFirst: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const { data: leads, error: fetchErr } = await query

    if (fetchErr) {
      return NextResponse.json({ error: `DB error: ${fetchErr.message}` }, { status: 500 })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: "No leads found matching criteria" }, { status: 404 })
    }

    // Build JSON data for Tracerfy
    const jsonData = leads.map(lead => {
      const { first, last } = splitOwnerName(lead.owner_name || "")
      return {
        first_name: first,
        last_name: last,
        address: lead.property_address || "",
        city: lead.city || "",
        state: lead.state_abbr || "",
        zip: lead.zip_code || "",
      }
    })

    // Submit to Tracerfy
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
      headers: {
        Authorization: `Bearer ${TRACERFY_API_KEY}`,
      },
      body: formData,
    })

    if (!traceRes.ok) {
      const errText = await traceRes.text()
      return NextResponse.json({ error: `Tracerfy submit error: ${errText}` }, { status: 500 })
    }

    const traceResult = await traceRes.json()

    // Mark these leads as being traced
    const leadIds = leads.map(l => l.id)
    await supabaseAdmin
      .from("foreclosure_leads")
      .update({
        status: "skip_tracing",
        skip_trace_queue_id: String(traceResult.queue_id || traceResult.id || ""),
      })
      .in("id", leadIds)

    return NextResponse.json({
      success: true,
      queueId: traceResult.queue_id || traceResult.id,
      leadsSubmitted: leads.length,
      leadIds,
      traceResult,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function importResults(queueId: string) {
  try {
    const queueData = await tracerfyFetch(`/queue/${queueId}`)

    // Check if queue has results
    const results: TracerfyResult[] = Array.isArray(queueData)
      ? queueData
      : queueData.results || queueData.data || []

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No results available yet. Queue may still be processing.",
        raw: queueData,
      })
    }

    let updated = 0
    let skipped = 0

    for (const result of results) {
      const firstName = (result.first_name || "").trim()
      const lastName = (result.last_name || "").trim()
      const fullName = `${firstName} ${lastName}`.trim().toUpperCase()

      if (!fullName) {
        skipped++
        continue
      }

      // Find matching lead by name
      const { data: matchingLeads } = await supabaseAdmin
        .from("foreclosure_leads")
        .select("id, owner_name")
        .is("primary_phone", null)
        .ilike("owner_name", `%${lastName}%`)
        .limit(10)

      if (!matchingLeads || matchingLeads.length === 0) {
        skipped++
        continue
      }

      // Find best name match
      const bestMatch = matchingLeads.find(lead => {
        const leadName = (lead.owner_name || "").toUpperCase()
        return leadName.includes(lastName.toUpperCase()) && leadName.includes(firstName.toUpperCase())
      }) || matchingLeads[0]

      // Collect all non-empty phones
      const phones = [
        result.phone_1, result.phone_2, result.phone_3, result.phone_4,
        result.phone_5, result.phone_6, result.phone_7, result.phone_8,
      ].filter(p => p && p.trim() && p.trim() !== "N/A")

      const emails = [
        result.email_1, result.email_2, result.email_3, result.email_4, result.email_5,
      ].filter(e => e && e.trim() && e.trim() !== "N/A")

      if (phones.length === 0 && emails.length === 0) {
        // Mark as skip trace failed
        await supabaseAdmin
          .from("foreclosure_leads")
          .update({ status: "skip_trace_failed" })
          .eq("id", bestMatch.id)
        skipped++
        continue
      }

      const updateData: Record<string, unknown> = {
        status: "skip_traced",
        primary_phone: phones[0] || null,
        primary_email: emails[0] || null,
        skip_trace_data: JSON.stringify({
          phones,
          emails,
          source: "tracerfy",
          traced_at: new Date().toISOString(),
        }),
      }

      if (result.mail_address && result.mail_address !== "N/A") {
        const mailParts = [result.mail_address, result.mail_city, result.mail_state, result.mail_zip]
          .filter(Boolean)
          .join(", ")
        updateData.mailing_address = mailParts
      }

      await supabaseAdmin
        .from("foreclosure_leads")
        .update(updateData)
        .eq("id", bestMatch.id)

      updated++
    }

    return NextResponse.json({
      success: true,
      totalResults: results.length,
      updated,
      skipped,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
