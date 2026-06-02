"use client"

import { usePin } from "@/lib/pin-context"
import { Crown, ArrowUpRight } from "lucide-react"

const AGENT_PROGRAM_URL = "https://www.usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business"

// Shown to free (basic) accounts on every dashboard page: upgrade to the $995 agent
// program (landing page) or to the Owner Operator program (in-app tab with full benefits).
export function FreeUpgradeBanner() {
  const { accountType } = usePin()
  const isFree = !accountType || accountType === "basic"
  if (!isFree) return null

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[#D82221]/20 bg-white shadow-sm">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2563eb 0%,#2563eb 50%,#D82221 50%,#D82221 100%)" }} />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D82221]">Upgrade your account</p>
          <h3 className="mt-1 text-lg font-bold text-[#0f172a]">Turn lead access into a real recovery business.</h3>
          <p className="mt-1 text-sm text-slate-600">Become a certified Asset Recovery Agent for $995, or go all the way with the full Owner Operator build-out.</p>
        </div>
        <div className="flex flex-none flex-col gap-2 sm:flex-row">
          <a
            href={AGENT_PROGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Become an Agent &mdash; $995 <ArrowUpRight className="h-4 w-4" />
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
