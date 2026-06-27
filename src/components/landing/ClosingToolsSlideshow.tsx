"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const IMAGES = [
  "/closing-tools/tool-3.webp",
  "/closing-tools/tool-1.webp",
  "/closing-tools/tool-2.webp",
  "/closing-tools/tool-4.webp",
  "/closing-tools/tool-5.webp",
  "/closing-tools/tool-vegas.webp",
];

const VEGAS_INDEX = IMAGES.indexOf("/closing-tools/tool-vegas.webp");
const AUTO_INTERVAL_MS = 3500;

export function ClosingToolsSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const snappedToVegasRef = useRef(false);

  // First time the slideshow scrolls into view, snap to the Vegas frame
  useEffect(() => {
    const el = containerRef.current;
    if (!el || snappedToVegasRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !snappedToVegasRef.current) {
            snappedToVegasRef.current = true;
            setIndex(VEGAS_INDEX);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
        ref={containerRef}
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
            Your clients receive complimentary incentives when they sign the contingency agreement -- a built-in closing tool.
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

      {/* Lightbox — bounded ~1200px box centered in front of the content.
          Uses a plain <img> with max-width/height so it can never draw past the
          viewport (the previous next/image `fill` had no resolved height and
          rendered a giant black canvas). */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="relative w-full max-w-[1200px] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={`fs-${IMAGES[index]}`}
              src={IMAGES[index]}
              alt={`Closing tool ${index + 1}`}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            />

            {/* Close */}
            <button
              onClick={() => setFullscreen(false)}
              aria-label="Close"
              className="absolute -top-3 -right-3 grid place-items-center h-10 w-10 rounded-full bg-white text-slate-900 shadow-lg hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev / Next */}
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-black/50 hover:bg-black/75 text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-black/50 hover:bg-black/75 text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white/90 text-sm font-medium px-3 py-1 rounded-full">
              {index + 1} / {IMAGES.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
