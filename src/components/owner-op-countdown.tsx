"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

// Owner Operator price change: $7,495 -> $9,995 when the clock hits zero.
// Deadline fixed at Aug 6, 2026 11:59:59 PM Pacific (23:59:59 PDT = 06:59:59Z Aug 7).
const DEADLINE_MS = Date.UTC(2026, 7, 7, 6, 59, 59)
export const NEW_PRICE = "$9,995"
export const NEW_PAYMENTS = "4 payments of $2,498.75"

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

export function OwnerOpCountdown({ dark = false }: { dark?: boolean }) {
  const [left, setLeft] = useState<ReturnType<typeof parts> | null>(null)

  useEffect(() => {
    const tick = () => setLeft(parts(DEADLINE_MS - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const expired = left !== null && left.d === 0 && left.h === 0 && left.m === 0 && left.s === 0
  const box = dark
    ? "bg-white/10 text-white"
    : "bg-[#0f172a] text-white"
  const label = dark ? "text-red-200" : "text-red-600"
  const sub = dark ? "text-slate-300" : "text-slate-600"

  return (
    <div className={`rounded-xl border ${dark ? "border-white/20 bg-white/5" : "border-red-200 bg-red-50"} p-4`}>
      <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${label}`}>
        <Clock className="h-3.5 w-3.5" />
        {expired ? "The price has changed" : `Price locks in ${NEW_PRICE} when this hits zero`}
      </p>
      {!expired && (
        <div className="mt-2 flex items-center gap-2">
          {left === null
            ? <span className={`text-sm ${sub}`}>Loading&hellip;</span>
            : ([["Days", left.d], ["Hrs", left.h], ["Min", left.m], ["Sec", left.s]] as const).map(([u, v]) => (
              <div key={u} className={`flex min-w-[52px] flex-col items-center rounded-lg ${box} px-2 py-1.5`}>
                <span className="text-xl font-black tabular-nums leading-none">{String(v).padStart(2, "0")}</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase opacity-70">{u}</span>
              </div>
            ))}
        </div>
      )}
      <p className={`mt-2 text-xs ${sub}`}>
        {expired
          ? <>Owner Operator is now <strong>{NEW_PRICE}</strong> ({NEW_PAYMENTS}).</>
          : <>After that, the Owner Operator build-out is <strong>{NEW_PRICE}</strong> &mdash; {NEW_PAYMENTS}. Today&apos;s price holds until the clock runs out.</>}
      </p>
    </div>
  )
}
