"use client"

import { useState, type ReactNode } from "react"
import { AgentManagerModal } from "@/components/agent-manager-modal"

// Enroll CTA for SERVER pages (e.g. /pricing, which exports metadata and so cannot
// be a client component). Self-contained: owns its own modal state.
export function EnrollCta({ className, children }: { className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <AgentManagerModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
