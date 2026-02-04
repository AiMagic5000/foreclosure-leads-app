"use client"

import { useState, useEffect } from "react"
import { Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecoveryCountdownProps {
  saleDate: string | null
  stateAbbr: string
  scrapedAt?: string
  compact?: boolean
}

interface TimeRemaining {
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  expired: boolean
  percentage: number
}

// State recovery deadlines in months from sale date
const STATE_DEADLINES: Record<string, { months: number; source: "statute" | "estimated"; label: string }> = {
  AL: { months: 120, source: "statute", label: "10 years" },
  AK: { months: 6, source: "statute", label: "6 months" },
  AZ: { months: 24, source: "statute", label: "2 years" },
  AR: { months: 60, source: "statute", label: "5 years" },
  CA: { months: 12, source: "statute", label: "12 months" },
  CO: { months: 30, source: "statute", label: "30 months" },
  CT: { months: 3, source: "statute", label: "90 days" },
  DE: { months: 24, source: "estimated", label: "~2 years" },
  DC: { months: 24, source: "estimated", label: "~2 years" },
  FL: { months: 36, source: "statute", label: "3 years" },
  GA: { months: 60, source: "statute", label: "5 years" },
  HI: { months: 12, source: "statute", label: "1 year" },
  ID: { months: 2, source: "statute", label: "60 days" },
  IL: { months: 24, source: "estimated", label: "~2 years" },
  IN: { months: 36, source: "statute", label: "3 years" },
  IA: { months: 24, source: "estimated", label: "~2 years" },
  KS: { months: 24, source: "estimated", label: "~2 years" },
  KY: { months: 24, source: "estimated", label: "~2 years" },
  LA: { months: 24, source: "estimated", label: "~2 years" },
  ME: { months: 24, source: "estimated", label: "~2 years" },
  MD: { months: 36, source: "statute", label: "3 years" },
  MA: { months: 24, source: "estimated", label: "~2 years" },
  MI: { months: 24, source: "estimated", label: "~2 years" },
  MN: { months: 24, source: "estimated", label: "~2 years" },
  MS: { months: 24, source: "statute", label: "2 years" },
  MO: { months: 3, source: "statute", label: "90 days" },
  MT: { months: 4, source: "statute", label: "120 days" },
  NE: { months: 24, source: "estimated", label: "~2 years" },
  NV: { months: 12, source: "statute", label: "1 year" },
  NH: { months: 24, source: "estimated", label: "~2 years" },
  NJ: { months: 24, source: "estimated", label: "~2 years" },
  NM: { months: 24, source: "statute", label: "2 years" },
  NY: { months: 24, source: "estimated", label: "~2 years" },
  NC: { months: 24, source: "estimated", label: "~2 years" },
  ND: { months: 3, source: "statute", label: "90 days" },
  OH: { months: 3, source: "statute", label: "90 days" },
  OK: { months: 12, source: "statute", label: "1 year" },
  OR: { months: 24, source: "estimated", label: "~2 years" },
  PA: { months: 24, source: "statute", label: "2 years" },
  RI: { months: 60, source: "statute", label: "5 years" },
  SC: { months: 60, source: "statute", label: "5 years" },
  SD: { months: 12, source: "statute", label: "1 year" },
  TN: { months: 24, source: "estimated", label: "~2 years" },
  TX: { months: 24, source: "statute", label: "2 years" },
  UT: { months: 24, source: "statute", label: "24 months" },
  VT: { months: 24, source: "estimated", label: "~2 years" },
  VA: { months: 24, source: "statute", label: "2 years" },
  WA: { months: 24, source: "estimated", label: "~2 years" },
  WV: { months: 24, source: "statute", label: "2 years" },
  WI: { months: 24, source: "estimated", label: "~2 years" },
  WY: { months: 24, source: "statute", label: "2 years" },
}

function estimateSaleDate(scrapedAt: string): Date {
  // If no sale date, estimate based on when it was scraped
  // Pre-foreclosure leads are typically 3-6 months before auction
  // Use scraped_at minus 2 months as a conservative estimate
  const scraped = new Date(scrapedAt)
  scraped.setMonth(scraped.getMonth() - 2)
  return scraped
}

function getDeadlineDate(saleDate: string | null, stateAbbr: string, scrapedAt?: string): Date {
  const deadline = STATE_DEADLINES[stateAbbr] || { months: 24 }
  const baseDate = saleDate
    ? new Date(saleDate)
    : scrapedAt
      ? estimateSaleDate(scrapedAt)
      : new Date()

  const expiryDate = new Date(baseDate)
  expiryDate.setMonth(expiryDate.getMonth() + deadline.months)
  return expiryDate
}

function calculateTimeRemaining(expiryDate: Date, totalMonths: number): TimeRemaining {
  const now = new Date()
  const diff = expiryDate.getTime() - now.getTime()

  if (diff <= 0) {
    return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true, percentage: 100 }
  }

  const totalDuration = totalMonths * 30.44 * 24 * 60 * 60 * 1000
  const elapsed = totalDuration - diff
  const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))

  const totalSeconds = Math.floor(diff / 1000)
  const months = Math.floor(totalSeconds / (30.44 * 24 * 3600))
  const remainingAfterMonths = totalSeconds - months * Math.floor(30.44 * 24 * 3600)
  const weeks = Math.floor(remainingAfterMonths / (7 * 24 * 3600))
  const remainingAfterWeeks = remainingAfterMonths - weeks * 7 * 24 * 3600
  const days = Math.floor(remainingAfterWeeks / (24 * 3600))
  const remainingAfterDays = remainingAfterWeeks - days * 24 * 3600
  const hours = Math.floor(remainingAfterDays / 3600)
  const remainingAfterHours = remainingAfterDays - hours * 3600
  const minutes = Math.floor(remainingAfterHours / 60)
  const seconds = remainingAfterHours - minutes * 60

  return { months, weeks, days, hours, minutes, seconds, totalMs: diff, expired: false, percentage }
}

