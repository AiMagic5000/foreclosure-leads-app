"use client"

import { useState } from "react"
import { ExternalLink, X, ShieldCheck } from "lucide-react"

type Section = { heading: string; points: string[] }
type Doc = { key: string; name: string; date: string; intro: string; sections: Section[] }

// Plain-language compliance references shown in the My Account popups. Educational
// summaries only — not legal advice. Agents are responsible for their own outreach.
const DOCS: Doc[] = [
  {
    key: "tcpa",
    name: "TCPA Compliance Guide",
    date: "Updated Feb 2026",
    intro:
      "The Telephone Consumer Protection Act (47 U.S.C. § 227) governs calls, texts, and prerecorded/ringless voicemails. Violations run $500 per call, up to $1,500 if willful — per message.",
    sections: [
      {
        heading: "Consent",
        points: [
          "Autodialed or prerecorded calls and texts to a cell phone require the consumer's prior express consent.",
          "For marketing by autodial/prerecorded message, that consent must be prior express WRITTEN consent.",
          "Keep a dated record of how and when you obtained consent for every contact.",
        ],
      },
      {
        heading: "Calling rules",
        points: [
          "Only call between 8:00 AM and 9:00 PM in the lead's local time zone.",
          "Identify yourself, the company (Foreclosure Recovery Inc.), and a callback number on every call.",
          "Honor any opt-out (\"stop\", \"do not call\") immediately and log it to your internal Do-Not-Call list.",
        ],
      },
      {
        heading: "Ringless voicemail & SMS",
        points: [
          "Ringless voicemail drops and text messages are treated as calls under the TCPA — the same consent rules apply.",
          "SMS must include opt-out instructions (e.g., reply STOP) and you must honor STOP instantly.",
        ],
      },
      {
        heading: "On this platform",
        points: [
          "Phone leads delivered to you are DNC-scrubbed, but DNC scrubbing is NOT the same as consent.",
          "You remain responsible for having a lawful basis to contact each lead and for keeping consent/opt-out records.",
        ],
      },
    ],
  },
  {
    key: "dnc",
    name: "DNC Registry Guidelines",
    date: "Updated Jan 2026",
    intro:
      "The National Do Not Call Registry (FTC/FCC) restricts telemarketing calls to registered numbers. Fines can exceed $50,000 per violation.",
    sections: [
      {
        heading: "The basics",
        points: [
          "Do not place telemarketing calls to numbers on the National DNC Registry unless an exemption applies.",
          "Re-scrub your calling lists against the registry at least every 31 days.",
          "Maintain a written DNC policy and train anyone who calls on your behalf.",
        ],
      },
      {
        heading: "Exemptions (use carefully)",
        points: [
          "Established Business Relationship: up to 18 months after a transaction, or 3 months after an inquiry/application.",
          "Prior express written consent from the consumer to be called.",
          "These exemptions are narrow — document which one you are relying on for each contact.",
        ],
      },
      {
        heading: "Internal Do-Not-Call list",
        points: [
          "When anyone asks not to be called, add them to your company-specific DNC list and honor it for at least 5 years.",
          "Company-specific opt-outs apply even when an EBR exemption would otherwise allow the call.",
        ],
      },
      {
        heading: "On this platform",
        points: [
          "Leads are scrubbed via our DNC provider before delivery, and the dashboard flags DNC status per lead.",
          "Keep your own opt-out log — platform scrubbing does not replace your legal obligation to honor opt-outs.",
        ],
      },
    ],
  },
  {
    key: "state",
    name: "State Telemarketing Laws",
    date: "Updated Feb 2026",
    intro:
      "Most states add their own rules on top of federal law — state DNC lists, stricter calling hours, registration/bonding, and \"mini-TCPA\" consent standards. The strictest rule that applies wins.",
    sections: [
      {
        heading: "What states commonly require",
        points: [
          "Separate state Do-Not-Call lists you must scrub against (e.g., FL, TX, and others).",
          "Tighter calling hours and bans on Sunday/holiday calls in some states.",
          "Telemarketer registration, licensing, or surety bonds before soliciting residents.",
        ],
      },
      {
        heading: "Mini-TCPA states",
        points: [
          "Florida and a growing list of states require prior express WRITTEN consent for autodialed/prerecorded calls and texts.",
          "Private lawsuits with per-message damages are common in these states — manual dialing with consent is safest.",
        ],
      },
      {
        heading: "Surplus-recovery specific",
        points: [
          "Several states cap recovery fees, impose waiting periods, or restrict solicitation after a foreclosure sale.",
          "Check the State Rules tab for each state's fee cap, claim deadline, and solicitation limits before you reach out.",
        ],
      },
      {
        heading: "Rule of thumb",
        points: [
          "Always go by the lead's state. When unsure, call manually within 8 AM–9 PM local time and get written consent first.",
        ],
      },
    ],
  },
]

export function ComplianceDocs() {
  const [open, setOpen] = useState<Doc | null>(null)

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Compliance Documents</h4>
      {DOCS.map((doc) => (
        <button
          key={doc.key}
          onClick={() => setOpen(doc)}
          className="flex w-full items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors text-left"
        >
          <div>
            <p className="font-medium text-sm">{doc.name}</p>
            <p className="text-xs text-muted-foreground">{doc.date}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-background border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{open.name}</h2>
                  <p className="text-xs text-muted-foreground">{open.date}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">{open.intro}</p>
              {open.sections.map((s) => (
                <div key={s.heading}>
                  <h3 className="text-sm font-semibold mb-2">{s.heading}</h3>
                  <ul className="space-y-1.5">
                    {s.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                This is an educational summary, not legal advice. You are responsible for
                complying with all applicable federal and state laws for every lead you contact.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
