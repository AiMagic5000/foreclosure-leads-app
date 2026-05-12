"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const IMAGES = [
  "/closing-tools/tool-3.webp",
  "/closing-tools/tool-1.webp",
  "/closing-tools/tool-2.webp",
  "/closing-tools/tool-4.webp",
  "/closing-tools/tool-5.webp",
];

const AUTO_INTERVAL_MS = 3500;

export function ClosingToolsSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % IMAGES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + IMAGES.length) % IMAGES.length), []);

  useEffect(() => {
    if (paused || fullscreen) return;
    const id = setInterval(next, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, fullscreen, next]);

  // Keyboard nav when fullscreen open
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, next, prev]);

  return (
    <>
      <div
        className="relative h-48 overflow-hidden bg-slate-900 group cursor-zoom-in"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {IMAGES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`Closing tool ${i + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            priority={i === 0}
            className={`object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setFullscreen(true)}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-slate-900/85 pointer-events-none" />
        <div className="absolute top-3 left-3 inline-block bg-gradient-to-r from-red-600 to-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide z-10">
          🎰 CLOSING TOOLS
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white z-10 pointer-events-none">
          <div className="text-xl font-extrabold leading-tight">Vegas Vacation</div>
          <div className="text-xs opacity-90 mt-0.5">
            Your clients receive a complimentary Vegas trip when they sign the contingency agreement -- a built-in closing tool.
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 z-10 pointer-events-none">
          {IMAGES.map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 rounded-full transition-all ${
                i === index ? "bg-white w-4" : "bg-white/50 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              key={`fs-${IMAGES[index]}`}
              src={IMAGES[index]}
              alt={`Closing tool ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />

            {/* Close */}
            <button
              onClick={() => setFullscreen(false)}
              aria-label="Close fullscreen"
              className="absolute top-4 right-4 grid place-items-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 text-white"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Prev / Next */}
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white"
            >
              <ChevronRight className="h-7 w-7" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tracking-wide">
              {index + 1} / {IMAGES.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
