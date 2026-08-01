"use client"

import { useAgentManager } from "@/components/agent-manager-modal"
import { useEffect, useState, useCallback, Fragment } from "react"
import { useUser } from "@clerk/nextjs"
import { Scale, Loader2, CheckCircle2, Search, Gavel, Lock, Map as MapIcon } from "lucide-react"
import { UPGRADE_URL } from "@/lib/upgrade"
import { Badge } from "@/components/ui/badge"
import { usePin } from "@/lib/pin-context"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

interface Rule {
  state: string
  state_name: string
  foreclosure_type: string | null
  covers: string | null
  claim_deadline_months: number | null
  nonattorney_recovery_allowed: string | null
  fee_cap_pct: number | null
  fee_cap_text: string | null
  solicitation_restrictions: string | null
  statute_refs: string | null
  legal_status: string
  research_confidence: string | null
  notes: string | null
}

// Answers the practical disbursement question per state: can the county split the
// surplus check (pay the recovery fee directly, remainder to the claimant), or must
// an attorney receive the funds and disburse them per the signed agreement? Derived
// from the state's non-attorney rule plus the known "no assignment" hard cases. Like
// every row on this page it is a research draft pending counsel verification.
function disbursement(r: Rule): { label: string; cls: string; detail: string } {
  const na = (r.nonattorney_recovery_allowed || "").toLowerCase()
  const noAssignment = ["TX", "SC", "WI", "VT", "DC"].includes(r.state)
  if (na === "no" || noAssignment) {
    return {
      label: "Attorney disburses",
      cls: "bg-red-100 text-red-700",
      detail:
        "County will not split a check to a non-attorney and will not honor a direct assignment. The surplus is released to the claimant (or claimant + attorney jointly); the attorney receives it into trust (IOLTA) and disburses per the signed fee agreement.",
    }
  }
  if (na === "restricted") {
    return {
      label: "Split by court order",
      cls: "bg-amber-100 text-amber-700",
      detail:
        "Split disbursement is permitted only on a court-approved motion or assignment. Cleanest path: an attorney files for disbursement so the court pays the fee directly and the balance to the claimant — otherwise the attorney receives and disburses the funds through trust.",
    }
  }
  return {
    label: "Split allowed w/ agreement",
    cls: "bg-emerald-100 text-emerald-700",
    detail:
      "With a valid written fee agreement or assignment, the court/county can order a split disbursement — the recovery fee paid directly and the balance to the claimant. An attorney may still be named to receive and disburse the funds through trust per the agreement.",
  }
}

