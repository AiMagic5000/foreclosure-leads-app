"use client"

import { useState, useEffect, useCallback, useMemo, Fragment } from "react"
import { Inbox, RefreshCw, Loader2, Search, UserCheck, CheckSquare, Square, ChevronDown, ChevronRight, AlertTriangle, X } from "lucide-react"

interface Lead {
  id: string
  owner_name: string | null
  property_address: string | null
  mailing_address: string | null
  city: string | null
  state: string | null
  state_abbr: string | null
  zip_code: string | null
  county: string | null
  surplus_county: string | null
  parcel_id: string | null
  apn_number: string | null
  overage_amount: number | null
  sale_amount: number | null
  mortgage_amount: number | null
  sale_date: string | null
  lender_name: string | null
  foreclosure_type: string | null
  primary_phone: string | null
  secondary_phone: string | null
  primary_email: string | null
  source: string | null
  source_url: string | null
  skip_trace_source: string | null
  skip_traced_at: string | null
  scraped_at: string | null
  dnc_checked: boolean | null
  on_dnc: boolean | null
  can_contact: boolean | null
  dnc_type: string | null
  deed_verified: boolean | null
  deed_data_source: string | null
  lead_tier: string | null
  case_number: string | null
}
interface StateOpt { state: string; count: number }
interface Agent { pinId: string; name: string; email: string }
interface LeadRequest {
  id: string; user_email: string; user_name: string | null; account_type: string | null
  requested_count: number; state_preference: string | null; operator_pin_id: string | null; created_at: string
}

function money(n: number | null) {
  if (n == null) return "—"
  return "$" + Math.round(n).toLocaleString("en-US")
}
function field(label: string, value: unknown) {
  const v = value === null || value === undefined || value === "" ? "—" : String(value)
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-800 break-words">{v}</span>
    </div>
  )
}

