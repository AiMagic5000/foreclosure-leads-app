"use client"

import { useAgentManager } from "@/components/agent-manager-modal"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, MapPin, Phone, Mail, Globe, FileText, Printer, Scale, Lock, ShieldAlert } from "lucide-react"
import { findCountyContact } from "@/data/county-directory"
import { findCountyCourtInfo } from "@/data/county-court-directory"
import { stateOverageGuide } from "@/data/state-overage-guide"
import { statesData } from "@/data/states"
import { UPGRADE_URL } from "@/lib/upgrade"

// The same county intel shown by the foreclosure-map popup, packaged as a
// standalone modal so leads (and county search results) can open it anywhere.
// Data sections mirror src/components/county-map.tsx's click popup.

const FEE_CAP_2500_STATES = new Set(["AZ", "NV"])

function stateInfo(abbr: string) {
  return statesData.find((s) => s.abbr === abbr.toUpperCase())
}

const normCounty = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/\b(county|parish|borough|census area|municipality|city and|city|of)\b/g, " ")
    .replace(/[^a-z]/g, "")

export function CountyInfoDialog({
  stateAbbr,
  countyName,
  open,
  onClose,
  isOwnerOperator,
}: {
  stateAbbr: string
  countyName: string
  open: boolean
  onClose: () => void
  isOwnerOperator: boolean
}) {
  const { openAgentManager } = useAgentManager()
  const [leadCount, setLeadCount] = useState<number | null>(null)

  useEffect(() => {
    if (!open || !isOwnerOperator) return
    let cancelled = false
    fetch("/api/leads/by-county")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.leadsByName) return
        const key = stateAbbr.toUpperCase() + "|" + normCounty(countyName)
        setLeadCount(data.leadsByName[key] || 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, isOwnerOperator, stateAbbr, countyName])

  if (!open || typeof document === "undefined") return null

  const abbr = stateAbbr.toUpperCase()
  const cleanCounty = countyName.replace(/\s+county$/i, "").trim()
  const contact = findCountyContact(abbr, cleanCounty)
  const courtInfo = findCountyCourtInfo(abbr, cleanCounty)
  const og = stateOverageGuide[abbr]
  const st = stateInfo(abbr)
  const fType = st?.foreclosureType // "judicial" | "non-judicial" | "both"

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[85vh] overflow-hidden rounded-xl border-2 border-blue-600 bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close county info"
          className="absolute top-2 right-2 z-10 rounded-full bg-background p-1 text-muted-foreground hover:bg-black/10"
        >
          <X size={16} />
        </button>

        <div className="max-h-[85vh] overflow-y-auto p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">{cleanCounty} County</h4>
              <p className="text-sm text-muted-foreground">
                {st?.name || abbr} ({abbr})
              </p>
            </div>
          </div>

          {/* Leads + foreclosure type */}
          <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Leads</span>
              {isOwnerOperator ? (
                <span className={`text-lg font-bold ${leadCount ? "text-green-500" : "text-muted-foreground"}`}>
                  {leadCount === null ? "—" : leadCount.toLocaleString()}
                </span>
              ) : (
                <button type="button" onClick={openAgentManager} className="text-sm font-bold text-blue-600 hover:underline">
                  Upgrade to access →
                </button>
              )}
            </div>
            {fType && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Foreclosure Type</span>
                <span
                  className={`rounded px-2 py-0.5 text-sm font-medium text-white ${
                    fType === "both" ? "bg-purple-600" : fType === "judicial" ? "bg-blue-600" : "bg-red-600"
                  }`}
                >
                  {fType === "both" ? "Hybrid" : fType === "judicial" ? "Judicial" : "Non-Judicial"}
                </span>
              </div>
            )}
          </div>

          {/* State law (blurred for non-agents) */}
          {og && (og.taxOverageStatute || og.mortgageOverageStatute || og.notes) && (
            <div className="mt-3 border-t pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                State Law — {st?.name || abbr}
              </p>
              <div className="relative">
                <div className={isOwnerOperator ? "space-y-1.5" : "pointer-events-none select-none space-y-1.5 blur-sm"}>
                  {og.taxOverageStatute && (
                    <div className="flex items-start gap-2 text-sm">
                      <Scale size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                      <span>
                        <span className="font-semibold">Tax overage:</span> {og.taxOverageStatute}
                      </span>
                    </div>
                  )}
                  {og.mortgageOverageStatute && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                      <span>
                        <span className="font-semibold">Mortgage overage:</span> {og.mortgageOverageStatute}
                      </span>
                    </div>
                  )}
                  {og.notes && <p className="text-xs text-muted-foreground">{og.notes}</p>}
                </div>
                {!isOwnerOperator && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button type="button" onClick={openAgentManager} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                      <Lock size={12} /> Upgrade to access
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee cap warning */}
          {FEE_CAP_2500_STATES.has(abbr) && (
            <div className="mt-3 flex items-center gap-2 border-t pt-3">
              <div className="flex shrink-0 items-center justify-center rounded bg-red-800 p-1">
                <X size={14} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-xs font-semibold text-red-600">
                $2,500 asset recovery fee cap in {st?.name || abbr}
              </span>
            </div>
          )}

          {/* County contact + court filing */}
          {(contact || courtInfo) &&
            (isOwnerOperator ? (
              <>
                {contact && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">County Contact</p>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Phone size={14} />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Mail size={14} />
                        {contact.email}
                      </a>
                    )}
                    {contact.website && (
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Globe size={14} />
                        Visit Website
                      </a>
                    )}
                  </div>
                )}
                {courtInfo && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Court Filing</p>
                    {(courtInfo.efilingUrl || courtInfo.statewideEfilingUrl) && (
                      <a
                        href={courtInfo.efilingUrl || courtInfo.statewideEfilingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                      >
                        <FileText size={14} />
                        {courtInfo.efilingSystem || courtInfo.statewideEfilingSystem || "E-Filing System"}
                      </a>
                    )}
                    {courtInfo.phone && (
                      <a
                        href={`tel:${courtInfo.phone.replace(/[^+\d]/g, "")}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Phone size={14} />
                        {courtInfo.phone}
                      </a>
                    )}
                    {courtInfo.fax && (
                      <div className="flex items-center gap-2 text-sm">
                        <Printer size={14} className="text-muted-foreground" />
                        Fax: {courtInfo.fax}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="relative mt-3 border-t pt-3">
                <div className="pointer-events-none select-none space-y-2 blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">County Contact</p>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Phone size={14} /> (555) 000-0000
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Mail size={14} /> contact@county.gov
                  </div>
                  <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Court Filing</p>
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <FileText size={14} /> E-Filing System
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-background/75">
                  <div className="max-w-[260px] rounded-xl border border-amber-400 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-stone-900">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                      <ShieldAlert size={20} className="text-amber-700 dark:text-amber-400" />
                    </div>
                    <p className="mb-1 text-[13px] font-bold text-amber-800 dark:text-amber-400">
                      Asset Recovery Agents Only
                    </p>
                    <p className="mb-2.5 text-[11px] leading-snug text-stone-500 dark:text-stone-400">
                      County contact data, court filing links, and e-filing access are available to Asset Recovery
                      Agents.
                    </p>
                    <button type="button" onClick={openAgentManager} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white">
                      <Lock size={12} /> Become an Asset Recovery Agent
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
