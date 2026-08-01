"use client"

import { useEffect, useState } from "react"
import { usePin } from "@/lib/pin-context"
import { Clock, LogIn, Eye, Download, Info } from "lucide-react"

// My Account engagement stats: activity pill strip (time on site, logins, views,
// downloads) + contingency-agreement pills for the Contingency Agreements card.
// Admin view-as shows the impersonated agent's numbers.

export interface Engagement {
  totalSeconds: number
  logins: number
  views: number
  downloads: number
  agreementCount: number
  avgPerMonth: number
  secondsToFirstUpload: number | null
  avgAgreementValue: number | null
  status: string
}

export function useEngagement(): Engagement | null {
  const { impersonating } = usePin()
  const [data, setData] = useState<Engagement | null>(null)
  useEffect(() => {
    const url = "/api/my-engagement" + (impersonating?.pinId ? `?asPinId=${encodeURIComponent(impersonating.pinId)}` : "")
    fetch(url).then((r) => (r.ok ? r.json() : null)).then((d) => d && setData(d)).catch(() => {})
  }, [impersonating?.pinId])
  return data
}

function fmtDuration(sec: number): string {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`
  if (sec >= 60) return `${Math.round(sec / 60)}m`
  return `${sec}s`
}

// Activity strip shown above the Contingency Agreements section — the same four
// metrics the admin User Activity page tracks, scoped to this account.
export function MyActivityPills({ data }: { data: Engagement | null }) {
  const d = data
  if (!d) return null
  const pill = (icon: React.ReactNode, label: string, value: string, cls: string) => (
    <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${cls}`}>
      {icon}
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  )
  return (
    <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
      <p className="mr-1 text-sm font-semibold text-muted-foreground">Your activity:</p>
      {pill(<Clock className="h-4 w-4" />, "Time on site", fmtDuration(d.totalSeconds), "border-blue-200 bg-blue-50 text-blue-800")}
      {pill(<LogIn className="h-4 w-4" />, "Logins", String(d.logins), "border-emerald-200 bg-emerald-50 text-emerald-800")}
      {pill(<Eye className="h-4 w-4" />, "Views", String(d.views), "border-purple-200 bg-purple-50 text-purple-800")}
      {pill(<Download className="h-4 w-4" />, "Downloads", String(d.downloads), "border-amber-200 bg-amber-50 text-amber-800")}
    </div>
  )
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending Attorney / County Notice", cls: "border-red-300 bg-red-100 text-red-800" },
  submitted: { label: "Legal Package Accepted - Awaiting Distribution", cls: "border-yellow-300 bg-yellow-100 text-yellow-800" },
  distributed: { label: "Distributed - Check Your Bank Account", cls: "border-emerald-300 bg-emerald-100 text-emerald-800" },
}

// Pills for the top-right of the Contingency Agreements card header.
export function ContingencyPills({ data }: { data: Engagement | null }) {
  const [showInfo, setShowInfo] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  if (!data) return null
  const st = STATUS_META[data.status] || STATUS_META.pending
  const pill = (children: React.ReactNode, cls: string) => (
    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${cls}`}>{children}</div>
  )
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {pill(<><span>Uploaded:</span><span className="font-bold">{data.agreementCount}</span></>, "border-blue-300 bg-blue-100 text-blue-800")}
      {data.avgAgreementValue !== null && (
        <div className="relative">
          {pill(
            <>
              <span>Avg agreement value:</span>
              <span className="font-bold">${data.avgAgreementValue.toLocaleString()}</span>
              <button
                type="button"
                aria-label="How this is calculated"
                onClick={() => setShowInfo((v) => !v)}
                className="ml-0.5 text-emerald-700 hover:text-emerald-900"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </>,
            "border-emerald-300 bg-emerald-100 text-emerald-800"
          )}
          {showInfo && (
            <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs font-normal text-slate-600 shadow-xl">
              Your projected share per signed agreement: a 50% split of the recovery fee on each surplus. Figures are
              automatically adjusted to each state&apos;s contingency-fee regulations, so every estimate reflects what can
              lawfully be earned in that jurisdiction.
            </div>
          )}
        </div>
      )}
      <div className="relative">
        {pill(
          <>
            <span>{st.label}</span>
            <button
              type="button"
              aria-label="Status color legend"
              onClick={() => setShowLegend((v) => !v)}
              className="ml-0.5 opacity-80 hover:opacity-100"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </>,
          st.cls
        )}
        {showLegend && (
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 text-xs font-normal text-slate-600 shadow-xl">
            <p className="mb-2 font-semibold text-slate-800">Status color legend — how your agreement moves:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-red-500" />
                <p><strong className="text-red-700">Red — Pending Attorney / County Notice.</strong> Your agreement is in review and the required attorney or county notices are being prepared and served.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-yellow-400" />
                <p><strong className="text-yellow-700">Yellow — Legal Package Accepted.</strong> The full legal package was submitted and accepted; the claim is now waiting on the distribution timeline.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
                <p><strong className="text-emerald-700">Green — Distributed.</strong> Funds released. Check your bank account.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      {pill(<><span>Avg per month:</span><span className="font-bold">{data.avgPerMonth}</span></>, "border-purple-300 bg-purple-100 text-purple-800")}
      {data.secondsToFirstUpload !== null && (
        pill(
          <><span>Site time to 1st agreement:</span><span className="font-bold">{fmtDuration(data.secondsToFirstUpload)}</span></>,
          "border-amber-300 bg-amber-100 text-amber-800"
        )
      )}
    </div>
  )
}
