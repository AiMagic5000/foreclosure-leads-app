"use client"

import { useEffect, useState } from "react"
import { Download, Printer, FileText } from "lucide-react"

interface GuideResource {
  id: string
  display_name: string
  file_url: string
  file_name: string
  cover_url?: string | null
}

/**
 * Shows the Module 1 downloadable guide (cover + download/print) next to the
 * dashboard's top video. Fetches the resource live so it survives re-uploads.
 */
export function DashboardGuideCard() {
  const [res, setRes] = useState<GuideResource | null>(null)

  useEffect(() => {
    fetch("/api/training/resources?module_id=1")
      .then((r) => r.json())
      .then((d) => {
        const list: GuideResource[] = d?.data || []
        setRes(list.find((r) => r.cover_url) || list[0] || null)
      })
      .catch(() => {})
  }, [])

  if (!res) return null

  const download = () => {
    const a = document.createElement("a")
    a.href = res.file_url
    a.download = res.file_name || "guide.pdf"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  const print = () => window.open(res.file_url, "_blank", "noopener,noreferrer")

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-900">Free Agent Guide</span>
      </div>

      {res.cover_url && (
        <button
          type="button"
          onClick={download}
          className="mb-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5"
          title={`Open ${res.display_name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={res.cover_url}
            alt={`${res.display_name} cover`}
            className="max-h-full w-auto max-w-full object-contain"
            loading="lazy"
          />
        </button>
      )}

      <div className="mt-auto flex flex-none items-center gap-2">
        <button
          type="button"
          onClick={download}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
        <button
          type="button"
          onClick={print}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
      </div>
    </div>
  )
}
