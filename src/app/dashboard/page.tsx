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
  pendingTrace: number
  failedTraces: number
  dncCleared: number
  tracedContact: number    // traced leads that returned a phone/email
  enrichmentPct: number    // real: tracedContact / traced (skip-trace success rate)
  dncCleanPct: number      // real: DNC-clean / DNC-checked
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

// Judicial foreclosure states (court process) — badge BLUE; everything else
// is non-judicial — badge RED. Matches the county map legend.
const JUDICIAL_STATES = new Set([
  "CT", "DE", "FL", "HI", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "NE", "NJ", "NM", "NY", "ND", "OH", "OK",
  "PA", "SC", "SD", "VT", "WI",
])
const isJudicial = (st: string) => JUDICIAL_STATES.has((st || "").toUpperCase())

// --- Live-feed mock leads: 100 entries, 50/50 judicial/non-judicial so the
// red/blue state badges stay balanced. Deterministic (no Math.random) so server
// and client render identically (no hydration mismatch). ---
const JUDICIAL_LIST = Array.from(JUDICIAL_STATES)
const NON_JUDICIAL_LIST = [
  "AL", "AK", "AZ", "CA", "CO", "GA", "ID", "MI", "MN", "MS",
  "MO", "MT", "NV", "NH", "NC", "OR", "RI", "TN", "TX", "UT",
  "VA", "WA", "WV", "WY",
]
const MOCK_FIRST = ["James", "Maria", "Robert", "Linda", "Michael", "Patricia", "David", "Jennifer", "William", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Karen", "Charles", "Nancy", "Daniel", "Lisa", "Matthew", "Sandra", "Anthony", "Ashley", "Mark", "Kimberly", "Donald", "Emily", "Steven", "Donna", "Gabriel", "Natalie", "Angela", "Giovanni", "Benjamin", "Justus", "Kevin", "Janice", "Carlos", "Denise"]
const MOCK_LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young"]
const MOCK_STREET = ["Maple Ave", "Oak St", "Pine Dr", "Cedar Ln", "Elm St", "Trails Court", "Doyle Dr", "Timothy Dr", "Glenwood St", "Mustang Canyon Way", "Beechnut Dr", "Gaddis Ave", "Mesquite Court", "Sunset Blvd", "Lakeview Dr", "Hillcrest Rd", "Magnolia St", "Birch Way", "Willow Bend", "Ridgeline Dr"]
const MOCK_CITY = ["Springfield", "Riverside", "Franklin", "Clinton", "Georgetown", "Salem", "Madison", "Arlington", "Centerville", "Fairview", "Manchester", "Oakland", "Ashland", "Burlington", "Kingston", "Dayton", "Newport", "Bristol", "Milton", "Auburn"]

const MOCK_FEED = Array.from({ length: 100 }, (_, i) => {
  const judicial = i % 2 === 0
  const states = judicial ? JUDICIAL_LIST : NON_JUDICIAL_LIST
  return {
    id: `mock-${i}`,
    first: MOCK_FIRST[(i * 3) % MOCK_FIRST.length],
    last: MOCK_LAST[(i * 7) % MOCK_LAST.length],
    street: `${100 + ((i * 137) % 9800)} ${MOCK_STREET[(i * 5) % MOCK_STREET.length]}`,
    city: MOCK_CITY[(i * 11) % MOCK_CITY.length],
    state: states[(i >> 1) % states.length],
    ago: `${1 + (i % 23)}h ago`,
    hasPhone: i % 4 !== 0,
  }
})

export default function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topStates, setTopStates] = useState<StateCount[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Exact total via COUNT (not subject to row-limit caps) so it reflects
        // the real number of leads in the system, not a fetch ceiling.
        const { count: exactTotal } = await supabase
          .from("foreclosure_leads")
          .select("*", { count: "exact", head: true }) as { count: number | null }

        // Fetch leads (minimal columns) for the breakdown stats + top states.
        const { data: leads, error } = await supabase
          .from("foreclosure_leads")
          .select("id,status,primary_phone,primary_email,state_abbr,can_contact,dnc_checked,on_dnc,skip_traced_at")
          .limit(100000) as { data: Record<string, unknown>[] | null; error: unknown }

        if (error || !leads) {
          setLoading(false)
          return
        }

        // Calculate stats — real total from the count, fall back to fetched length.
        const total = exactTotal ?? leads.length
        const skipTraced = leads.filter(l => l.status === "skip_traced").length
        const withPhone = leads.filter(l => l.primary_phone && String(l.primary_phone).trim() !== "").length
        const withEmail = leads.filter(l => l.primary_email && String(l.primary_email).trim() !== "").length
        const newLeads = leads.filter(l => l.status === "new").length
        const failed = leads.filter(l => l.status === "failed").length
        // Real rates (ratios hold even if the fetch is a large sample).
        const hasContact = (l: Record<string, unknown>) =>
          (l.primary_phone && String(l.primary_phone).trim() !== "") || (l.primary_email && String(l.primary_email).trim() !== "")
        // Skip-trace SUCCESS rate: of leads we actually skip-traced, how many
        // came back with a phone or email. This is the honest "enrichment" number
        // (denominator = traced leads, not the raw county backlog that was never traced).
        const traced = leads.filter(l => l.skip_traced_at != null).length
        const tracedContact = leads.filter(l => l.skip_traced_at != null && hasContact(l)).length
        const enrichmentPct = traced > 0 ? Math.round((tracedContact / traced) * 100) : 0
        // Ready to contact = leads with a phone/email that are NOT on the DNC list.
        // (The actual dial/SMS gate still requires dnc_checked=true — enforced in
        // the outreach paths, not here. This card reflects reachable inventory.)
        const contactable = leads.filter(hasContact).length
        const dncCleared = leads.filter(l => hasContact(l) && l.on_dnc !== true).length
        const dncCleanPct = contactable > 0 ? Math.round((dncCleared / contactable) * 100) : 0

        setStats({
          totalLeads: total,
          skipTraced: skipTraced,
          withPhone: withPhone,
          withEmail: withEmail,
          newLeads: newLeads,
          pendingTrace: Math.max(0, total - traced),
          failedTraces: failed,
          dncCleared: dncCleared,
          tracedContact: tracedContact,
          enrichmentPct,
          dncCleanPct,
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
                <span className="text-blue-600">{stats.pendingTrace.toLocaleString()} pending trace</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Skip Traced</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enrichmentPct}%</div>
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">{stats.tracedContact.toLocaleString()} skip-traced leads enriched</span>
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
              <div className="text-2xl font-bold">{stats.dncCleanPct}%</div>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">{stats.dncCleared.toLocaleString()} clean &amp; ready to contact</span>
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
            <Link href="/dashboard/my-leads">
              <Button size="sm" className="bg-[#1E3A5F] text-white hover:bg-[#2d4a6f]">
                View all
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="relative h-[400px] overflow-hidden group">
              {/* keyframes for the vertical live-feed scroll */}
              <style>{`@keyframes leadfeed { from { transform: translateY(0); } to { transform: translateY(-50%); } }`}</style>
              {/* fade top/bottom edges */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-background to-transparent" />
              <div className="flex flex-col gap-3 animate-[leadfeed_90s_linear_infinite] group-hover:[animation-play-state:paused]">
                {[...MOCK_FEED, ...MOCK_FEED].map((lead, idx) => {
                  const judicial = isJudicial(lead.state)
                  return (
                    <div
                      key={`${lead.id}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {lead.first} <span className="blur-[5px] select-none">{lead.last}</span>
                          </span>
                          <Badge
                            title={`${judicial ? "Judicial" : "Non-judicial"} state`}
                            className={`text-xs shrink-0 cursor-help text-white ${
                              judicial ? "bg-blue-600 hover:bg-blue-600" : "bg-red-600 hover:bg-red-600"
                            }`}
                          >
                            {lead.state}
                          </Badge>
                          {lead.hasPhone && (
                            <Phone className="h-3 w-3 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {lead.street}, <span className="blur-[5px] select-none">{lead.city}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {lead.ago}
                        </div>
                        <Badge className={statusColors.new}>new</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
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
              {topStates.map((state, i) => {
                const judicial = isJudicial(state.state)
                const color = judicial ? '#2563eb' : '#dc2626'
                return (
                  <div key={state.state} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="font-medium flex items-center gap-1.5 cursor-help"
                          title={`${judicial ? 'Judicial' : 'Non-judicial'} state`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {STATE_NAMES[state.state] || state.state}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {state.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(state.count / maxStateCount) * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
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
