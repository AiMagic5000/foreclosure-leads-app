import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"
import { resolveImpersonationTarget } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

// Per-state contingency fee caps (fraction of surplus) where a jurisdiction
// limits what a recovery agent can charge. Everything else uses the standard 30%.
// NC caps at a flat $1,000. Source: 50 States Overage Guide.
const STATE_FEE_CAPS: Record<string, number> = {
  WA: 0.05, TN: 0.10, AR: 0.10, NV: 0.10, AZ: 0.10, FL: 0.12, CO: 0.20, TX: 0.20,
}
const NC_FLAT_CAP = 1000
const STANDARD_FEE = 0.30
const AGENT_SPLIT = 0.5

// Engagement + contingency-agreement stats for the caller's My Account tab.
// Admin view-as supported via ?asPinId= (verified server-side).
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const asPinId = req.nextUrl.searchParams.get("asPinId")
  const target = await resolveImpersonationTarget(asPinId)

  let email = ""
  let pinId: string | null = null
  if (target) {
    email = (target.email || "").toLowerCase()
    pinId = target.pinId
  } else {
    const user = await currentUser()
    email = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress) || ""
    if (email) {
      const { data: pin } = await supabaseAdmin
        .from("user_pins").select("id").ilike("email", email).eq("is_active", true).maybeSingle()
      pinId = (pin as { id?: string } | null)?.id || null
    }
  }
  if (!email) return NextResponse.json({ error: "No account" }, { status: 404 })

  // ---- Activity (all-time): time on site, logins, views, downloads ----
  const [timeRes, actRes] = await Promise.all([
    supabaseAdmin.from("user_time_daily").select("day, seconds").ilike("email", email).limit(5000),
    supabaseAdmin.from("page_activity").select("kind, created_at").ilike("email", email).limit(20000),
  ])
  const timeRows = (timeRes.data || []) as { day: string; seconds: number }[]
  const totalSeconds = timeRows.reduce((s, r) => s + (r.seconds || 0), 0)
  const acts = (actRes.data || []) as { kind: string; created_at: string }[]
  const logins = acts.filter((a) => a.kind === "login").length
  const views = acts.filter((a) => a.kind === "view").length
  const downloads = acts.filter((a) => a.kind === "download").length

  // ---- Contingency agreements (storage uploads) ----
  let agreementCount = 0
  let firstUploadAt: string | null = null
  if (pinId) {
    const { data: files } = await supabaseAdmin.storage
      .from("agent-docs")
      .list(`${pinId}/contingency-agreements`, { sortBy: { column: "created_at", order: "asc" } })
    const real = (files || []).filter((f) => f.name && !f.name.startsWith("."))
    agreementCount = real.length
    firstUploadAt = real[0]?.created_at || null
  }

  // Average agreements per month, measured from first upload to now (min 1 month).
  let avgPerMonth = 0
  if (agreementCount > 0 && firstUploadAt) {
    const months = Math.max(1, (Date.now() - new Date(firstUploadAt).getTime()) / (30.44 * 86400_000))
    avgPerMonth = +(agreementCount / months).toFixed(1)
  }

  // Cumulative time on site BEFORE the first agreement upload.
  let secondsToFirstUpload: number | null = null
  if (firstUploadAt) {
    const firstDay = firstUploadAt.slice(0, 10)
    secondsToFirstUpload = timeRows.filter((r) => r.day <= firstDay).reduce((s, r) => s + (r.seconds || 0), 0)
  }

  // ---- Average agreement value: agent's 50% split of the (state-capped) fee ----
  // Uses the agent's assigned leads' surplus amounts, applying each state's fee cap.
  let avgAgreementValue: number | null = null
  if (pinId) {
    const { data: leads } = await supabaseAdmin.rpc("get_operator_leads", { p_pin_id: pinId })
    const rows = ((leads || []) as { overage_amount?: number | null; state_abbr?: string | null }[])
      .filter((l) => Number(l.overage_amount) >= 5000 && Number(l.overage_amount) <= 250000)
    if (rows.length) {
      const values = rows.map((l) => {
        const ov = Number(l.overage_amount) || 0
        const st = (l.state_abbr || "").toUpperCase()
        const fee = st === "NC" ? Math.min(NC_FLAT_CAP, ov * STANDARD_FEE) : ov * (STATE_FEE_CAPS[st] ?? STANDARD_FEE)
        return fee * AGENT_SPLIT
      })
      avgAgreementValue = Math.round(values.reduce((s, v) => s + v, 0) / values.length)
    }
  }

  // ---- Current agreement status (admin-managed; defaults to pending) ----
  let status = "pending"
  if (pinId) {
    const { data: st } = await supabaseAdmin
      .from("contingency_agreement_status").select("status").eq("pin_id", pinId).maybeSingle()
    status = (st as { status?: string } | null)?.status || "pending"
  }

  return NextResponse.json({
    totalSeconds,
    logins,
    views,
    downloads,
    agreementCount,
    avgPerMonth,
    secondsToFirstUpload,
    avgAgreementValue,
    status,
  })
}
