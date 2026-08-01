"use client"

import { useState } from "react"
import { Download, Trash2, Pencil, Check, X, Play } from "lucide-react"

// Uiverse.io "folder" (by Cobp) — the universal look for any uploaded file across the
// dashboard (documents, voice samples, contingency agreements). Label is editable.
// variant: "amber" (default) or "green" (used for payment/tax documents).
export function FileFolder({
  label,
  onRename,
  onDownload,
  onDelete,
  audioSrc,
  variant = "amber",
}: {
  label: string
  onRename?: (next: string) => void | Promise<void>
  onDownload?: () => void
  onDelete?: () => void
  audioSrc?: string
  variant?: "amber" | "green"
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const [busy, setBusy] = useState(false)

  async function save() {
    const next = draft.trim()
    if (!next || next === label || !onRename) { setEditing(false); return }
    setBusy(true)
    try { await onRename(next) } finally { setBusy(false); setEditing(false) }
  }

  const green = variant === "green"
  const back = green
    ? "work-5 bg-emerald-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-16 after:h-3 after:bg-emerald-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[11px] before:left-[58px] before:w-3 before:h-3 before:bg-emerald-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%)]"
    : "work-5 bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-16 after:h-3 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[11px] before:left-[58px] before:w-3 before:h-3 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%)]"
  const front = green
    ? "work-1 absolute bottom-0 bg-gradient-to-t from-emerald-500 to-emerald-400 w-full h-[112px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[106px] after:h-[12px] after:bg-emerald-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[8px] before:right-[103px] before:size-2.5 before:bg-emerald-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%)] transition-all ease duration-300 origin-bottom flex items-end justify-center group-hover:shadow-[inset_0_20px_40px_#34d399,_inset_0_-20px_40px_#059669] group-hover:[transform:rotateX(-46deg)_translateY(1px)]"
    : "work-1 absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[112px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[106px] after:h-[12px] after:bg-amber-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[8px] before:right-[103px] before:size-2.5 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%)] transition-all ease duration-300 origin-bottom flex items-end justify-center group-hover:shadow-[inset_0_20px_40px_#fbbf24,_inset_0_-20px_40px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]"
  const badge = green ? "text-emerald-700" : "text-amber-700"

  return (
    <section className="relative group flex flex-col items-center justify-center w-full">
      <div
        className="file relative w-44 h-28 cursor-pointer origin-bottom [perspective:1500px] z-10"
        onClick={() => { if (!editing) (audioSrc ? null : onDownload?.()) }}
        title={audioSrc ? "Voice sample" : "Download"}
      >
        <div className={back} />
        <div className="work-4 absolute inset-1 bg-zinc-400 rounded-2xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]" />
        <div className="work-3 absolute inset-1 bg-zinc-300 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]" />
        <div className="work-2 absolute inset-1 bg-zinc-200 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]" />
        <div className={front}>
          {audioSrc && (
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 ${badge}`}>
              <Play className="h-4 w-4 ml-0.5" />
            </div>
          )}
        </div>
      </div>

      {/* Label (editable) */}
      <div className="mt-3 flex w-full max-w-44 items-center justify-center gap-1">
        {editing ? (
          <>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false) }}
              className="min-w-0 flex-1 rounded border border-slate-300 px-1.5 py-0.5 text-xs"
            />
            <button onClick={save} disabled={busy} aria-label="Save" className="text-emerald-600"><Check className="h-4 w-4" /></button>
            <button onClick={() => { setDraft(label); setEditing(false) }} aria-label="Cancel" className="text-slate-400"><X className="h-4 w-4" /></button>
          </>
        ) : (
          <>
            <span className="truncate text-xs font-medium text-slate-700" title={label}>{label}</span>
            {onRename && (
              <button onClick={() => setEditing(true)} aria-label="Rename" className="flex-none text-slate-400 hover:text-slate-700"><Pencil className="h-3 w-3" /></button>
            )}
          </>
        )}
      </div>

      {audioSrc && <audio controls src={audioSrc} className="mt-2 h-8 w-44" />}

      {/* Actions */}
      <div className="mt-1 flex items-center gap-3">
        {onDownload && (
          <button onClick={onDownload} aria-label="Download" className="text-slate-400 hover:text-[#1E3A5F]"><Download className="h-4 w-4" /></button>
        )}
        {onDelete && (
          <button onClick={onDelete} aria-label="Delete" className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
    </section>
  )
}
