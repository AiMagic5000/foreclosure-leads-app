"use client"

import { useState } from "react"
import { Phone, X, ArrowRight } from "lucide-react"

/**
 * Reusable "Upgrade to Owner Operator" button + call-us popup.
 * The upgrade is handled by phone — the popup shows (888) 545-8007 and a link to
 * the full "Everything You Get" rundown on the business site. Used on every
 * owner-operator-gated service page (automation, contract-admin, hire-closer, white-label).
 */
export function UpgradeButton({
  label = "Upgrade to Owner Operator",
  title = "Upgrade to Owner Operator",
  className,
  subtitle = "Unlock the complete asset-recovery business build-out — 45 points of compliance, the full platform, and dedicated support. Call us and we'll get you set up.",
}: {
  label?: string
  title?: string
  className?: string
  subtitle?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center justify-center rounded-lg bg-[#D82221] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        }
      >
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="h-1 w-12 rounded" style={{ background: "linear-gradient(90deg,#2563eb,#D82221)" }} />
            <h3 className="mt-3 text-xl font-bold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
            <a
              href="tel:+18885458007"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#D82221] px-4 py-3 text-lg font-bold text-white transition hover:opacity-90"
            >
              <Phone className="h-5 w-5" /> (888) 545-8007
            </a>
            <p className="mt-2 text-center text-xs text-slate-400">Call to upgrade — our team walks you through it.</p>
            <a
              href="https://usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-[#2563eb] hover:underline"
            >
              See everything you get <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </>
  )
}
