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
  "/dashboard/settings": { id: "my-account", title: "Your account, explained", subtitle: "Every tier, what each one unlocks, and how to set up your tools." },
  "/dashboard/owner-operator": { id: "owner-operator", title: "The Owner Operator program", subtitle: "Your brand, your LLC, the full 45-point build-out — and 100% of your fee." },
  "/dashboard/ringless-drips": { id: "ringless-drips", title: "Turn your voice into closed deals", subtitle: "Record once — we drip ringless voicemails to your claimants." },
  "/dashboard/contingency-incentives": { id: "contingency-incentives", title: "Close more deals with incentives", subtitle: "Complimentary certificate credits to hand homeowners a reason to say yes." },
  "/dashboard/admin/compliance": { id: "compliance", title: "How the compliance gate protects every claim", subtitle: "The 15 checks, shadow mode, and verifying states before enforce." },
  "/dashboard/admin/state-rules": { id: "state-rules", title: "The legal backbone, verified", subtitle: "Non-attorney rules, fee caps, deadlines, and statutes per state." },
}

// Owner Operator leads with its first TWO series videos, side by side at the top.
// (Parts 3 & 4 live lower on the page, by the features.) Part 1 appears ONLY here.
const OWNER_OP_VIDEOS = [
  { id: "owner-operator", title: "Part 1 — The Owner Operator Program", subtitle: "Your brand, your LLC, the full build-out, and 100% of your fee." },
  { id: "own-the-platform", title: "Part 2 — Own the Whole Platform", subtitle: "One platform you own, built for you from nothing." },
]

export function DashboardSectionVideo() {
  const pathname = usePathname()

  if (pathname === "/dashboard/owner-operator") {
    return (
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {OWNER_OP_VIDEOS.map((v) => (
          <SectionVideo
            key={v.id}
            src={`/videos/${v.id}-16x9.mp4`}
            poster={`/videos/${v.id}-poster.jpg`}
            title={v.title}
            subtitle={v.subtitle}
            storageKey={`video-dismissed-${v.id}`}
          />
        ))}
      </div>
    )
  }

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
