"use client"

import { useState, useRef } from "react"
import { Play, X } from "lucide-react"

interface SectionVideoProps {
  src: string
  poster: string
  title: string
  subtitle?: string
  /** unique key for remembering dismissal (per page). */
  storageKey: string
}

/**
 * Responsive section-overview video card. Looks great on mobile and desktop:
 * full-width on small screens, constrained + centered on large. Click-to-play
 * with native controls + sound (the videos are narrated). Dismissible — remembers
 * via localStorage so returning agents aren't re-shown the tour.
 * Brand: white card, red #D82221 play, blue #2563eb accent.
 */
export function SectionVideo({ src, poster, title, subtitle, storageKey }: SectionVideoProps) {
  // Lazy init from storage (SSR-safe) — avoids a setState-in-effect render cascade.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(storageKey) === "1"
  })
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function hide() {
    setDismissed(true)
    try { localStorage.setItem(storageKey, "1") } catch {}
    videoRef.current?.pause()
  }

  function play() {
    setPlaying(true)
    const v = videoRef.current
    if (v) { v.muted = false; v.play().catch(() => {}) }
  }

  if (dismissed) return null

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
      {/* red/blue accent rule */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563eb 0%,#2563eb 50%,#D82221 50%,#D82221 100%)" }} />

      <div className="flex items-start justify-between gap-3 px-4 pt-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">Overview</span>
            <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
        </div>
        <button onClick={hide} aria-label="Hide video" className="flex-none rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 16:9 responsive frame */}
      <div className="relative mx-auto mt-3 w-full max-w-3xl px-4 pb-4 sm:px-5">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls={playing}
            preload="metadata"
            playsInline
            className="h-full w-full object-cover"
            onPause={() => {}}
          />
          {!playing && (
            <button
              onClick={play}
              aria-label="Play overview video"
              className="group absolute inset-0 flex items-center justify-center bg-slate-900/10 transition hover:bg-slate-900/0"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D82221] shadow-lg transition group-hover:scale-105 sm:h-20 sm:w-20">
                <Play className="ml-1 h-7 w-7 fill-white text-white sm:h-9 sm:w-9" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
