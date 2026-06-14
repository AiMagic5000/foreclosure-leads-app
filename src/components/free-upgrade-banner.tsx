"use client"

import { usePin } from "@/lib/pin-context"
import { Crown, ArrowUpRight } from "lucide-react"
import { UPGRADE_URL } from "@/lib/upgrade"

// Upsell bar pinned to the top of every dashboard page (above the section video).
// Shown to every tier EXCEPT full Owner Operators, who already bought the top
// build-out. Gated on isLoading so it never flashes in then out while the account
// tier resolves — the old version defaulted accountType to "basic" (shown), then
// hid once a non-basic tier (admin/OO) loaded, which read as "appears then vanishes".
export function FreeUpgradeBanner() {
  const { accountType, isLoading } = usePin()
  if (isLoading) return null
  if (accountType === "owner_operator") return null

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[#D82221]/20 bg-white shadow-sm">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2563eb 0%,#2563eb 50%,#D82221 50%,#D82221 100%)" }} />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D82221]">Upgrade your account</p>
          <h3 className="mt-1 text-lg font-bold text-[#0f172a]">Turn lead access into a real recovery business.</h3>
          <p className="mt-1 text-sm text-slate-600">Become a certified Asset Recovery Agent for $331, or go all the way with the full Owner Operator build-out.</p>
        </div>
        <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="https://usforeclosureleads.com/arb-sections.html#guarantee"
            target="_blank"
            rel="noopener noreferrer"
            title="Money Back Guarantee — see details"
            className="flex flex-col items-center justify-center text-center sm:pr-1"
          >
            <span className="text-xs font-extrabold leading-tight">
              <span style={{ color: "#1E3A5F" }}>Money </span>
              <span style={{ color: "#dc2626" }}>Back </span>
              <span style={{ color: "#2563eb" }}>Guarantee</span>
            </span>
            <span className="text-[10px] text-slate-500 underline">see details</span>
          </a>
          <a
            href={UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Become an Agent &mdash; $331 <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href="/dashboard/owner-operator"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D82221] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            <Crown className="h-4 w-4" /> Owner Operator
          </a>
        </div>
      </div>
    </div>
  )
}
