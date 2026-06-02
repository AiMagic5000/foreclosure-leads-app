"use client"

import { useState, useEffect, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Upload, FileText, Trash2, Loader2, Download, CheckCircle2 } from "lucide-react"

interface Doc { name: string; label: string; url: string; created: string | null; size: number }

function fmtSize(b: number) {
  if (!b) return ""
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

// Persistent per-account document upload. Files are stored in Supabase Storage under
// the agent's pin, so they show up every time they (or an admin viewing-as them) return.
export function DocumentUploader({ folder = "general", accept }: { folder?: string; accept?: string }) {
  const { impersonating } = usePin()
  const pinId = impersonating?.pinId
  const q = `folder=${encodeURIComponent(folder)}${pinId ? `&asPinId=${pinId}` : ""}`

  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/documents?${q}`)
      const d = await res.json()
      setDocs(d.documents || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [q])

  useEffect(() => { load() }, [load])

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setBusy(true); setErr(null)
    try {
      for (const f of files) {
        const fd = new FormData()
        fd.append("file", f)
        fd.append("folder", folder)
        if (pinId) fd.append("asPinId", pinId)
        const res = await fetch(`/api/user/documents?ts=${Date.now()}-${Math.random().toString(36).slice(2)}`, { method: "POST", body: fd })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || "Upload failed")
      }
      await load()
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "Upload failed") } finally { setBusy(false); e.target.value = "" }
  }

  async function del(name: string) {
    await fetch(`/api/user/documents?name=${encodeURIComponent(name)}&${q}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="space-y-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1E3A5F] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? "Uploading…" : "Upload files"}
        <input type="file" multiple accept={accept} onChange={onFiles} disabled={busy} className="hidden" />
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading your documents…</div>
        ) : docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">No documents yet. Uploaded files will be saved here and appear every time you return.</p>
        ) : (
          docs.map((d) => (
            <div key={d.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" />
              <FileText className="h-4 w-4 flex-none text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#0f172a]">{d.label}</span>
              {d.size ? <span className="flex-none text-xs text-slate-400">{fmtSize(d.size)}</span> : null}
              <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label="Download" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-[#1E3A5F]">
                <Download className="h-4 w-4" />
              </a>
              <button onClick={() => del(d.name)} aria-label="Delete" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
