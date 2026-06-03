"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Inbox, RefreshCw, Loader2, Search, UserCheck, CheckSquare, Square } from "lucide-react"

interface Lead {
  id: string
  owner_name: string | null
  property_address: string | null
  city: string | null
  state_abbr: string | null
  county: string | null
  surplus_county: string | null
  overage_amount: number | null
  primary_phone: string | null
  primary_email: string | null
  source: string | null
  dnc_checked: boolean | null
  lead_tier: string | null
}
interface StateOpt { state: string; count: number }
interface Agent { pinId: string; name: string; email: string }

function money(n: number | null) {
  if (n == null) return "—"
  return "$" + Math.round(n).toLocaleString("en-US")
}

export default function FreshLeadsPage() {
  const [states, setStates] = useState<StateOpt[]>([])
  const [state, setState] = useState("ALL")
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [agents, setAgents] = useState<Agent[]>([])
  const [agentQuery, setAgentQuery] = useState("")
  const [agent, setAgent] = useState<Agent | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const loadStates = useCallback(async () => {
    const r = await fetch("/api/admin/fresh-leads?states=1")
    const j = await r.json()
    setStates(j.states || [])
  }, [])

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    const r = await fetch(`/api/admin/fresh-leads?state=${encodeURIComponent(state)}&limit=500`)
    const j = await r.json()
    setLeads(j.leads || [])
    setLoading(false)
  }, [state])

  useEffect(() => { loadStates() }, [loadStates])
  useEffect(() => { loadLeads() }, [loadLeads])

  // Agent search (typeahead over active operator pins).
  useEffect(() => {
    let active = true
    if (agentQuery.trim().length < 2) { setAgents([]); return }
    fetch(`/api/admin/fresh-leads?agents=${encodeURIComponent(agentQuery)}`)
      .then((r) => r.json())
      .then((j) => { if (active) setAgents(j.agents || []) })
    return () => { active = false }
  }, [agentQuery])

  const allSelected = leads.length > 0 && selected.size === leads.length
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)))
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const totalSurplus = useMemo(
    () => leads.filter((l) => selected.has(l.id)).reduce((s, l) => s + (l.overage_amount || 0), 0),
    [leads, selected]
  )

  async function issue() {
    if (!agent || selected.size === 0) return
    setIssuing(true)
    setMsg(null)
    const r = await fetch("/api/admin/fresh-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadIds: [...selected],
        pinId: agent.pinId,
        agentName: agent.name,
      }),
    })
    const j = await r.json()
    setIssuing(false)
    if (!r.ok) { setMsg(`Error: ${j.error || "failed"}`); return }
    setMsg(`Issued ${j.issued} lead(s) to ${agent.name}${j.skipped ? ` (${j.skipped} skipped — already assigned)` : ""}.`)
    setAgent(null); setAgentQuery("")
    loadLeads(); loadStates()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Inbox className="w-7 h-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold">Fresh Leads</h1>
            <p className="text-sm text-gray-500">
              Verified, DNC-clean, $5k+ county-direct leads ready to issue.
            </p>
          </div>
        </div>
        <button onClick={() => { loadLeads(); loadStates() }}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* State filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setState("ALL")}
          className={`px-3 py-1.5 text-sm rounded-full border ${state === "ALL" ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-gray-50"}`}>
          All ({states.reduce((s, x) => s + x.count, 0)})
        </button>
        {states.map((s) => (
          <button key={s.state} onClick={() => setState(s.state)}
            className={`px-3 py-1.5 text-sm rounded-full border ${state === s.state ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-gray-50"}`}>
            {s.state} ({s.count})
          </button>
        ))}
      </div>

      {/* Issue bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
        <span className="text-sm font-medium">
          {selected.size} selected · {money(totalSurplus)} total surplus
        </span>
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={agent ? agent.name : agentQuery}
              onChange={(e) => { setAgent(null); setAgentQuery(e.target.value) }}
              placeholder="Search agent by name or email…"
              className="text-sm outline-none w-64"
            />
          </div>
          {agents.length > 0 && !agent && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
              {agents.map((a) => (
                <button key={a.pinId} onClick={() => { setAgent(a); setAgents([]) }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  <span className="font-medium">{a.name}</span>
                  {a.email && <span className="text-gray-500"> · {a.email}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={issue} disabled={!agent || selected.size === 0 || issuing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700">
          {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          Issue to agent
        </button>
        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 w-10">
                <button onClick={toggleAll}>
                  {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="p-2 text-left">Owner</th>
              <th className="p-2 text-left">Property</th>
              <th className="p-2 text-left">State</th>
              <th className="p-2 text-left">County</th>
              <th className="p-2 text-right">Surplus</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Source</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin inline" /> Loading…
              </td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">
                No fresh deliverable leads{state !== "ALL" ? ` in ${state}` : ""}.
              </td></tr>
            ) : leads.map((l) => (
              <tr key={l.id}
                className={`border-t hover:bg-emerald-50/40 cursor-pointer ${selected.has(l.id) ? "bg-emerald-50" : ""}`}
                onClick={() => toggle(l.id)}>
                <td className="p-2 text-center">
                  {selected.has(l.id) ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                </td>
                <td className="p-2 font-medium">{l.owner_name || "—"}</td>
                <td className="p-2 text-gray-600">{l.property_address || "—"}{l.city ? `, ${l.city}` : ""}</td>
                <td className="p-2">{l.state_abbr || "—"}</td>
                <td className="p-2">{l.county || l.surplus_county || "—"}</td>
                <td className="p-2 text-right font-semibold text-emerald-700">{money(l.overage_amount)}</td>
                <td className="p-2">{l.primary_phone || "—"}</td>
                <td className="p-2 text-xs text-gray-500">{l.source || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
