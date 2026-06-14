"use client"

import { ExternalLink, Mail } from "lucide-react"

// The shared upgrade banner is rendered on top of every dashboard page by the
// layout (FreeUpgradeBanner), so it already appears above this iframe.
export default function ContingentAttorneysPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contingent Attorneys Network</h1>
          <p className="text-muted-foreground">
            Partner attorneys and trust tooling to receive and disburse recovered surplus funds.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-slate-800 dark:text-slate-100">
            Once you sign up for{" "}
            <a
              href="https://www.mytrustsoftware.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-300"
            >
              My Trust Software
            </a>
            , email{" "}
            <a
              href="mailto:trusts@mytrustsoftware.com?subject=Att%20Net"
              className="font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-300"
            >
              trusts@mytrustsoftware.com
            </a>{" "}
            with the subject line <strong>&ldquo;Att Net&rdquo;</strong>. We&apos;ll set up a My Trust
            Software business email in your name so you can do outreach to the attorneys in our
            network for the jurisdictions you&apos;re working.
          </p>
        </div>
      </div>

      {/* My Trust Software blocks third-party embedding, so we show a live preview
          that opens the real portal in a new tab. */}
      <a
        href="https://www.mytrustsoftware.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/mytrustsoftware-preview.png"
            alt="My Trust Software — create your living trust online"
            className="w-full"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-5 py-3 text-sm font-bold text-white shadow-lg">
              Open My Trust Software <ExternalLink className="h-4 w-4" />
            </span>
          </div>
        </div>
      </a>

      <div className="flex justify-center">
        <a
          href="https://www.mytrustsoftware.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2d4a6f]"
        >
          Go to My Trust Software <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
