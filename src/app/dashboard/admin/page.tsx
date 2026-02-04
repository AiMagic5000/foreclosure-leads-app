"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Loader2,
  RefreshCw,
  Database,
  Globe,
  Phone,
  Mail,
  MapPin,
  BarChart3,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

const ALL_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
]

interface PinRecord {
  id: string
  email: string
  pin: string
  states_access: string[]
  package_type: string
  gumroad_sale_id: string | null
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

interface LeadStats {
  total: number
  bySource: { source: string; count: number }[]
  byState: { state: string; count: number }[]
  skipTraced: number
  hasEmail: number
  hasPhone: number
  enriched: number
  hasMarketValue: number
}

export default function AdminPage() {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || ""
  const isAdmin = email === ADMIN_EMAIL

  const [pins, setPins] = useState<PinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPin, setNewPin] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [leadStats, setLeadStats] = useState<LeadStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Form state
  const [formEmail, setFormEmail] = useState("")
  const [formStates, setFormStates] = useState<string[]>([])
  const [formPackage, setFormPackage] = useState("five_state")
  const [formGumroadId, setFormGumroadId] = useState("")

  const fetchPins = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pin/manage")
      if (res.ok) {
        const data = await res.json()
        setPins(data.pins || [])
      }
    } catch {
      // handle silently
    }
    setLoading(false)
  }

  const fetchLeadStats = async () => {
    setStatsLoading(true)
    try {
      // Get total count
      const { count: total } = await supabase
        .from("foreclosure_leads")
        .select("*", { count: "exact", head: true })

      // Get all leads for aggregation (source, state, phone, email)
      const { data: leads } = await supabase
        .from("foreclosure_leads")
        .select("source, state, primary_phone, primary_email, skip_traced_at, enriched_at, estimated_market_value")
        .limit(10000)

      if (leads && Array.isArray(leads)) {
        const sourceMap = new Map<string, number>()
        const stateMap = new Map<string, number>()
        let skipTraced = 0
        let hasEmail = 0
        let hasPhone = 0
        let enriched = 0
        let hasMarketValue = 0

        type LeadRow = { source: string | null; state: string | null; primary_phone: string | null; primary_email: string | null; skip_traced_at: string | null; enriched_at: string | null; estimated_market_value: number | null }
        for (const lead of leads as LeadRow[]) {
          const src = lead.source || "unknown"
          sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
          const st = lead.state || "Unknown"
          stateMap.set(st, (stateMap.get(st) || 0) + 1)
          if (lead.skip_traced_at) skipTraced++
          if (lead.primary_email) hasEmail++
          if (lead.primary_phone) hasPhone++
          if (lead.enriched_at) enriched++
          if (lead.estimated_market_value && lead.estimated_market_value > 0) hasMarketValue++
        }

        setLeadStats({
          total: total || leads.length,
          bySource: Array.from(sourceMap.entries())
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count),
          byState: Array.from(stateMap.entries())
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => b.count - a.count),
          skipTraced,
          hasEmail,
          hasPhone,
          enriched,
          hasMarketValue,
        })
      }
    } catch {
      // handle silently
    }
    setStatsLoading(false)
  }

  useEffect(() => {
    if (isAdmin) { fetchPins(); fetchLeadStats(); }
  }, [isAdmin])

  const handleCreate = async () => {
    if (!formEmail || formStates.length === 0) return
    setCreating(true)
    setNewPin(null)
    try {
      const res = await fetch("/api/pin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          states: formStates,
          packageType: formPackage,
          gumroadSaleId: formGumroadId || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewPin(data.pin)
        setFormEmail("")
        setFormStates([])
        setFormGumroadId("")
        fetchPins()
      }
    } catch {
      // handle silently
    }
    setCreating(false)
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    await fetch("/api/pin/manage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !currentActive }),
    })
    fetchPins()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this PIN? This cannot be undone.")) return
    await fetch("/api/pin/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchPins()
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleState = (state: string) => {
    setFormStates(prev =>
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    )
  }

  const selectAllStates = () => setFormStates([...ALL_STATES])
  const clearAllStates = () => setFormStates([])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is restricted to administrators.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin - PIN Management
          </h1>
          <p className="text-muted-foreground">Create and manage access PINs for customers</p>
        </div>
        <Button variant="outline" onClick={fetchPins} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Create PIN Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Email</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Package Type</label>
              <select
                value={formPackage}
                onChange={(e) => setFormPackage(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="five_state">5-State Access ($495)</option>
                <option value="additional_state">Additional State ($175)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gumroad Sale ID (optional)</label>
            <Input
              placeholder="sale_xxxxx"
              value={formGumroadId}
              onChange={(e) => setFormGumroadId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">States ({formStates.length} selected)</label>
              <div className="flex gap-2">
                <button onClick={selectAllStates} className="text-xs text-blue-500 hover:underline">Select All</button>
                <button onClick={clearAllStates} className="text-xs text-red-500 hover:underline">Clear</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border bg-muted/30 max-h-32 overflow-y-auto">
              {ALL_STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => toggleState(state)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    formStates.includes(state)
                      ? "bg-blue-500 text-white"
                      : "bg-background border hover:bg-muted"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating || !formEmail || formStates.length === 0}
            className="w-full"
          >
            {creating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
            ) : (
              <><KeyRound className="h-4 w-4 mr-2" /> Generate PIN</>
            )}
          </Button>

          {newPin && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">PIN Created Successfully</p>
                  <p className="text-2xl font-mono font-bold text-green-900 dark:text-green-100 mt-1">{newPin}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Save this PIN now. It cannot be retrieved later.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newPin, "new-pin")}
                  className="border-green-400"
                >
                  {copiedId === "new-pin" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Data Overview - Admin Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Lead Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : leadStats ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{leadStats.total.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Total Leads</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{leadStats.skipTraced.toLocaleString()}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Skip Traced</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{leadStats.hasPhone.toLocaleString()}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Have Phone</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{leadStats.hasEmail.toLocaleString()}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Have Email</p>
                </div>
              </div>

              {/* Sources and States side by side */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sources */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Lead Sources
                  </h3>
                  <div className="space-y-2">
                    {leadStats.bySource.map(({ source, count }) => (
                      <div key={source} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{source}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(count / leadStats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right">{count.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top States */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Top States ({leadStats.byState.length} total)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {leadStats.byState.slice(0, 15).map(({ state, count }) => (
                      <div key={state} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{state}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${(count / leadStats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right">{count.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enrichment Status */}
              <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Enrichment Status</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                      {leadStats.enriched > 0 ? Math.round((leadStats.enriched / leadStats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-yellow-600">Property Enriched</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                      {leadStats.hasMarketValue > 0 ? Math.round((leadStats.hasMarketValue / leadStats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-yellow-600">Market Value</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                      {leadStats.skipTraced > 0 ? Math.round((leadStats.skipTraced / leadStats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-yellow-600">Skip Traced</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                      {leadStats.hasPhone > 0 ? Math.round((leadStats.hasPhone / leadStats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-yellow-600">Phone Found</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                      {leadStats.hasEmail > 0 ? Math.round((leadStats.hasEmail / leadStats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-yellow-600">Email Found</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Failed to load lead stats.</p>
          )}
        </CardContent>
      </Card>

      {/* PINs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All PINs ({pins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pins.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No PINs created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Email</th>
                    <th className="text-left py-3 px-2 font-medium">States</th>
                    <th className="text-left py-3 px-2 font-medium">Package</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Created</th>
                    <th className="text-left py-3 px-2 font-medium">Last Used</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pins.map((pin) => (
                    <tr key={pin.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{pin.email}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {pin.states_access.slice(0, 5).map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
                          {pin.states_access.length > 5 && (
                            <Badge variant="outline" className="text-[10px]">+{pin.states_access.length - 5}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">
                          {pin.package_type === "five_state" ? "$495" : "$175"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={pin.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {pin.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {new Date(pin.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {pin.last_used_at ? new Date(pin.last_used_at).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(pin.id, pin.is_active)}
                            className="p-1.5 rounded hover:bg-muted"
                            title={pin.is_active ? "Deactivate" : "Activate"}
                          >
                            {pin.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(pin.id)}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
