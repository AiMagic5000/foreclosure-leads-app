"use client"

import { useState, useEffect, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Upload, Loader2 } from "lucide-react"
import { FileFolder } from "@/components/file-folder"

interface Doc { name: string; label: string; url: string; created: string | null; size: number }

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

  async function rename(name: string, label: string) {
    await fetch("/api/user/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, label, folder, asPinId: pinId }),
    })
    await load()
  }

  return (
    <div className="space-y-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1E3A5F] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? "Uploading…" : "Upload files"}
        <input type="file" multiple accept={accept} onChange={onFiles} disabled={busy} className="hidden" />
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading your documents…</div>
        ) : docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">No documents yet. Uploaded files will be saved here and appear every time you return.</p>
        ) : (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-6 sm:grid-cols-3">
            {docs.map((d) => (
              <FileFolder
                key={d.name}
                label={d.label}
                onRename={(next) => rename(d.name, next)}
                onDownload={() => window.open(d.url, "_blank")}
                onDelete={() => del(d.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
