"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Activity,
  Database,
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Globe,
  DollarSign,
  X,
  ChevronRight,
  Phone,
  AtSign,
  Ban,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const REFRESH_MS = 5000

interface SourceAudit {
  source: string
  total: number
  unique_surplus: number
  unique_pct: number
  dead_count: number
  trust: "TRUST" | "SUSPECT" | "QUARANTINED"
}

interface StateLead {
  id: string
  owner_name: string
  property_address: string | null
  city: string | null
  state_abbr: string
  county: string | null
  primary_phone: string | null
  primary_email: string | null
  dnc_checked: boolean | null
  on_dnc: boolean | null
  overage_amount: number | null
  sale_date: string | null
  source: string | null
  status: string | null
  lead_tier: string | null
}

interface Stats {
  timestamp: string
  leads: {
    total: number
    byStatus: Record<string, number>
    insertedToday: number
  }
  reachable: {
    total: number
    byState: Record<string, number>
  }
  outreach: {
    byStatus: Record<string, number>
    sentToday: number
    dailyCap: number
  }
  probes: {
    camofox: { ok: boolean; detail: string }
    tracerfy: { ok: boolean; balance: number | null; detail: string }
  }
  sourceAudit: SourceAudit[]
  recent: {
    leads: Array<{
      id: string
      owner_name: string
      state_abbr: string
      county: string | null
      overage_amount: number | null
      source: string | null
      scraped_at: string
    }>
    outreach: Array<{
      state_abbr: string
      county_name: string
      status: string
      email_sent_at: string | null
      last_response_at: string | null
    }>
  }
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const now = Date.now()
  const ageMin = Math.floor((now - d.getTime()) / 60000)
  if (ageMin < 1) return "just now"
  if (ageMin < 60) return `${ageMin}m ago`
  const ageHr = Math.floor(ageMin / 60)
  if (ageHr < 24) return `${ageHr}h ago`
  return d.toLocaleString()
}

function fmtMoney(n: number | null): string {
  if (n == null) return "—"
  return `$${Math.round(n).toLocaleString()}`
}

