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
  const users = [...byUser.entries()].map(([email, urows]) => {
    const uViews = urows.filter((r) => r.kind === "view")
    const logins = urows.filter((r) => r.kind === "login").length
    const lastSeen = urows[0]?.created_at || null
    const pc = new Map<string, number>()
    for (const r of uViews) pc.set(r.path, (pc.get(r.path) || 0) + 1)
    const userPaths = [...pc.entries()].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count)
    const recent = urows.filter((r) => r.kind === "view").slice(0, 20).map((r) => ({ path: r.path, at: r.created_at }))
    return { email, lastSeen, logins, views: uViews.length, paths: userPaths, recent }
  }).sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""))

  return NextResponse.json({
    range,
    totalViews,
    uniqueUsers: byUser.size,
    topPage: paths[0]?.path || "—",
    paths,
    users,
  })
}
