import { NextRequest, NextResponse } from "next/server"
import { isRequestAdmin } from "@/lib/admin-guard"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const RANGES: Record<string, number> = { "24h": 1, "3d": 3, "7d": 7, "30d": 30 }

interface Row { email: string; path: string; kind: string; created_at: string }

export async function GET(req: NextRequest) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 })

  const range = (req.nextUrl.searchParams.get("range") || "3d").toLowerCase()
  const days = RANGES[range] ?? 3
  const since = new Date(Date.now() - days * 86400_000).toISOString()

  const { data, error } = await supabaseAdmin
    .from("page_activity")
    .select("email, path, kind, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data || []) as Row[]
  const views = rows.filter((r) => r.kind === "view")

  // Most-visited paths
  const pathCounts = new Map<string, number>()
  for (const r of views) pathCounts.set(r.path, (pathCounts.get(r.path) || 0) + 1)
  const totalViews = views.length
  const paths = [...pathCounts.entries()]
    .map(([path, count]) => ({ path, count, pct: totalViews ? +((count / totalViews) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.count - a.count)

  // Per-user breakdown
  const byUser = new Map<string, Row[]>()
  for (const r of rows) {
    const k = r.email.toLowerCase()
    if (!byUser.has(k)) byUser.set(k, [])
    byUser.get(k)!.push(r)
  }
  // Enrich each active user with tier + full name + phone from the users table
  // (dup rows exist from the Clerk migration — keep the best value per field).
  const activeEmails = [...byUser.keys()]
  const inEmails = activeEmails.length ? activeEmails : ["__none__"]
  const [{ data: profileRows }, { data: leadRows }] = await Promise.all([
    supabaseAdmin.from("users").select("email, account_type, full_name, fullname, profile_phone").in("email", inEmails),
    // FB-lead phone + name live on the lead row (the form submission), NOT users.profile_phone —
    // phone is required on the form, so pull it from here so it actually shows.
    supabaseAdmin.from("webcast_leads").select("email, phone, first_name, last_name").in("email", inEmails),
  ])
  const profByEmail = new Map<string, { tier: string; name: string; phone: string }>()
  for (const p of (profileRows || []) as { email: string; account_type: string | null; full_name: string | null; fullname: string | null; profile_phone: string | null }[]) {
    const k = (p.email || "").toLowerCase()
    if (!k) continue
    const prev = profByEmail.get(k) || { tier: "basic", name: "", phone: "" }
    profByEmail.set(k, {
      tier: p.account_type && p.account_type !== "basic" ? p.account_type : prev.tier,
      name: prev.name || p.full_name || p.fullname || "",
      phone: prev.phone || p.profile_phone || "",
    })
  }
  for (const l of (leadRows || []) as { email: string; phone: string | null; first_name: string | null; last_name: string | null }[]) {
    const k = (l.email || "").toLowerCase()
    if (!k) continue
    const prev = profByEmail.get(k) || { tier: "basic", name: "", phone: "" }
    const leadName = [l.first_name, l.last_name].filter(Boolean).join(" ")
    profByEmail.set(k, { tier: prev.tier, name: prev.name || leadName, phone: prev.phone || (l.phone || "") })
  }

  const users = [...byUser.entries()].map(([email, urows]) => {
    const uViews = urows.filter((r) => r.kind === "view")
    const logins = urows.filter((r) => r.kind === "login").length
    const downloads = urows.filter((r) => r.kind === "download").length
    const lastSeen = urows[0]?.created_at || null
    const pc = new Map<string, number>()
    for (const r of uViews) pc.set(r.path, (pc.get(r.path) || 0) + 1)
    const userPaths = [...pc.entries()].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count)
    // Recent activity includes page views AND guide downloads (kind marks which).
    const recent = urows.filter((r) => r.kind === "view" || r.kind === "download").slice(0, 25).map((r) => ({ path: r.path, at: r.created_at, kind: r.kind }))
    const prof = profByEmail.get(email) || { tier: "basic", name: "", phone: "" }
    return { email, lastSeen, logins, views: uViews.length, downloads, paths: userPaths, recent, tier: prof.tier, name: prof.name, phone: prof.phone }
  }).sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""))

  // --- Refund-void risk flag ---------------------------------------------
  // Paid accounts that have not logged in for 2+ weeks during their FIRST YEAR
  // of membership. The money-back guarantee no longer applies to them, so admins
  // get a red flag. (All-time login lookup — these users won't appear in the
  // range-scoped activity list above precisely because they've gone quiet.)
  const now = Date.now()
  const [paidRes, loginRes] = await Promise.all([
    supabaseAdmin.from("users").select("email, account_type, created_at")
      .not("account_type", "in", "(basic,free)").not("account_type", "is", null),
    supabaseAdmin.from("page_activity").select("email, created_at")
      .eq("kind", "login").order("created_at", { ascending: false }).limit(20000),
  ])
  const lastLoginByEmail = new Map<string, string>()
  for (const r of (loginRes.data || []) as { email: string; created_at: string }[]) {
    const k = (r.email || "").toLowerCase()
    if (k && !lastLoginByEmail.has(k)) lastLoginByEmail.set(k, r.created_at) // desc order -> first is newest
  }
  const seenPaid = new Set<string>()
  const atRiskPaid = ((paidRes.data || []) as { email: string; account_type: string; created_at: string }[])
    .filter((u) => {
      const k = (u.email || "").toLowerCase()
      if (!k || seenPaid.has(k)) return false // dedup the Clerk dup rows
      seenPaid.add(k)
      return true
    })
    .map((u) => {
      const created = u.created_at ? new Date(u.created_at).getTime() : 0
      const membershipDays = created ? Math.floor((now - created) / 86400_000) : null
      const last = lastLoginByEmail.get(u.email.toLowerCase()) || null
      const daysSinceLogin = last ? Math.floor((now - new Date(last).getTime()) / 86400_000) : null
      return { email: u.email, accountType: u.account_type, lastLogin: last, daysSinceLogin, membershipDays }
    })
    .filter((u) => u.membershipDays != null && u.membershipDays <= 365 && (u.daysSinceLogin == null || u.daysSinceLogin >= 14))
    .sort((a, b) => (b.daysSinceLogin ?? 99999) - (a.daysSinceLogin ?? 99999))

  return NextResponse.json({
    range,
    totalViews,
    uniqueUsers: byUser.size,
    topPage: paths[0]?.path || "—",
    paths,
    users,
    atRiskPaid,
  })
}
