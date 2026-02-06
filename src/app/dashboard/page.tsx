"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Users,
  TrendingUp,
  Phone,
  CheckCircle,
  ArrowUpRight,
  Clock,
  MapPin,
  Database,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CountyMap } from "@/components/county-map"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/components/theme-provider"

interface DashboardStats {
  totalLeads: number
  skipTraced: number
  withPhone: number
  withEmail: number
  newLeads: number
  failedTraces: number
  dncCleared: number
}

interface RecentLead {
  id: string
  ownerName: string
  address: string
  city: string
  state: string
  saleAmount: number
  status: string
  scrapedAt: string
  primaryPhone: string | null
}

interface StateCount {
  state: string
  count: number
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  skip_traced: "bg-purple-500/10 text-purple-600",
  contacted: "bg-yellow-500/10 text-yellow-600",
  callback: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [topStates, setTopStates] = useState<StateCount[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all leads with minimal columns for stats
        const { data: leads, error } = await supabase
          .from("foreclosure_leads")
          .select("id,status,primary_phone,primary_email,state_abbr,can_contact,dnc_checked,on_dnc")
          .limit(15000) as { data: Record<string, unknown>[] | null; error: unknown }

        if (error || !leads) {
          setLoading(false)
          return
        }

        // Calculate stats
        const total = leads.length
        const skipTraced = leads.filter(l => l.status === "skip_traced").length
        const withPhone = leads.filter(l => l.primary_phone && String(l.primary_phone).trim() !== "").length
        const withEmail = leads.filter(l => l.primary_email && String(l.primary_email).trim() !== "").length
        const newLeads = leads.filter(l => l.status === "new").length
        const failed = leads.filter(l => l.status === "failed").length
        const dncCleared = leads.filter(l => l.can_contact === true && l.dnc_checked === true && l.on_dnc === false).length

        setStats({
          totalLeads: total,
          skipTraced: skipTraced,
          withPhone: withPhone,
          withEmail: withEmail,
          newLeads: newLeads,
          failedTraces: failed,
          dncCleared: dncCleared,
        })

        // Calculate top states
        const stateCounts: Record<string, number> = {}
        for (const lead of leads) {
          const st = String(lead.state_abbr || "")
          if (st) {
            stateCounts[st] = (stateCounts[st] || 0) + 1
          }
        }
        const sorted = Object.entries(stateCounts)
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 7)
        setTopStates(sorted)

        // Fetch recent leads (latest 8)
        const { data: recent } = await supabase
          .from("foreclosure_leads")
          .select("id,owner_name,property_address,city,state_abbr,sale_amount,status,scraped_at,primary_phone")
          .order("created_at", { ascending: false })
          .limit(8) as { data: Record<string, unknown>[] | null; error: unknown }

        if (recent) {
          setRecentLeads(recent.map(r => ({
            id: String(r.id),
            ownerName: String(r.owner_name || "Unknown"),
            address: String(r.property_address || ""),
            city: String(r.city || ""),
            state: String(r.state_abbr || ""),
            saleAmount: Number(r.sale_amount) || 0,
            status: String(r.status || "new"),
            scrapedAt: String(r.scraped_at || ""),
            primaryPhone: r.primary_phone ? String(r.primary_phone) : null,
          })))
        }

        setLastUpdated(new Date())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const STATE_NAMES: Record<string, string> = {
    OH: "Ohio", IL: "Illinois", TX: "Texas", GA: "Georgia", MD: "Maryland",
    FL: "Florida", WA: "Washington", CA: "California", AZ: "Arizona", NY: "New York",
    PA: "Pennsylvania", NC: "North Carolina", MI: "Michigan", NJ: "New Jersey",
    VA: "Virginia", CO: "Colorado", OR: "Oregon", SC: "South Carolina", IN: "Indiana",
    TN: "Tennessee", AL: "Alabama", KY: "Kentucky", MO: "Missouri", WI: "Wisconsin",
    MN: "Minnesota", NV: "Nevada", OK: "Oklahoma", AR: "Arkansas", MS: "Mississippi",
    KS: "Kansas", IA: "Iowa", UT: "Utah", NE: "Nebraska", NM: "New Mexico",
    WV: "West Virginia", ID: "Idaho", HI: "Hawaii", NH: "New Hampshire", ME: "Maine",
    MT: "Montana", RI: "Rhode Island", DE: "Delaware", SD: "South Dakota",
    ND: "North Dakota", AK: "Alaska", VT: "Vermont", WY: "Wyoming", CT: "Connecticut",
    LA: "Louisiana", MA: "Massachusetts",
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading pipeline data...</p>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const maxStateCount = topStates.length > 0 ? topStates[0].count : 1

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your foreclosure leads and recovery pipeline.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/leads">
            <Button style={{ backgroundColor: '#1E3A5F', color: '#ffffff' }}>View All Leads</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-blue-600">{stats.newLeads.toLocaleString()} pending trace</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Skip Traced</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.skipTraced.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">{stats.totalLeads > 0 ? Math.round((stats.skipTraced / stats.totalLeads) * 100) : 0}% enriched</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">With Phone</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withPhone.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs">
                <Mail className="h-3 w-3 text-blue-500" />
                <span className="text-muted-foreground">{stats.withEmail.toLocaleString()} with email</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">DNC Cleared</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dncCleared.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">Ready to contact</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive County Map */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lead Distribution Map</CardTitle>
            <CardDescription>
              Interactive map showing leads by county. Blue = Judicial states, Red = Non-judicial states.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CountyMap isDark={isDark} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest foreclosure leads added to the database</CardDescription>
            </div>
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeads.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No leads found.</p>
              )}
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{lead.ownerName}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {lead.state}
                      </Badge>
                      {lead.primaryPhone && (
                        <Phone className="h-3 w-3 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{lead.address}{lead.city ? `, ${lead.city}` : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right hidden sm:block">
                      {lead.saleAmount > 0 && (
                        <div className="font-medium">
                          ${lead.saleAmount.toLocaleString()}
                        </div>
                      )}
                      {lead.scrapedAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo(lead.scrapedAt)}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={statusColors[lead.status] || statusColors.new}
                    >
                      {lead.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top States */}
        <Card>
          <CardHeader>
            <CardTitle>Top States</CardTitle>
            <CardDescription>Lead count by state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStates.map((state, i) => (
                <div key={state.state} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{STATE_NAMES[state.state] || state.state}</span>
                      <span className="text-sm text-muted-foreground">
                        {state.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(state.count / maxStateCount) * 100}%`,
                          backgroundColor: '#1E3A5F',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Update Notice */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              {lastUpdated
                ? `Data loaded: ${lastUpdated.toLocaleTimeString()}`
                : "Connecting to database..."}
            </span>
          </div>
          {stats && (
            <span className="text-sm text-muted-foreground">
              {stats.failedTraces > 0 ? `${stats.failedTraces} failed traces` : "Pipeline healthy"}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
