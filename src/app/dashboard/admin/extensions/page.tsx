"use client"

import { useEffect, useState, useCallback } from "react"
import { usePin } from "@/lib/pin-context"

type Ext = { extension: string; forwarding_phone?: string; agent_name?: string; agent_email?: string; active?: boolean; ai_cover?: boolean }

export default function ExtensionsAdminPage() {
  const { isAdmin, isRealAdmin, isLoading } = usePin()
  const admin = isAdmin || isRealAdmin
  const [rows, setRows] = useState<Ext[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState({ extension: "", forwarding_phone: "", agent_name: "", agent_email: "" })

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/pbx-extensions")
      const d = await r.json()
      setRows(d.extensions || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && admin) refresh()
  }, [isLoading, admin, refresh])

  const add = async () => {
    setSaving(true); setMsg(null)
    try {
      const r = await fetch("/api/admin/pbx-extensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setMsg(d.error || "Failed"); return }
      setMsg(`Saved extension ${d.extension} -> ${d.forwarding_phone}`)
      setForm({ extension: "", forwarding_phone: "", agent_name: "", agent_email: "" })
      refresh()
    } finally {
      setSaving(false)
    }
  }

  const del = async (extension: string) => {
    if (!confirm(`Remove extension ${extension}?`)) return
    await fetch(`/api/admin/pbx-extensions?extension=${extension}`, { method: "DELETE" })
    refresh()
  }

  const toggleAi = async (extension: string, on: boolean) => {
    setRows((prev) => prev.map((r) => (r.extension === extension ? { ...r, ai_cover: on } : r)))
    await fetch("/api/admin/pbx-extensions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_ai", extension, ai_cover: on }),
    })
    refresh()
  }

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>
  if (!admin) return <div className="p-8 text-red-600">Admins only.</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#09274c]">Phone Extensions (888-907-3234)</h1>
      <p className="mt-1 text-sm text-gray-600">
        Callers dial the toll-free line, enter an extension, and the call forwards to that agent&apos;s cell — recorded automatically.
        Add as many as you want (no per-extension cost). Existing dashboard users are not affected.
      </p>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-[#09274c] mb-3">Add / update an extension</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Extension (e.g. 105)"
            value={form.extension} onChange={(e) => setForm({ ...form, extension: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Forwarding cell (e.g. 2035551234)"
            value={form.forwarding_phone} onChange={(e) => setForm({ ...form, forwarding_phone: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Agent name (optional)"
            value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Agent email (optional)"
            value={form.agent_email} onChange={(e) => setForm({ ...form, agent_email: e.target.value })} />
        </div>
        <button onClick={add} disabled={saving}
          className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded bg-[#09274c] text-white text-sm font-medium disabled:opacity-50">
          {saving ? "Saving…" : "Save extension"}
        </button>
        {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
      </div>

      <div className="mt-6 rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Ext</th>
              <th className="text-left px-4 py-2">Forwards to</th>
              <th className="text-left px-4 py-2">Agent</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">AI covers me</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No extensions yet. Add one above.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.extension} className="border-t">
                <td className="px-4 py-2 font-semibold text-[#09274c]">{r.extension}</td>
                <td className="px-4 py-2">{r.forwarding_phone || "—"}</td>
                <td className="px-4 py-2">{r.agent_name || "—"}{r.agent_email ? ` (${r.agent_email})` : ""}</td>
                <td className="px-4 py-2">{r.active === false ? <span className="text-gray-400">Off</span> : <span className="text-emerald-600">Active</span>}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleAi(r.extension, !r.ai_cover)}
                    title="When ON, calls to this extension are answered by the AI assistant, which takes a message and emails you."
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                      r.ai_cover
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-500 border-gray-300 hover:border-amber-400"
                    }`}
                  >
                    {r.ai_cover ? "🤖 AI ON" : "AI off"}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => del(r.extension)} className="text-red-600 hover:underline text-xs">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
