import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"
import { resolveCallerEmails } from "@/lib/caller-identity"

export const maxDuration = 60

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com").toLowerCase()
const TRACERFY_BASE = "https://tracerfy.com/v1/api"

/**
 * Live DNC check for a single lead phone (agent-triggered). Submits the number
 * to Tracerfy's DNC scrub, polls for the verdict (~1 credit / $0.02), then
 * stamps the lead: dnc_checked, on_dnc, can_contact, dnc_type, dnc_checked_at.
 * Auth: the lead's assigned agent (or admin).
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.TRACERFY_API_KEY
  if (!apiKey) return NextResponse.json({ error: "DNC service not configured" }, { status: 500 })

  const user = await currentUser()
  const callerEmails = resolveCallerEmails(user)
  const callerEmail = callerEmails[0]
  const isAdmin = callerEmail === ADMIN_EMAIL

  const body = await request.json().catch(() => ({}))
  const leadId = String(body?.leadId || "").trim()
  const pinId = String(body?.operatorPinId || "").trim()
  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 })

  if (!isAdmin) {
    const { data: assignment } = await supabaseAdmin
      .from("operator_lead_assignments").select("operator_pin_id").eq("lead_id", leadId).single()
    if (!assignment || assignment.operator_pin_id !== pinId) {
      return NextResponse.json({ error: "This lead is not assigned to you." }, { status: 403 })
    }
    const { data: pinRow } = await supabaseAdmin
      .from("user_pins").select("email").eq("id", pinId).single()
    if (!pinRow || canonicalEmail(pinRow.email) !== callerEmail) {
      return NextResponse.json({ error: "This lead is not assigned to you." }, { status: 403 })
    }
  }

  const { data: lead } = await supabaseAdmin
    .from("foreclosure_leads").select("id, primary_phone").eq("id", leadId).single()
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  const digits = String(lead.primary_phone || "").replace(/\D/g, "").slice(-10)
  if (digits.length !== 10) {
    return NextResponse.json({ error: "Lead has no valid phone to check." }, { status: 400 })
  }

  // 1) submit the scrub
  const subRes = await fetch(`${TRACERFY_BASE}/dnc/scrub/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ phones: [digits] }),
  })
  if (!subRes.ok) {
    return NextResponse.json({ error: `DNC service error (${subRes.status})` }, { status: 502 })
  }
  const subData = await subRes.json()
  const queueId = subData?.dnc_queue_id || subData?.id || subData?.queue_id
  if (!queueId) return NextResponse.json({ error: "DNC service did not accept the number." }, { status: 502 })

  // 2) poll (max ~45s inside the 60s function budget)
  const deadline = Date.now() + 45000
  let result: Record<string, unknown> | null = null
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000))
    const pollRes = await fetch(`${TRACERFY_BASE}/dnc/queue/${queueId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!pollRes.ok) continue
    const data = await pollRes.json()
    if (data && (data.pending === false || String(data.pending).toLowerCase() === "false")) {
      result = data
      break
    }
    if (Array.isArray(data)) { result = { results: data }; break }
  }
  if (!result) {
    return NextResponse.json({ pending: true, message: "Check submitted — results are still processing. Try again in a minute." })
  }

  // 3) extract the verdict. Prefer inline rows; else fetch the results CSV/url.
  let isClean: boolean | null = null
  const rows = (result.results as Array<Record<string, string>>) || null
  if (rows) {
    const row = rows.find((r) => String(r.phone || "").replace(/\D/g, "").slice(-10) === digits) || rows[0]
    if (row) isClean = ["true", "1", "yes", "clean"].includes(String(row.is_clean).toLowerCase())
  } else {
    const urlKey = Object.keys(result).find((k) => /url|csv|download/i.test(k) && typeof result[k] === "string" && String(result[k]).startsWith("http"))
    if (urlKey) {
      const csvRes = await fetch(String(result[urlKey]), { headers: { Authorization: `Bearer ${apiKey}` } })
      const text = csvRes.ok ? await csvRes.text() : ""
      const lines = text.trim().split("\n")
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
        const pi = headers.indexOf("phone"); const ci = headers.indexOf("is_clean")
        for (const line of lines.slice(1)) {
          const cols = line.split(",")
          if (String(cols[pi] || "").replace(/\D/g, "").slice(-10) === digits) {
            isClean = ["true", "1", "yes", "clean"].includes(String(cols[ci] || "").trim().toLowerCase())
            break
          }
        }
      }
    } else if (typeof result.phones_clean !== "undefined" && Number(result.phones_checked) === 1) {
      // single-number scrub: clean-count tells the whole story
      isClean = Number(result.phones_clean) === 1
    }
  }
  if (isClean === null) {
    return NextResponse.json({ pending: true, message: "Check ran but the verdict wasn't readable — try again in a minute." })
  }

  await supabaseAdmin.from("foreclosure_leads").update({
    dnc_checked: true,
    dnc_checked_at: new Date().toISOString(),
    dnc_type: "tracerfy",
    on_dnc: !isClean,
    can_contact: isClean,
  }).eq("id", leadId)

  return NextResponse.json({ success: true, isClean, onDnc: !isClean, canContact: isClean })
}
