"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const IMAGES = [
  "/closing-tools/tool-1.webp",
  "/closing-tools/tool-2.webp",
  "/closing-tools/tool-3.webp",
  "/closing-tools/tool-4.webp",
  "/closing-tools/tool-5.webp",
];

const INTERVAL_MS = 3500;

export function ClosingToolsSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-48 overflow-hidden bg-slate-900">
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
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-slate-900/85 pointer-events-none" />
      <div className="absolute top-3 left-3 inline-block bg-gradient-to-r from-red-600 to-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide z-10">
        🎰 CLOSING TOOLS
      </div>
      <div className="absolute bottom-3 left-3 right-3 text-white z-10">
        <div className="text-xl font-extrabold leading-tight">Vegas Vacation</div>
        <div className="text-xs opacity-90 mt-0.5">
          Your clients receive a complimentary Vegas trip when they sign the contingency agreement -- a built-in closing tool.
        </div>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
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
  );
}
