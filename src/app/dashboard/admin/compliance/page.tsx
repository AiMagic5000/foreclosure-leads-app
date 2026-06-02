"use client"

import { useEffect, useState, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Loader2, FileText, Gavel } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionVideo } from "@/components/section-video"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

interface Summary {
  documents_total: number
  documents_would_pass: number
  documents_would_block: number
  documents_actually_blocked: number
  gate_mode: string
  states_total: number
  states_verified: number
  states_unverified: number
  attorney_only_states: string[]
  copy_reviews_total: number
  copy_reviews_failed: number
}
interface Block {
  id: string
  lead_id: string | null
  state: string | null
  doc_type: string | null
  gate_mode: string | null
  failed_checks: Array<{ name?: string; message?: string }>
  actor: string | null
  created_at: string
}
interface Data {
  summary: Summary
  top_failing_checks: Array<{ name: string; count: number }>
  blocks_by_state: Array<{ state: string; count: number }>
  recent_blocks: Block[]
}

export default function CompliancePage() {
  const { user } = useUser()
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() === ADMIN_EMAIL
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/compliance")
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Failed")
      setData(j)
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  if (!isAdmin) return <div className="p-8 text-center text-slate-500">Admin access required.</div>
  if (loading) return <div className="flex items-center justify-center p-16"><Loader2 className="h-6 w-6 animate-spin text-[#09274C]" /></div>

  const s = data?.summary
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-[#09274C]" />
          <div>
            <h1 className="text-2xl font-bold text-[#09274C]">Compliance Monitor</h1>
            <p className="text-sm text-slate-500">Surplus send-validation gate — what would be blocked, and why.</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-lg bg-[#09274C] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <SectionVideo
        src="/videos/compliance-16x9.mp4"
        poster="/videos/compliance-poster.jpg"
        title="How the compliance gate protects every claim"
        subtitle="The 15 checks, shadow mode, and verifying states before enforce."
        storageKey="video-dismissed-compliance"
      />

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err} — has migration 005 been applied to the database?</div>}

      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Gate mode: {s?.gate_mode?.toUpperCase() || "SHADOW"}.</strong> {s?.gate_mode === "shadow" || !s?.gate_mode
          ? " Documents are logged but never blocked. Verify states below, then switch SURPLUS_GATE_MODE to soft/enforce."
          : " The gate is actively blocking non-compliant sends."}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={<FileText className="h-5 w-5" />} label="Documents evaluated" value={s?.documents_total ?? 0} />
        <Stat icon={<XCircle className="h-5 w-5 text-red-500" />} label="Would block" value={s?.documents_would_block ?? 0} tone="red" />
        <Stat icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label="States verified" value={`${s?.states_verified ?? 0}/${s?.states_total ?? 0}`} />
        <Stat icon={<Gavel className="h-5 w-5 text-amber-500" />} label="Attorney-only states" value={s?.attorney_only_states?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#09274C]"><AlertTriangle className="h-5 w-5" /> Top failing checks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.top_failing_checks || []).length === 0 && <p className="text-sm text-slate-400">No failures logged yet.</p>}
            {(data?.top_failing_checks || []).map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span className="font-mono text-slate-700">{c.name}</span>
                <Badge className="bg-red-100 text-red-700">{c.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#09274C]">Blocks by state</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(data?.blocks_by_state || []).length === 0 && <p className="text-sm text-slate-400">None.</p>}
            {(data?.blocks_by_state || []).map((b) => (
              <Badge key={b.state} className="bg-[#09274C]/10 text-[#09274C]">{b.state}: {b.count}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-[#09274C]">Recent would-block events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(data?.recent_blocks || []).length === 0 && <p className="text-sm text-slate-400">No blocks logged.</p>}
            {(data?.recent_blocks || []).map((b) => (
              <div key={b.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Badge className="bg-slate-200 text-slate-700">{b.state || "??"}</Badge>
                  <span className="text-slate-500">{b.doc_type}</span>
                  <span className="text-xs text-slate-400">{b.actor}</span>
                  <span className="ml-auto text-xs text-slate-400">{new Date(b.created_at).toLocaleString()}</span>
                </div>
                <ul className="ml-4 list-disc text-slate-600">
                  {(b.failed_checks || []).map((f, i) => <li key={i}><span className="font-mono text-xs">{f.name}</span> — {f.message}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone?: "red" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${tone === "red" ? "bg-red-50" : "bg-slate-100"}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-[#09274C]">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
