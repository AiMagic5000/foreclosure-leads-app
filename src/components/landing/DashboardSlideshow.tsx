"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  "https://www.assetrecoverybusiness.com/images/dashboard-5.jpg",
  "https://www.assetrecoverybusiness.com/images/dashboard-6.jpg",
  "https://www.assetrecoverybusiness.com/images/dashboard-7.jpg",
];

const ALT = "Foreclosure surplus funds recovery overages dashboard";

export function DashboardSlideshow() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, idx]);

  const go = (n: number) => {
    setIdx(((n % SLIDES.length) + SLIDES.length) % SLIDES.length);
  };

  return (
    <div
      className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((src, k) => (
        <img
          key={src}
          src={src}
          alt={ALT}
          loading={k === 0 ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: k === idx ? 1 : 0 }}
        />
      ))}

      <button
        type="button"
        onClick={() => go(idx - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-white transition-colors hover:bg-red-600/90"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(idx + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-white transition-colors hover:bg-red-600/90"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => go(k)}
            aria-label={`Slide ${k + 1}`}
            className="h-2 w-2 rounded-full bg-white transition-opacity"
            style={{ opacity: k === idx ? 1 : 0.4 }}
          />
        ))}
      </div>

      <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
        LIVE SITE
      </div>
    </div>
  );
}
