"use client"

import { ExternalLink } from "lucide-react"

// The shared upgrade banner is rendered on top of every dashboard page by the
// layout (FreeUpgradeBanner), so it already appears above this iframe.
export default function ContingentAttorneysPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contingent Attorneys Network</h1>
        <p className="text-muted-foreground">
          Partner attorneys and trust tooling to receive and disburse recovered surplus funds.
        </p>
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
