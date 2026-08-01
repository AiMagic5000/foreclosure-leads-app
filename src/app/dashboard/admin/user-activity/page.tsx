"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Activity, RefreshCw, Eye, Users, TrendingUp, Loader2, ChevronDown, ChevronUp } from "lucide-react"

interface PathStat { path: string; count: number; pct: number }
interface UserRow {
  email: string
  tier: string
  name: string
  phone: string
  lastSeen: string | null
  logins: number
  views: number
  downloads: number
  timeSeconds: number
  timeTotalSeconds: number
  paths: { path: string; count: number }[]
  recent: { path: string; at: string; kind?: string }[]
}
interface AtRiskUser { email: string; accountType: string; lastLogin: string | null; daysSinceLogin: number | null; membershipDays: number | null }
interface Data {
  totalViews: number
  uniqueUsers: number
  topPage: string
  paths: PathStat[]
  users: UserRow[]
  atRiskPaid: AtRiskUser[]
}

const RANGES = [
  { key: "24h", label: "LAST 24H" },
  { key: "3d", label: "LAST 3D" },
  { key: "7d", label: "LAST 7D" },
  { key: "30d", label: "LAST 30D" },
]

function fmtDuration(sec: number) {
  if (!sec) return "0m"
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtTime(s: string | null) {
  if (!s) return "—"
  const d = new Date(s)
  return d.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}

export default function UserActivityPage() {
  const [range, setRange] = useState("3d")
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "views">("recent")

  // Filter (search) + sort. Default "recent" keeps the natural last-activity order
  // from the API; "views" sorts by view count, highest first.
  const visibleUsers = useMemo(() => {
    const list = data?.users || []
    const t = q.trim().toLowerCase()
    const filtered = t ? list.filter((u) => [u.email, u.name, u.phone, u.tier].some((f) => (f || "").toLowerCase().includes(t))) : list
    return sortBy === "views" ? [...filtered].sort((a, b) => b.views - a.views) : filtered
  }, [data, q, sortBy])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await (await fetch(`/api/admin/user-activity?range=${range}`)).json()
      setData(d.error ? null : d)
    } catch { setData(null) } finally { setLoading(false) }
  }, [range])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">Admin</p>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <h1 className="text-2xl font-bold">User Activity &amp; Interests</h1>
        </div>
        <p className="mt-1 text-sm text-white/80">See which dashboard tabs users actually visit. Use this to decide where to invest content updates.</p>
      </div>

      {/* Range tabs + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${range === r.key ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading activity…</div>
      ) : !data ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">No activity data yet.</p>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={<Eye className="h-4 w-4 text-blue-500" />} label="Total page views" value={String(data.totalViews)} />
            <Stat icon={<Users className="h-4 w-4 text-emerald-500" />} label="Unique users" value={String(data.uniqueUsers)} />
            <Stat icon={<TrendingUp className="h-4 w-4 text-indigo-500" />} label="Top page" value={data.topPage} mono />
          </div>

          {/* Refund-void risk: paid accounts inactive 2+ weeks during year 1 */}
          {data.atRiskPaid && data.atRiskPaid.length > 0 && (
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚩</span>
                <h2 className="text-lg font-bold text-red-700">Refund-void risk — {data.atRiskPaid.length} paid account{data.atRiskPaid.length === 1 ? "" : "s"}</h2>
              </div>
              <p className="mt-1 text-sm text-red-700/80">Paid members who haven&apos;t logged in for 2+ weeks during their first year. The money-back guarantee no longer applies to them.</p>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-red-400">
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Tier</th>
                    <th className="pb-2 text-right">Days since login</th>
                    <th className="pb-2 text-right">Member for</th>
                  </tr>
                </thead>
                <tbody>
                  {data.atRiskPaid.map((u) => (
                    <tr key={u.email} className="border-t border-red-200">
                      <td className="py-2 font-semibold text-red-800">🚩 {u.email}</td>
                      <td className="py-2 text-red-700">{u.accountType}</td>
                      <td className="py-2 text-right font-semibold text-red-800">{u.daysSinceLogin == null ? "never logged in" : `${u.daysSinceLogin}d`}</td>
                      <td className="py-2 text-right text-red-600">{u.membershipDays == null ? "—" : `${u.membershipDays}d`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Most-visited tabs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-[#0f172a]">Most-visited tabs</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-2">Path</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">% of total</th>
                </tr>
              </thead>
              <tbody>
                {data.paths.map((p) => (
                  <tr key={p.path} className="border-t border-slate-100">
                    <td className="py-2 font-mono text-xs text-blue-700">{p.path}</td>
                    <td className="py-2 text-right font-semibold text-[#0f172a]">{p.count}</td>
                    <td className="py-2 text-right text-slate-500">{p.pct}%</td>
                  </tr>
                ))}
                {data.paths.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400">No page views in this window.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* All active users */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#0f172a]">
                All active users ({visibleUsers.length}{q.trim() ? ` of ${data.users.length}` : ""})
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-lg border border-slate-300 text-xs font-semibold">
                  <button onClick={() => setSortBy("recent")} className={`px-3 py-1.5 ${sortBy === "recent" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Recent</button>
                  <button onClick={() => setSortBy("views")} className={`px-3 py-1.5 ${sortBy === "views" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Most views</button>
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, email, phone, tier…"
                  className="w-72 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-3">
              {visibleUsers.map((u) => {
                const open = expanded === u.email
                return (
                  <div key={u.email} className={`rounded-xl border p-4 ${open ? "border-blue-300 bg-blue-50/40" : "border-slate-200"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      {u.name && <span className="font-semibold text-[#0f172a]">{u.name}</span>}
                      <span className="font-semibold text-amber-700">{u.email}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${u.tier === "basic" ? "bg-slate-200 text-slate-600" : "bg-emerald-600 text-white"}`}>{u.tier === "basic" ? "free" : u.tier.replace(/_/g, " ")}</span>
                      {u.phone && <span className="text-xs text-slate-500">{u.phone}</span>}
                      <span className="ml-auto flex items-center gap-2 text-xs">
                        <span title={`All-time on site: ${fmtDuration(u.timeTotalSeconds)}`} className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">{fmtDuration(u.timeSeconds)} on site</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">{u.logins} logins</span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">{u.views} views</span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">{u.downloads} downloads</span>
                        <button onClick={() => setExpanded(open ? null : u.email)} className="inline-flex items-center gap-0.5 text-slate-500 hover:text-slate-800">
                          {open ? <>hide <ChevronUp className="h-3.5 w-3.5" /></> : <>details <ChevronDown className="h-3.5 w-3.5" /></>}
                        </button>
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">Last seen: {fmtTime(u.lastSeen)}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {u.paths.slice(0, 6).map((p) => (
                        <span key={p.path} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{p.path} ×{p.count}</span>
                      ))}
                    </div>

                    {open && (
                      <div className="mt-4 grid gap-6 border-t border-blue-200 pt-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Every page they hit ({u.paths.length})</p>
                          <div className="space-y-1">
                            {u.paths.map((p) => (
                              <div key={p.path} className="flex items-center justify-between text-xs">
                                <span className="font-mono text-blue-700">{p.path}</span>
                                <span className="font-semibold text-[#0f172a]">{p.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Recent activity (last {u.recent.length})</p>
                          <div className="space-y-1">
                            {u.recent.map((r, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="font-mono text-slate-600">{r.path}</span>
                                <span className="text-slate-400">{fmtTime(r.at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {data.users.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">No active users in this window.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{icon}{label}</div>
      <div className={`mt-1 text-3xl font-bold text-[#0f172a] ${mono ? "font-mono text-xl" : ""}`}>{value}</div>
    </div>
  )
}
