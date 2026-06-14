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
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-blue-900 dark:text-blue-200">
            Once you sign up for{" "}
            <a
              href="https://www.mytrustsoftware.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              My Trust Software
            </a>
            , email{" "}
            <a href="mailto:trusts@mytrustsoftware.com?subject=Att%20Net" className="font-semibold underline underline-offset-2">
              trusts@mytrustsoftware.com
            </a>{" "}
            with the subject line <strong>&ldquo;Att Net&rdquo;</strong>. We&apos;ll set up a My Trust
            Software business email in your name so you can do outreach to the attorneys in our
            network for the jurisdictions you&apos;re working.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border shadow-sm bg-white">
        <iframe
          src="/api/cattorneys-frame"
          title="Contingent Attorneys Network"
          className="w-full"
          style={{ height: "calc(100vh - 240px)", minHeight: 640 }}
          loading="lazy"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Trouble viewing?{" "}
        <a
          href="https://www.mytrustsoftware.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Open in a new tab <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  )
}
