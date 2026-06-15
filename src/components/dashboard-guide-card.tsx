"use client"

import { Download, Printer, FileText } from "lucide-react"

// The dashboard guide is INDEPENDENT of the training-module resources. It points
// at its own hosted PDF + cover so changing a training doc never affects it.
const GUIDE = {
  name: "Asset Recovery Agent — Quick Start",
  cover: "/guides/asset-recovery-quick-start-cover.jpg",
  pdf: "/guides/asset-recovery-quick-start.pdf",
}

/**
 * Downloadable guide shown next to the dashboard's top video. Self-contained:
 * its own cover + PDF, matched to the video card's height (see lg:absolute use
 * in the dashboard layout — the cover scales to fit).
 */
export function DashboardGuideCard() {
  // Open the guide in the browser so the user can read it; the in-browser PDF
  // viewer still offers its own download + print.
  const open = () => window.open(GUIDE.pdf, "_blank", "noopener,noreferrer")
  const download = open
  const print = open

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:absolute lg:inset-0">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-900">Free Agent Guide</span>
      </div>

      <div className="mb-3 flex min-h-0 flex-1 items-start justify-center">
        <button
          type="button"
          onClick={download}
          className="flex max-h-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5"
          title={`Open ${GUIDE.name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GUIDE.cover}
            alt={`${GUIDE.name} cover`}
            className="max-h-full w-auto max-w-full object-contain"
            loading="lazy"
          />
        </button>
      </div>

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