export default function StateRulesPage() {
  const { openAgentManager } = useAgentManager()
  const { user } = useUser()
  const { accountType, isAdmin: pinAdmin } = usePin()
  const isAdmin = pinAdmin || user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() === ADMIN_EMAIL
  const canView = isAdmin || accountType !== "basic"
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [saving, setSaving] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/state-rules")
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Failed")
      setRules(j.rules || [])
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (canView) load() }, [canView, load])

  async function patch(state: string, fields: Partial<Rule>) {
    setSaving(state)
    try {
      const res = await fetch("/api/admin/state-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, fields }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Save failed")
      setRules((rs) => rs.map((r) => (r.state === state ? j.rule : r)))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(null)
    }
  }

  if (!canView) return (
    <div className="mx-auto max-w-xl p-8">
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-violet-500" />
        <h2 className="mt-4 text-xl font-bold text-[#0f172a]">State Rules is a paid feature</h2>
        <p className="mt-2 text-sm text-slate-600">Detailed state-by-state recovery rules - fee caps, claim deadlines, solicitation limits, and statute references - are included with any paid plan. Upgrade to unlock all 50 states, or browse the free State Laws overview.</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={openAgentManager} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D82221] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">Upgrade Your Plan</button>
          <a href="/dashboard/states" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#1E3A5F] transition hover:bg-white"><MapIcon className="h-4 w-4" /> View State Laws (free)</a>
        </div>
      </div>
    </div>
  )
  if (loading) return <div className="flex items-center justify-center p-16"><Loader2 className="h-6 w-6 animate-spin text-[#09274C]" /></div>

  const filtered = rules.filter((r) => !q || r.state.includes(q.toUpperCase()) || r.state_name.toLowerCase().includes(q.toLowerCase()))
  const verified = rules.filter((r) => r.legal_status === "verified").length

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Scale className="h-7 w-7 text-[#09274C]" />
          <div>
            <h1 className="text-2xl font-bold text-[#09274C]">State Rules — Surplus Compliance</h1>
            <p className="text-sm text-slate-500">{verified}/{rules.length} counsel-verified. Flip a state to verified only after legal review.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search state..." className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err} — has migration 005/006 been applied?</div>}

      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        All rows are research drafts (statute-cited, agent-researched 2026-06-01) marked <strong>unverified</strong>. The gate runs in shadow mode until you verify. <strong>Hard cases:</strong> TX/VT (non-attorney barred / assignment void), DC (no tax surplus returned), SC/WI (no assignment honored).
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-[#09274C] text-white">
            <tr>
              <th className="px-3 py-2 text-left">State</th>
              <th className="px-3 py-2 text-left">Non-atty</th>
              <th className="px-3 py-2 text-left">Fee cap</th>
              <th className="px-3 py-2 text-left">Deadline</th>
              <th className="px-3 py-2 text-left" title="Can the county split the surplus check (fee paid directly, balance to claimant), or must an attorney receive and disburse the funds per the agreement?">Check split?</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const d = disbursement(r)
              return (
              <Fragment key={r.state}>
                <tr className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-semibold text-[#09274C]">{r.state} <span className="font-normal text-slate-400">{r.state_name}</span></td>
                  <td className="px-3 py-2">
                    <Badge className={
                      r.nonattorney_recovery_allowed === "no" ? "bg-red-100 text-red-700"
                      : r.nonattorney_recovery_allowed === "restricted" ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                    }>
                      {r.nonattorney_recovery_allowed === "no" && <Gavel className="mr-1 inline h-3 w-3" />}
                      {r.nonattorney_recovery_allowed || "?"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.fee_cap_pct != null ? `${r.fee_cap_pct}%` : (r.fee_cap_text ? "flat/none" : "none")}</td>
                  <td className="px-3 py-2 text-slate-600">{r.claim_deadline_months ? `${r.claim_deadline_months} mo` : "—"}</td>
                  <td className="px-3 py-2"><Badge className={d.cls}>{d.label}</Badge></td>
                  <td className="px-3 py-2">
                    {r.legal_status === "verified"
                      ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="mr-1 inline h-3 w-3" />verified</Badge>
                      : <Badge className="bg-blue-100 text-blue-700"><CheckCircle2 className="mr-1 inline h-3 w-3" />Current 2026</Badge>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setOpen(open === r.state ? null : r.state)} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">{open === r.state ? "Hide" : "Details"}</button>
                    {r.legal_status !== "verified"
                      ? <button disabled={saving === r.state} onClick={() => patch(r.state, { legal_status: "verified" })} className="ml-3 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50">{saving === r.state ? "..." : "Verify"}</button>
                      : <button disabled={saving === r.state} onClick={() => patch(r.state, { legal_status: "unverified" })} className="ml-3 rounded bg-slate-400 px-2 py-1 text-xs font-medium text-white disabled:opacity-50">Unverify</button>}
                  </td>
                </tr>
                {open === r.state && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-4 py-3 text-xs text-slate-600">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div><strong>Fee cap:</strong> {r.fee_cap_text || "—"}</div>
                        <div><strong>Statutes:</strong> {r.statute_refs || "—"}</div>
                        <div><strong>Solicitation:</strong> {r.solicitation_restrictions || "—"}</div>
                        <div><strong>Confidence:</strong> {r.research_confidence || "—"}</div>
                        <div className="md:col-span-2"><strong>Check split / disbursement:</strong> {d.detail}</div>
                        <div className="md:col-span-2"><strong>Notes:</strong> {r.notes || "—"}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}
