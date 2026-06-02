"use client"

import { usePathname } from "next/navigation"
import { SectionVideo } from "./section-video"

/**
 * Renders the matching section-overview video for the current dashboard route.
 * One mount in the dashboard layout wires every page — no per-page edits.
 */
const MAP: Record<string, { id: string; title: string; subtitle: string }> = {
  "/dashboard": { id: "dashboard", title: "New here? Take the 60-second dashboard tour", subtitle: "How surplus funds work, and how to turn your leads into recovered money." },
  "/dashboard/leads": { id: "foreclosure-leads", title: "How to work the leads board", subtitle: "Open a lead, read the surplus, skip-trace, and reach out — all in one place." },
  "/dashboard/my-leads": { id: "my-leads", title: "Your leads, and only yours", subtitle: "Exclusive, skip-traced, DNC-cleared — pick up the phone with confidence." },
  "/dashboard/states": { id: "state-laws", title: "Know the state before you reach out", subtitle: "Fund holder, deadline, and fee limits for every jurisdiction." },
  "/dashboard/closing-training": { id: "closing-training", title: "Learn to close on the phone", subtitle: "The conversations that turn a voicemail into a signed agreement." },
  "/dashboard/hire-closer": { id: "hire-closer", title: "Let a pro close it for you", subtitle: "You own the lead, a specialist makes the calls, you split the win." },
  "/dashboard/contract-admin": { id: "contract-admin", title: "From signature to filed claim", subtitle: "Upload the signed page — we prepare, pay court costs, and file." },
  "/dashboard/automation": { id: "automation", title: "Put your follow-up on autopilot", subtitle: "Sequenced email, text, and voicemail under your name." },
  "/dashboard/sms-messages": { id: "sms-messages", title: "Every text in one inbox", subtitle: "Replies route to you, threaded by homeowner, in real time." },
  "/dashboard/white-label": { id: "white-label", title: "Run it under your own brand", subtitle: "Your name, your site — our recovery engine behind the scenes." },
  "/dashboard/admin/compliance": { id: "compliance", title: "How the compliance gate protects every claim", subtitle: "The 15 checks, shadow mode, and verifying states before enforce." },
  "/dashboard/admin/state-rules": { id: "state-rules", title: "The legal backbone, verified", subtitle: "Non-attorney rules, fee caps, deadlines, and statutes per state." },
}

export function DashboardSectionVideo() {
  const pathname = usePathname()
  const cfg = pathname ? MAP[pathname] : undefined
  if (!cfg) return null
  return (
    <div className="mb-6">
      <SectionVideo
        src={`/videos/${cfg.id}-16x9.mp4`}
        poster={`/videos/${cfg.id}-poster.jpg`}
        title={cfg.title}
        subtitle={cfg.subtitle}
        storageKey={`video-dismissed-${cfg.id}`}
      />
    </div>
  )
}
