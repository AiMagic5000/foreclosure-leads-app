"use client"

import { useState, useEffect, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Upload, Loader2, ShieldCheck } from "lucide-react"
import { FileFolder } from "@/components/file-folder"

interface Doc { name: string; label: string; url: string; created: string | null; size: number }

// Persistent per-account document upload. Files are stored in Supabase Storage under
// the agent's pin, so they show up every time they (or an admin viewing-as them) return.
// - variant: folder color ("amber" default, "green" for payment/tax docs).
// - attestation: when set, the user must confirm the statement (checkbox) before the
//   upload runs — used for W-9 / payment documents.
export function DocumentUploader({
  folder = "general",
  accept,
  variant = "amber",
  attestation,
}: {
  folder?: string
  accept?: string
  variant?: "amber" | "green"
  attestation?: string
}) {
  const { impersonating } = usePin()
  const pinId = impersonating?.pinId
  const q = `folder=${encodeURIComponent(folder)}${pinId ? `&asPinId=${pinId}` : ""}`

  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  // Attestation flow: files selected while an attestation is required wait here until confirmed.
  const [pending, setPending] = useState<File[]>([])
  const [attestChecked, setAttestChecked] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/documents?${q}`)
      const d = await res.json()
      setDocs(d.documents || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [q])

  useEffect(() => { load() }, [load])

  async function doUpload(files: File[]) {
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
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "Upload failed") } finally { setBusy(false) }
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = "" // allow re-selecting the same file
    if (!files.length) return
    if (attestation) {
      // Hold the files and require the truth attestation before uploading.
      setPending(files)
      setAttestChecked(false)
      return
    }
    doUpload(files)
  }

  async function confirmAttest() {
    const files = pending
    setPending([])
    await doUpload(files)
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

  const uploadColor = variant === "green" ? "bg-emerald-600" : "bg-[#1E3A5F]"

  return (
    <div className="space-y-3">
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl ${uploadColor} px-5 py-3 text-sm font-bold text-white transition hover:opacity-90`}>
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
                variant={variant}
                onRename={(next) => rename(d.name, next)}
                onDownload={() => window.open(d.url, "_blank")}
                onDelete={() => del(d.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Truth-attestation modal (payment/tax docs) */}
      {attestation && pending.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-[#1E3A5F]">Confirm before uploading</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              You&apos;re uploading {pending.length} file{pending.length > 1 ? "s" : ""}:{" "}
              <span className="font-medium text-slate-800">{pending.map((f) => f.name).join(", ")}</span>
            </p>
            <label className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={attestChecked}
                onChange={(e) => setAttestChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-none"
              />
              <span>{attestation}</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setPending([]); setAttestChecked(false) }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmAttest}
                disabled={!attestChecked || busy}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Finish upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