function getUrgencyLevel(time: TimeRemaining): "critical" | "urgent" | "warning" | "safe" {
  if (time.expired) return "critical"
  if (time.months < 1) return "critical"
  if (time.months < 3) return "urgent"
  if (time.months < 6) return "warning"
  return "safe"
}

const urgencyStyles = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
  urgent: { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  safe: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
}

export function RecoveryCountdown({ saleDate, stateAbbr, scrapedAt, compact = false }: RecoveryCountdownProps) {
  const [time, setTime] = useState<TimeRemaining | null>(null)
  const stateInfo = STATE_DEADLINES[stateAbbr] || { months: 24, source: "estimated" as const, label: "~2 years" }
  const expiryDate = getDeadlineDate(saleDate, stateAbbr, scrapedAt)

  useEffect(() => {
    const update = () => setTime(calculateTimeRemaining(expiryDate, stateInfo.months))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [saleDate, stateAbbr, scrapedAt])

  if (!time) return null

  const urgency = getUrgencyLevel(time)
  const styles = urgencyStyles[urgency]
  const isEstimated = !saleDate

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border", styles.bg, styles.border, styles.text)}>
        {time.expired ? (
          <>
            <XCircle className="h-3 w-3" />
            <span>EXPIRED</span>
          </>
        ) : urgency === "critical" ? (
          <>
            <AlertTriangle className="h-3 w-3 animate-pulse" />
            <span>{time.days}d {time.hours}h {time.minutes}m</span>
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" />
            <span>{time.months}mo {time.weeks}w {time.days}d</span>
          </>
        )}
        {isEstimated && <span className="opacity-60">*</span>}
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border p-3", styles.bg, styles.border)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {time.expired ? (
            <XCircle className={cn("h-4 w-4", styles.text)} />
          ) : urgency === "critical" ? (
            <AlertTriangle className={cn("h-4 w-4 animate-pulse", styles.text)} />
          ) : (
            <Clock className={cn("h-4 w-4", styles.text)} />
          )}
          <span className={cn("text-xs font-semibold uppercase tracking-wider", styles.text)}>
            {time.expired ? "Recovery Window Expired" : "Recovery Deadline"}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {stateAbbr} - {stateInfo.label} {stateInfo.source === "estimated" ? "(est.)" : ""}
        </span>
      </div>

      {!time.expired && (
        <>
          <div className="grid grid-cols-6 gap-1 mb-2">
            {[
              { val: time.months, label: "MO" },
              { val: time.weeks, label: "WK" },
              { val: time.days, label: "DAY" },
              { val: time.hours, label: "HR" },
              { val: time.minutes, label: "MIN" },
              { val: time.seconds, label: "SEC" },
            ].map((unit) => (
              <div key={unit.label} className="text-center">
                <div className={cn("text-lg font-bold tabular-nums leading-tight", styles.text)}>
                  {String(unit.val).padStart(2, "0")}
                </div>
                <div className="text-[9px] text-muted-foreground font-medium">{unit.label}</div>
              </div>
            ))}
          </div>

          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", styles.bar)}
              style={{ width: `${time.percentage}%` }}
            />
          </div>

          {isEstimated && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              * Estimated from listing date. Actual auction date may differ.
            </p>
          )}
        </>
      )}

      {time.expired && (
        <p className="text-xs text-muted-foreground mt-1">
          The statutory recovery window for {stateAbbr} has likely passed. Verify with county records.
        </p>
      )}
    </div>
  )
}

export { STATE_DEADLINES, getDeadlineDate, calculateTimeRemaining, getUrgencyLevel }