export default function PipelineMonitorPage() {
  const { user, isLoaded } = useUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  const isAdmin = email === ADMIN_EMAIL.toLowerCase()

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  // Drawer for state-level review
  const [drawerState, setDrawerState] = useState<string | null>(null)
  const [drawerLeads, setDrawerLeads] = useState<StateLead[] | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)

  async function openStateDrawer(state: string) {
    setDrawerState(state)
    setDrawerLeads(null)
    setDrawerLoading(true)
    try {
      const res = await fetch(`/api/admin/pipeline-stats/state-leads?state=${state}&limit=200`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (res.ok) {
        setDrawerLeads(data.leads || [])
      } else {
        setDrawerLeads([])
      }
    } catch {
      setDrawerLeads([])
    } finally {
      setDrawerLoading(false)
    }
  }
  function closeDrawer() {
    setDrawerState(null)
    setDrawerLeads(null)
  }

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false

    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/pipeline-stats", { cache: "no-store" })
        if (!res.ok) {
          if (!cancelled) {
            setErr(`HTTP ${res.status}`)
            setLoading(false)
          }
          return
        }
        const data: Stats = await res.json()
        if (!cancelled) {
          setStats(data)
          setLastFetch(new Date())
          setErr(null)
          setLoading(false)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!cancelled) {
          setErr(msg)
          setLoading(false)
        }
      }
    }

    fetchStats()
    if (paused) return
    const interval = setInterval(fetchStats, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isAdmin, paused])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Admin access required</h2>
        <p className="text-sm text-muted-foreground mt-2">
          This page is restricted to the administrator account.
        </p>
      </div>
    )
  }

  const outreachSent = stats?.outreach.sentToday ?? 0
  const outreachCap = stats?.outreach.dailyCap ?? 250
  const outreachPct = Math.min(100, Math.round((outreachSent / outreachCap) * 100))

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            Pipeline Monitor
          </h1>
          <p className="text-sm text-muted-foreground">
            Live data harvesting + outreach status. Refresh every {REFRESH_MS / 1000}s.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {lastFetch ? `Updated ${fmtTime(lastFetch.toISOString())}` : "—"}
          <button
            onClick={() => setPaused((p) => !p)}
            className="ml-2 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
          Error: {err}
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.leads.total.toLocaleString() ?? "—"}
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              +{stats?.leads.insertedToday ?? 0} today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              $5K+ Reachable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.reachable.total.toLocaleString() ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Unassigned in 20 non-judicial states
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Emails Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outreachSent} <span className="text-sm font-normal text-muted-foreground">/ {outreachCap}</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${outreachPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Counties Queued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Object.values(stats.outreach.byStatus).reduce((a, b) => a + b, 0).toLocaleString() : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.outreach.byStatus.pending ?? 0} pending
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Probes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            External Services
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${stats?.probes.camofox.ok ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}`}>
            {stats?.probes.camofox.ok ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <div>
              <div className="font-semibold text-sm">Camofox Stealth Browser</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stats?.probes.camofox.detail || "checking..."}
              </div>
            </div>
          </div>

          <div className={`flex items-start gap-3 p-3 rounded-lg border ${stats?.probes.tracerfy.ok ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}`}>
            {stats?.probes.tracerfy.ok ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                Tracerfy Skip-Trace
                {stats?.probes.tracerfy.balance != null && (
                  <Badge className="bg-blue-100 text-blue-700">
                    {stats.probes.tracerfy.balance.toLocaleString()} credits
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stats?.probes.tracerfy.detail || "checking..."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead status breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {stats &&
                  Object.entries(stats.leads.byStatus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => {
                      const pct = (count / Math.max(1, stats.leads.total)) * 100
                      return (
                        <tr key={status} className="border-b last:border-0">
                          <td className="py-1.5 pr-3 font-medium">{status}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums">
                            {count.toLocaleString()}
                          </td>
                          <td className="py-1.5 w-32">
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* $5K+ reachable by state */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              $5K+ Unassigned by State
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && Object.keys(stats.reachable.byState).length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No reachable $5K+ leads currently available.
              </p>
            )}
            <table className="w-full text-sm">
              <tbody>
                {stats &&
                  Object.entries(stats.reachable.byState)
                    .sort(([, a], [, b]) => b - a)
                    .map(([state, count]) => (
                      <tr
                        key={state}
                        onClick={() => openStateDrawer(state)}
                        className="border-b last:border-0 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        <td className="py-1.5 pr-3 font-medium flex items-center gap-1">
                          <ChevronRight className="h-3.5 w-3.5 text-emerald-600" />
                          {state}
                        </td>
                        <td className="py-1.5 text-right tabular-nums font-semibold text-emerald-600">
                          {count}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Outreach pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">County Outreach Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {stats &&
                  Object.entries(stats.outreach.byStatus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <tr key={status} className="border-b last:border-0">
                        <td className="py-1.5 pr-3 font-medium">{status}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent activity: outreach */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Outreach Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {stats?.recent.outreach.map((row, i) => (
                <li key={i} className="flex items-center justify-between gap-2 border-b last:border-0 pb-1.5 last:pb-0">
                  <span className="truncate">
                    <Badge className="bg-slate-100 text-slate-700 text-xs mr-1.5">
                      {row.state_abbr}
                    </Badge>
                    {row.county_name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {row.last_response_at
                      ? `replied ${fmtTime(row.last_response_at)}`
                      : row.email_sent_at
                      ? `sent ${fmtTime(row.email_sent_at)}`
                      : row.status}
                  </span>
                </li>
              ))}
              {(!stats?.recent.outreach || stats.recent.outreach.length === 0) && (
                <li className="text-muted-foreground italic">No recent outreach activity</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Source quality audit — full-width, sortable, color-coded */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-amber-600" />
            Source Trust Audit
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Uniqueness check — real auctions should be 80%+ unique. Lower = scraper bug.
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Source</th>
                  <th className="text-right py-2 pr-3">Total</th>
                  <th className="text-right py-2 pr-3">Distinct $</th>
                  <th className="text-right py-2 pr-3">Uniqueness</th>
                  <th className="text-right py-2 pr-3">Quarantined</th>
                </tr>
              </thead>
              <tbody>
                {stats?.sourceAudit.map((row) => {
                  const badgeColor =
                    row.trust === "QUARANTINED"
                      ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      : row.trust === "SUSPECT"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-50"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-50"
                  const pctColor =
                    row.unique_pct >= 80
                      ? "text-emerald-600 dark:text-emerald-400"
                      : row.unique_pct >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  return (
                    <tr
                      key={row.source}
                      className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-1.5 pr-3">
                        <Badge className={badgeColor + " font-semibold"}>
                          {row.trust}
                        </Badge>
                      </td>
                      <td className="py-1.5 pr-3 font-mono text-xs max-w-[280px] truncate text-slate-800 dark:text-slate-200">
                        {row.source}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {row.total.toLocaleString()}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {row.unique_surplus.toLocaleString()}
                      </td>
                      <td className={`py-1.5 pr-3 text-right tabular-nums font-semibold ${pctColor}`}>
                        {row.unique_pct}%
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">
                        {row.dead_count > 0 ? row.dead_count.toLocaleString() : ""}
                      </td>
                    </tr>
                  )
                })}
                {(!stats?.sourceAudit || stats.sourceAudit.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center italic text-muted-foreground">
                      Loading source audit...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            <strong>TRUST</strong>: 80%+ unique surplus values, &lt;70% dead. <strong>SUSPECT</strong>: scraper bug suspected -- review before assigning. <strong>QUARANTINED</strong>: 70%+ rows already marked dead.
          </p>
        </CardContent>
      </Card>

      {/* State drawer */}
      {drawerState && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex justify-end"
          onClick={closeDrawer}
        >
          <div
            className="w-full max-w-3xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {drawerState} -- Unassigned $5K+ Reachable
                </h3>
                <p className="text-xs mt-0.5 text-slate-600 dark:text-slate-400">
                  Review before issuing to operators. {drawerLeads?.length ?? 0} leads loaded.
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3">
              {drawerLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!drawerLoading && drawerLeads && drawerLeads.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12 italic">
                  No unassigned $5K+ reachable leads in {drawerState}.
                </p>
              )}
              {!drawerLoading && drawerLeads && drawerLeads.length > 0 && (
                <div className="space-y-2">
                  {drawerLeads.map((lead) => {
                    const surplus = lead.overage_amount ?? 0
                    const phoneClear =
                      lead.primary_phone && lead.dnc_checked && !lead.on_dnc
                    const hasEmail = lead.primary_email && lead.primary_email.trim() !== ""
                    return (
                      <div
                        key={lead.id}
                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 rounded-lg p-3 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                              {lead.owner_name || "—"}
                            </div>
                            <div className="text-xs mt-0.5 truncate text-slate-700 dark:text-slate-300">
                              {lead.property_address || "no address"}
                              {lead.city ? `, ${lead.city}` : ""} {lead.county ? `(${lead.county})` : ""}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
                              {hasEmail && (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-50 font-semibold">
                                  <AtSign className="h-3 w-3 mr-0.5" />
                                  {lead.primary_email}
                                </Badge>
                              )}
                              {lead.primary_phone && (
                                <Badge
                                  className={
                                    phoneClear
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-50 font-semibold"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-50 font-semibold"
                                  }
                                >
                                  {phoneClear ? (
                                    <Phone className="h-3 w-3 mr-0.5" />
                                  ) : (
                                    <Ban className="h-3 w-3 mr-0.5" />
                                  )}
                                  {lead.primary_phone}
                                  {!phoneClear && " (DNC)"}
                                </Badge>
                              )}
                              {lead.lead_tier && lead.lead_tier !== "unscored" && (
                                <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-700 dark:text-amber-50 font-semibold">
                                  {lead.lead_tier}
                                </Badge>
                              )}
                              {lead.source && (
                                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                  {lead.source}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {fmtMoney(surplus)}
                            </div>
                            {lead.sale_date && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                sold {new Date(lead.sale_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Review pre-issuance. Use the Admin panel to assign these leads to an operator.
              </p>
              <a
                href="/dashboard/admin"
                className="text-sm font-semibold px-4 py-1.5 rounded bg-[#1e3a5f] text-white hover:bg-[#2d4a6f]"
              >
                Open Admin Panel
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Recent leads — full-width */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Latest Leads Inserted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 pr-3">Owner</th>
                  <th className="text-left py-2 pr-3">State</th>
                  <th className="text-left py-2 pr-3">County</th>
                  <th className="text-right py-2 pr-3">Surplus</th>
                  <th className="text-left py-2 pr-3">Source</th>
                  <th className="text-right py-2">Scraped</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent.leads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 max-w-[180px] truncate">
                      {lead.owner_name || "—"}
                    </td>
                    <td className="py-1.5 pr-3">{lead.state_abbr}</td>
                    <td className="py-1.5 pr-3 max-w-[160px] truncate text-xs">
                      {lead.county || "—"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {fmtMoney(lead.overage_amount)}
                    </td>
                    <td className="py-1.5 pr-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {lead.source || "—"}
                    </td>
                    <td className="py-1.5 text-xs text-right text-muted-foreground">
                      {fmtTime(lead.scraped_at)}
                    </td>
                  </tr>
                ))}
                {(!stats?.recent.leads || stats.recent.leads.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-4 text-muted-foreground italic text-center">
                      No leads inserted yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
