import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

const AMARIYON_STATES = [
  "AL","AK","AZ","AR","GA","ID","MI","MN","MS","MO",
  "NE","NV","NH","OR","RI","TN","VA","WV","WY","TX",
]

const CAMOFOX_URL = "https://browser.alwaysencrypted.com"
const CAMOFOX_BEARER =
  process.env.CAMOFOX_BEARER ||
  "d4cf718a985c86eaade782231f5439b9050b31a1d9ed35a5cb2891220693974b"

const TRACERFY_BASE = "https://tracerfy.com/v1/api"
const TRACERFY_KEY =
  process.env.TRACERFY_API_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjozMjM5MTkyMjA5LCJpYXQiOjE3NzAzOTIyMDksImp0aSI6IjljZGRlM2ViZmQ5MTQ4ZTM4Y2YyZWQ2Zjg5N2Y0YWU3IiwidXNlcl9pZCI6NDg2MX0.P-OddSE0P4ztShWwvzOQ5Ju2ttdM9V75yQQl_4551Vs"

export const dynamic = "force-dynamic"

async function adminCheck(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  return email === ADMIN_EMAIL.toLowerCase()
}

async function fetchCamofox(): Promise<{
  ok: boolean
  detail: string
}> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(`${CAMOFOX_URL}/health`, {
      headers: {
        Authorization: `Bearer ${CAMOFOX_BEARER}`,
        "User-Agent": "USFR-Dashboard/1.0",
      },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
    const data = await res.json()
    if (data?.ok && data?.browserConnected) {
      return { ok: true, detail: data.engine || "connected" }
    }
    return { ok: false, detail: "unhealthy" }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, detail: msg.slice(0, 80) }
  }
}

async function fetchTracerfyBalance(): Promise<{
  ok: boolean
  balance: number | null
  detail: string
}> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(`${TRACERFY_BASE}/account/`, {
      headers: { Authorization: `Bearer ${TRACERFY_KEY}` },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return { ok: false, balance: null, detail: `HTTP ${res.status}` }
    const data = await res.json()
    return {
      ok: true,
      balance: typeof data?.balance === "number" ? data.balance : null,
      detail: `traced=${data?.properties_traced ?? "?"} queues=${data?.total_queues ?? "?"}`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, balance: null, detail: msg.slice(0, 80) }
  }
}

export async function GET() {
  if (!(await adminCheck())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayIso = todayStart.toISOString()

  // ── Lead counts by status ────────────────────────────────────
  const { data: statusRows } = await supabaseAdmin
    .from("foreclosure_leads")
    .select("status")
    .limit(50000)
  const statusCounts: Record<string, number> = {}
  for (const r of statusRows || []) {
    const k = r.status || "unknown"
    statusCounts[k] = (statusCounts[k] || 0) + 1
  }

  // ── Today inserts ────────────────────────────────────────────
  const { count: insertedToday } = await supabaseAdmin
    .from("foreclosure_leads")
    .select("id", { count: "exact", head: true })
    .gte("scraped_at", todayIso)

  // ── $5K+ unassigned reachable in Amariyon states ─────────────
  const { data: unassignedRows } = await supabaseAdmin
    .from("foreclosure_leads")
    .select("state_abbr, primary_email, primary_phone, dnc_checked, on_dnc, overage_amount")
    .gte("overage_amount", 5000)
    .in("state_abbr", AMARIYON_STATES)
    .in("status", ["new", "skip_traced", "contacted", "master", "diamond", "skip_trace_failed"])
    .limit(20000)

  const { data: assignedIdRows } = await supabaseAdmin
    .from("operator_lead_assignments")
    .select("lead_id")
    .eq("status", "active")
  const assignedSet = new Set((assignedIdRows || []).map((r) => r.lead_id))
  void assignedSet // (lead.id not selected to keep payload small)

  const reachableByState: Record<string, number> = {}
  let reachableTotal = 0
  for (const lead of unassignedRows || []) {
    const reachable =
      (lead.primary_email && lead.primary_email.trim() !== "") ||
      (lead.primary_phone && lead.dnc_checked && !lead.on_dnc)
    if (reachable) {
      reachableByState[lead.state_abbr] = (reachableByState[lead.state_abbr] || 0) + 1
      reachableTotal += 1
    }
  }

  // ── County outreach pipeline ─────────────────────────────────
  const { data: coRows } = await supabaseAdmin
    .from("county_outreach")
    .select("status")
    .limit(20000)
  const outreachCounts: Record<string, number> = {}
  for (const r of coRows || []) {
    const k = r.status || "unknown"
    outreachCounts[k] = (outreachCounts[k] || 0) + 1
  }

  // ── Today emails sent ────────────────────────────────────────
  const { count: outreachSentToday } = await supabaseAdmin
    .from("county_outreach")
    .select("id", { count: "exact", head: true })
    .gte("email_sent_at", todayIso)

  // ── Recent activity: latest 10 inserted leads + outreach ─────
  const { data: recentLeads } = await supabaseAdmin
    .from("foreclosure_leads")
    .select("id, owner_name, state_abbr, county, overage_amount, source, scraped_at")
    .order("scraped_at", { ascending: false })
    .limit(10)

  const { data: recentOutreach } = await supabaseAdmin
    .from("county_outreach")
    .select("state_abbr, county_name, status, email_sent_at, last_response_at")
    .order("email_sent_at", { ascending: false, nullsFirst: false })
    .limit(10)

  // ── External probes ──────────────────────────────────────────
  const [camofox, tracerfy] = await Promise.all([
    fetchCamofox(),
    fetchTracerfyBalance(),
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    leads: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      byStatus: statusCounts,
      insertedToday: insertedToday || 0,
    },
    reachable: {
      total: reachableTotal,
      byState: reachableByState,
    },
    outreach: {
      byStatus: outreachCounts,
      sentToday: outreachSentToday || 0,
      dailyCap: 250,
    },
    probes: {
      camofox,
      tracerfy,
    },
    recent: {
      leads: recentLeads || [],
      outreach: recentOutreach || [],
    },
  })
}