export default function FreshLeadsPage() {
  const [states, setStates] = useState<StateOpt[]>([])
  const [state, setState] = useState("ALL")
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [agentQuery, setAgentQuery] = useState("")
  const [agents, setAgents] = useState<Agent[]>([])
  const [agent, setAgent] = useState<Agent | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const [requests, setRequests] = useState<LeadRequest[]>([])
  const [activeRequest, setActiveRequest] = useState<LeadRequest | null>(null)

  const loadStates = useCallback(async () => {
    const r = await fetch("/api/admin/fresh-leads?states=1"); const j = await r.json()
    setStates(j.states || [])
  }, [])
  const loadLeads = useCallback(async () => {
    setLoading(true); setSelected(new Set()); setExpanded(new Set())
    const r = await fetch(`/api/admin/fresh-leads?state=${encodeURIComponent(state)}&limit=500`)
    const j = await r.json(); setLeads(j.leads || []); setLoading(false)
  }, [state])
  const loadRequests = useCallback(async () => {
    const r = await fetch("/api/admin/fresh-leads?requests=1"); const j = await r.json()
    setRequests(j.requests || [])
  }, [])
  useEffect(() => { loadStates() }, [loadStates])
  useEffect(() => { loadLeads() }, [loadLeads])
  useEffect(() => { loadRequests() }, [loadRequests])

  useEffect(() => {
    let active = true
    if (agentQuery.trim().length < 2) { setAgents([]); return }
    fetch(`/api/admin/fresh-leads?agents=${encodeURIComponent(agentQuery)}`)
      .then((r) => r.json()).then((j) => { if (active) setAgents(j.agents || []) })
    return () => { active = false }
  }, [agentQuery])

  function fulfillRequest(req: LeadRequest) {
    setActiveRequest(req)
    if (req.operator_pin_id) setAgent({ pinId: req.operator_pin_id, name: req.user_name || req.user_email, email: req.user_email })
    else setAgentQuery(req.user_name || req.user_email)
    setMsg(`Fulfilling: ${req.requested_count} lead(s) for ${req.user_name || req.user_email}${req.state_preference ? ` · prefers ${req.state_preference}` : ""}. Review the data below, select, then Issue.`)
  }

  const allSelected = leads.length > 0 && selected.size === leads.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)))
  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleExpand = (id: string) => setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selectedLeads = useMemo(() => leads.filter((l) => selected.has(l.id)), [leads, selected])
  const totalSurplus = useMemo(() => selectedLeads.reduce((s, l) => s + (l.overage_amount || 0), 0), [selectedLeads])

  async function confirmIssue() {
    if (!agent || selected.size === 0) return
    setIssuing(true); setMsg(null)
    const r = await fetch("/api/admin/fresh-leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: [...selected], pinId: agent.pinId, agentName: agent.name, requestId: activeRequest?.id }),
    })
    const j = await r.json(); setIssuing(false); setShowConfirm(false)
    if (!r.ok) { setMsg(`Error: ${j.error || "failed"}`); return }
    setMsg(`Issued ${j.issued} lead(s) to ${agent.name}${j.skipped ? ` (${j.skipped} skipped — already assigned)` : ""}.`)
    setAgent(null); setAgentQuery(""); setActiveRequest(null)
    loadLeads(); loadStates(); loadRequests()
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Inbox className="w-7 h-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold">Fresh Leads</h1>
            <p className="text-sm text-gray-500">Verified, DNC-clean, $5k+ county-direct leads. Expand any row to inspect 100% of the data before issuing.</p>
          </div>
        </div>
        <button onClick={() => { loadLeads(); loadStates(); loadRequests() }} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {requests.length > 0 && (
        <div className="mb-4 border border-amber-300 bg-amber-50 rounded-lg p-3">
          <div className="text-sm font-semibold text-amber-900 mb-1">{requests.length} pending agent request{requests.length > 1 ? "s" : ""} — this is what the agent ASKED for, not available inventory</div>
          <div className="text-xs text-amber-700 mb-2">&ldquo;3 leads · prefers NJ, TX&rdquo; = the agent wants 3 leads and prefers those states. Availability is the table below.</div>
          <div className="flex flex-col gap-2">
            {requests.map((req) => (
              <div key={req.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md border bg-white ${activeRequest?.id === req.id ? "ring-2 ring-amber-400" : ""}`}>
                <div className="text-sm">
                  <span className="font-medium">{req.user_name || req.user_email}</span>
                  <span className="text-gray-500"> · {req.account_type || "?"} · </span>
                  <span className="font-semibold text-blue-600">requested {req.requested_count}</span>
                  {req.state_preference && <span className="text-gray-500"> · prefers {req.state_preference} (preference only)</span>}
                </div>
                <button onClick={() => fulfillRequest(req)} className="px-3 py-1 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700">
                  {activeRequest?.id === req.id ? "Selected — pick leads ↓" : "Fulfill"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setState("ALL")} className={`px-3 py-1.5 text-sm rounded-full border ${state === "ALL" ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-gray-50"}`}>
          All ({states.reduce((s, x) => s + x.count, 0)})
        </button>
        {states.map((s) => (
          <button key={s.state} onClick={() => setState(s.state)} className={`px-3 py-1.5 text-sm rounded-full border ${state === s.state ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-gray-50"}`}>
            {s.state} ({s.count})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
        <span className="text-sm font-medium">{selected.size} selected · {money(totalSurplus)} total surplus</span>
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={agent ? agent.name : agentQuery} onChange={(e) => { setAgent(null); setAgentQuery(e.target.value) }} placeholder="Search agent by name or email…" className="text-sm outline-none w-64" />
          </div>
          {agents.length > 0 && !agent && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
              {agents.map((a) => (
                <button key={a.pinId} onClick={() => { setAgent(a); setAgents([]) }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  <span className="font-medium">{a.name}</span>{a.email && <span className="text-gray-500"> · {a.email}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowConfirm(true)} disabled={!agent || selected.size === 0 || issuing} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700">
          <UserCheck className="w-4 h-4" /> Review &amp; issue
        </button>
        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 w-8"></th>
              <th className="p-2 w-10"><button onClick={toggleAll}>{allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}</button></th>
              <th className="p-2 text-left">Owner</th><th className="p-2 text-left">Property</th>
              <th className="p-2 text-left">State</th><th className="p-2 text-left">County</th>
              <th className="p-2 text-right">Surplus</th><th className="p-2 text-left">Phone</th><th className="p-2 text-left">Source</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline" /> Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-400">No fresh deliverable leads{state !== "ALL" ? ` in ${state}` : ""}. (Only leads that pass source + $5k–$5M + DNC + deed-verification appear here.)</td></tr>
            ) : leads.map((l) => (
              <Fragment key={l.id}>
                <tr className={`border-t ${selected.has(l.id) ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                  <td className="p-2 text-center"><button onClick={() => toggleExpand(l.id)}>{expanded.has(l.id) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}</button></td>
                  <td className="p-2 text-center cursor-pointer" onClick={() => toggle(l.id)}>{selected.has(l.id) ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-300" />}</td>
                  <td className="p-2 font-medium cursor-pointer" onClick={() => toggleExpand(l.id)}>{l.owner_name || "—"}</td>
                  <td className="p-2 text-gray-600">{l.property_address || "—"}{l.city ? `, ${l.city}` : ""}</td>
                  <td className="p-2">{l.state_abbr || "—"}</td>
                  <td className="p-2">{l.county || l.surplus_county || "—"}</td>
                  <td className="p-2 text-right font-semibold text-emerald-700">{money(l.overage_amount)}</td>
                  <td className="p-2">{l.primary_phone || "—"}</td>
                  <td className="p-2 text-xs text-gray-500">{l.source || "—"}</td>
                </tr>
                {expanded.has(l.id) && (
                  <tr className="bg-slate-50 border-t">
                    <td colSpan={9} className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                        {field("Owner", l.owner_name)}{field("Property address", l.property_address)}
                        {field("Mailing address", l.mailing_address)}{field("City", l.city)}
                        {field("State", l.state || l.state_abbr)}{field("ZIP", l.zip_code)}
                        {field("County", l.county)}{field("Surplus county", l.surplus_county)}
                        {field("Parcel / APN", l.parcel_id || l.apn_number)}{field("Case #", l.case_number)}
                        {field("Surplus / overage", money(l.overage_amount))}{field("Sale amount", money(l.sale_amount))}
                        {field("Mortgage amount", money(l.mortgage_amount))}{field("Sale date", l.sale_date)}
                        {field("Lender", l.lender_name)}{field("Foreclosure type", l.foreclosure_type)}
                        {field("Primary phone", l.primary_phone)}{field("Secondary phone", l.secondary_phone)}
                        {field("Email", l.primary_email)}{field("Lead tier", l.lead_tier)}
                        {field("Source", l.source)}{field("Source URL", l.source_url)}
                        {field("Skip-trace source", l.skip_trace_source)}{field("Skip-traced at", l.skip_traced_at)}
                        {field("Scraped at", l.scraped_at)}
                        {field("DNC checked", l.dnc_checked ? "yes" : "no")}{field("On DNC", l.on_dnc ? "YES" : "no")}
                        {field("Can contact", l.can_contact ? "yes" : "no")}{field("DNC type", l.dnc_type)}
                        {field("Deed verified", l.deed_verified ? "YES" : "no")}{field("Deed source", l.deed_data_source)}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm-before-transfer modal */}
      {showConfirm && agent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><h2 className="font-semibold">Confirm transfer — {selected.size} lead(s) → {agent.name}</h2></div>
              <button onClick={() => setShowConfirm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-5 py-3 text-sm text-gray-600 border-b">Review each lead below. Once issued, these become {agent.name}&apos;s exclusively and leave this list. Total surplus: <strong>{money(totalSurplus)}</strong>.
              {selectedLeads.some((l) => !(l.dnc_checked && l.can_contact && !l.on_dnc)) && (
                <span className="block mt-1 text-amber-700"><AlertTriangle className="w-4 h-4 inline -mt-0.5" /> Some selected leads are not DNC-cleared (see DNC column). The agent must DNC-scrub before any call/SMS/voicemail.</span>
              )}
            </div>
            <div className="overflow-auto px-5 py-3 flex-1">
              <table className="w-full text-xs">
                <thead className="text-gray-500"><tr><th className="text-left p-1">Owner</th><th className="text-left p-1">Property</th><th className="text-left p-1">St</th><th className="text-left p-1">County</th><th className="text-right p-1">Surplus</th><th className="text-left p-1">Phone</th><th className="text-left p-1">Source</th><th className="text-center p-1">DNC</th><th className="text-center p-1">Deed</th></tr></thead>
                <tbody>
                  {selectedLeads.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-1 font-medium">{l.owner_name || "—"}</td>
                      <td className="p-1">{l.property_address || "—"}{l.city ? `, ${l.city}` : ""}</td>
                      <td className="p-1">{l.state_abbr || "—"}</td><td className="p-1">{l.county || "—"}</td>
                      <td className="p-1 text-right">{money(l.overage_amount)}</td><td className="p-1">{l.primary_phone || "—"}</td>
                      <td className="p-1 text-gray-500">{l.source || "—"}</td>
                      <td className="p-1 text-center">{l.on_dnc ? <span className="text-red-600 font-semibold">DNC</span> : l.dnc_checked && l.can_contact ? <span className="text-emerald-600">clear</span> : <span className="text-amber-500">unchk</span>}</td>
                      <td className="p-1 text-center">{l.deed_verified ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmIssue} disabled={issuing} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700">
                {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Confirm transfer of {selected.size} to {agent.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
