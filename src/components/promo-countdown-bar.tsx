"use client"

import { useEffect, useState } from "react"
import { BadgePercent } from "lucide-react"

// 10%-off discount promo timer, mirrored from assetrecoverybusiness.com's top bar.
// 48-hour countdown (HH:MM:SS) that persists per browser via localStorage — so it
// does not reset on refresh, the same "per-visitor" behavior as the ARB backend
// timer. When it runs out, a fresh 48h window starts (evergreen urgency).
const WINDOW = 48 * 60 * 60 * 1000
const KEY = "usfr_usfr22_deadline"

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const p = (n: number) => n.toString().padStart(2, "0")
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

export function PromoCountdownBar() {
  const [label, setLabel] = useState("48:00:00")
  useEffect(() => {
    function deadline() {
      const now = Date.now()
      let end = Number(localStorage.getItem(KEY) || 0)
      if (!end || end <= now) {
        end = now + WINDOW
        localStorage.setItem(KEY, String(end))
      }
      return end
    }
    const tick = () => setLabel(fmt(deadline() - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="w-full bg-[#dc2626] text-white">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-xs font-bold sm:text-sm">
        <BadgePercent className="h-4 w-4 shrink-0" />
        <span className="uppercase tracking-wide">
          Foreclosure Surplus Funds &mdash; <span className="text-yellow-300">10% off</span> expires in
        </span>
        <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-sm tabular-nums sm:text-base">{label}</span>
        <span className="hidden sm:inline">&middot;</span>
        <span>
          Use code{" "}
          <span className="rounded bg-white px-1.5 py-0.5 font-extrabold tracking-wider text-[#dc2626]">USFR22</span>{" "}
          at checkout
        </span>
      </div>
    </div>
  )
}
