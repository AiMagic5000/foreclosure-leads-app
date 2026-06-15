"use client"

import { useState, useRef } from "react"
import { Play, ChevronDown } from "lucide-react"

interface SectionVideoProps {
  src: string
  poster: string
  title: string
  subtitle?: string
  /** unique key for remembering collapsed state (per section). */
  storageKey: string
  /** "contain" shows the full frame (no edge cropping) for sources wider than 16:9. */
  fit?: "cover" | "contain"
}

/**
 * Collapsible section-overview video card — works on any viewport.
 * The header is always a toggle (chevron) that minimizes the video to just its
 * bar, like a dropdown/accordion. Collapsed state persists via localStorage, so
 * after an agent watches once, it stays minimized on return (but is one tap to
 * reopen). Click-to-play with sound; the video pauses when collapsed.
 * Left-aligned, brand styled (white card, red #D82221 + blue #2563eb).
 */
export function SectionVideo({ src, poster, title, subtitle, storageKey, fit = "cover" }: SectionVideoProps) {
  // Lazy init from storage (SSR-safe) — avoids setState-in-effect.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(storageKey) === "1"
  })
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function toggle() {
    setCollapsed((c) => {
      const next = !c
      try { localStorage.setItem(storageKey, next ? "1" : "0") } catch {}
      if (next) videoRef.current?.pause()
      return next
    })
  }

  function play() {
    setPlaying(true)
    const v = videoRef.current
    if (v) { v.muted = false; v.play().catch(() => {}) }
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
      {/* red/blue accent rule */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563eb 0%,#2563eb 50%,#D82221 50%,#D82221 100%)" }} />

      {/* header = collapse toggle (full-width tap target, any viewport) */}
      <button
        onClick={toggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 sm:px-5"
      >
        <span className="inline-flex flex-none items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">Overview</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</span>
          {subtitle && <span className="mt-0.5 block truncate text-xs text-slate-500 sm:text-sm">{subtitle}</span>}
        </span>
        <span className="flex flex-none items-center gap-2 text-xs font-medium text-slate-400">
          <span className="hidden sm:inline">{collapsed ? "Watch" : "Minimize"}</span>
          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
        </span>
      </button>

      {/* collapsible body */}
      {!collapsed && (
        <div className="w-full px-4 pb-4 sm:px-5">
          <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl bg-slate-900">
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              controls={playing}
              preload="metadata"
              playsInline
              className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
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
      )}
    </div>
  )
}
