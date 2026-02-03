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
} from "lucide-react"

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

export default function AdminPage() {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || ""
  const isAdmin = email === ADMIN_EMAIL

  const [pins, setPins] = useState<PinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPin, setNewPin] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  useEffect(() => {
    if (isAdmin) fetchPins()
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
