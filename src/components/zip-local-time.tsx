"use client"

import { useState, useEffect } from "react"
import { Clock, Info } from "lucide-react"
import {
  getTimezoneForZip,
  formatLocalTime,
  getTimezoneLabel,
  getCallWindowStatus,
  type CallWindowStatus,
} from "@/lib/zip-timezone"

const STATUS_COLORS: Record<CallWindowStatus, string> = {
  green: "text-emerald-500",
  yellow: "text-amber-500",
  red: "text-red-500",
}

const STATUS_BG: Record<CallWindowStatus, string> = {
  green: "bg-emerald-500/10",
  yellow: "bg-amber-500/10",
  red: "bg-red-500/10",
}

const STATUS_LABEL: Record<CallWindowStatus, string> = {
  green: "OK to call",
  yellow: "Caution",
  red: "Do not call",
}

interface ZipLocalTimeProps {
  zipCode: string
  stateAbbr?: string
  className?: string
}

export function ZipLocalTime({ zipCode, stateAbbr, className = "" }: ZipLocalTimeProps) {
  const [time, setTime] = useState("")
  const [tzLabel, setTzLabel] = useState("")
  const [status, setStatus] = useState<CallWindowStatus>("red")

  useEffect(() => {
    const tz = getTimezoneForZip(zipCode, stateAbbr)

    function tick() {
      setTime(formatLocalTime(tz))
      setTzLabel(getTimezoneLabel(tz))
      setStatus(getCallWindowStatus(tz))
    }

    tick()
    const interval = setInterval(tick, 15000)
    return () => clearInterval(interval)
  }, [zipCode, stateAbbr])

  if (!time) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Clock className={`h-3 w-3 flex-shrink-0 ${STATUS_COLORS[status]}`} />
      <span
        className={`text-xs font-medium tabular-nums px-1 py-0.5 rounded ${STATUS_COLORS[status]} ${STATUS_BG[status]}`}
      >
        {time} {tzLabel}
      </span>
      <span
        className={`text-[10px] font-semibold ${STATUS_COLORS[status]}`}
      >
        {STATUS_LABEL[status]}
      </span>
      <div className="relative group">
        <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-64 p-2.5 rounded-lg bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl border border-slate-700">
          <p className="font-semibold mb-1">TCPA Compliance</p>
          <p>Federal telemarketing law (Telephone Consumer Protection Act) restricts calls to the recipient&apos;s local time zone. Calls are permitted 9:00 AM - 8:00 PM in the lead&apos;s jurisdiction regardless of where you are located.</p>
          <p className="mt-1.5 font-medium">
            <span className="text-emerald-400">Green</span> = 9 AM - 7 PM (safe) | <span className="text-amber-400">Yellow</span> = 7 - 8 PM (caution) | <span className="text-red-400">Red</span> = 8 PM - 9 AM (prohibited)
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    </div>
  )
}
