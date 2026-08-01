"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react"

// Owner Operator image slider — hero composite, platform proof shots, and the
// SMB build-out dashboard. Auto-advances, pauses on hover, arrows + dots.
// Proof slides (fullscreen: true) open a lightbox on click for a full-screen view.
const SLIDES = [
  {
    src: "/images/oo-slide-hero.png",
    alt: "Own the whole business — your website, dashboard, and agent team",
    href: null as string | null,
    fullscreen: false,
  },
  {
    src: "/images/oo-slide-userdata.png",
    alt: "Owner Operator admin — manage over 1,000 registered users and your agent roster",
    href: null,
    fullscreen: true,
  },
  {
    src: "/images/oo-slide-income-v2.png",
    alt: "First month income example — $15,520 in program revenue",
    href: null,
    fullscreen: true,
  },
  {
    src: "/images/oo-slide-fbads-v2.png",
    alt: "First month Facebook Ads — 672 leads at $1.76 per lead",
    href: null,
    fullscreen: true,
  },
  {
    src: "/images/start-my-business-build-out-dashboard.webp",
    alt: "Your Start My Business build-out dashboard — 45 daily tasks handled for you",
    href: "https://www.startmybusiness.us/",
    fullscreen: false,
  },
]

export function OoImageSlider() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (paused || lightbox !== null) return
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [paused, lightbox])

  // Escape closes the lightbox.
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox])

  const go = (d: number) => setIdx((i) => (i + d + SLIDES.length) % SLIDES.length)
  // In-lightbox navigation cycles the fullscreen-enabled slides only and keeps
  // the slider itself in sync with what's on screen.
  const fsIdxs = SLIDES.map((s, i) => (s.fullscreen ? i : -1)).filter((i) => i >= 0)
  const lightboxGo = (d: number) => {
    setLightbox((cur) => {
      if (cur === null) return cur
      const pos = fsIdxs.indexOf(cur)
      const next = fsIdxs[(pos + d + fsIdxs.length) % fsIdxs.length]
      setIdx(next)
      return next
    })
  }
  const slide = SLIDES[idx]

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.src} alt={slide.alt} className="h-full w-full object-contain" loading="lazy" />
  )

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="aspect-[16/9] w-full bg-white">
          {slide.href ? (
            <a href={slide.href} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
              {img}
            </a>
          ) : slide.fullscreen ? (
            <button
              type="button"
              aria-label="View full screen"
              onClick={() => setLightbox(idx)}
              className="block h-full w-full cursor-zoom-in"
            >
              {img}
            </button>
          ) : (
            img
          )}
        </div>

        {slide.fullscreen && (
          <button
            aria-label="Open full screen"
            onClick={() => setLightbox(idx)}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-700 shadow-md ring-1 ring-slate-200 transition hover:bg-white"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        <button
          aria-label="Previous image"
          onClick={() => go(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[#09274c] p-2 text-white shadow-md ring-1 ring-white/40 transition hover:bg-[#123a6d]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          aria-label="Next image"
          onClick={() => go(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#09274c] p-2 text-white shadow-md ring-1 ring-white/40 transition hover:bg-[#123a6d]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2.5 rounded-full ring-1 ring-slate-300 transition-all ${
                i === idx ? "w-6 bg-[#d82221]" : "w-2.5 bg-white/90 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Lightbox — full-screen view for proof slides, with in-lightbox navigation */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Close full screen"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#d82221] text-white shadow-lg ring-2 ring-white transition hover:bg-[#b51b1a]"
          >
            <X className="h-7 w-7" strokeWidth={3} />
          </button>

          <button
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); lightboxGo(-1) }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#09274c] p-3 text-white shadow-lg ring-2 ring-white transition hover:bg-[#123a6d] sm:left-6"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); lightboxGo(1) }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#09274c] p-3 text-white shadow-lg ring-2 ring-white transition hover:bg-[#123a6d] sm:right-6"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SLIDES[lightbox].src}
            alt={SLIDES[lightbox].alt}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
