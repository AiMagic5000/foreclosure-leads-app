import type { MergeContext, StateRule } from "./types"

const DEFAULT_FEE_PCT = 30

export function formatSurplus(amount: number): string {
  // Never show "$0" on a lead — an unknown surplus is verified with the claimant, not zero.
  if (!Number.isFinite(amount) || amount <= 0) return "To be verified"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parse the trailing 2-letter state from a full address like "123 Main St, Fort Lauderdale, FL 33301".
 * Returns "" if not confidently found.
 */
export function parseStateFromAddress(address: string): string {
  if (!address) return ""
  // Look for ", ST ZIP" or ", ST" near the end.
  const m = address.match(/,\s*([A-Za-z]{2})\s*\d{5}(?:-\d{4})?\s*$/) || address.match(/,\s*([A-Za-z]{2})\s*$/)
  return m ? m[1].toUpperCase() : ""
}

/**
 * Cap the proposed fee to the state's statutory maximum.
 * If the state has a numeric fee_cap_pct, the proposed fee may not exceed it.
 */
export function resolveFeePct(rule: StateRule | null, requested = DEFAULT_FEE_PCT): number {
  if (rule && typeof rule.fee_cap_pct === "number" && rule.fee_cap_pct >= 0) {
    return Math.min(requested, rule.fee_cap_pct)
  }
  return requested
}

export interface LeadLike {
  id: string
  owner_name?: string | null
  property_address?: string | null
  mailing_address?: string | null
  city?: string | null
  state?: string | null
  state_abbr?: string | null
  zip_code?: string | null
  property_type?: string | null
  lead_type?: string | null
  foreclosure_type?: string | null
  sale_date?: string | null
  overage_amount?: string | number | null
  estimated_surplus?: string | number | null
  assessed_value?: string | number | null
  estimated_market_value?: string | number | null
  sale_amount?: string | number | null
  primary_phone?: string | null
}

function num(v: unknown): number {
  if (typeof v === "number") return v
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""))
  return Number.isFinite(n) ? n : 0
}

/**
 * Build the single-source merge context. estimatedSurplus is resolved ONCE here and
 * is the ONLY surplus figure either document may use. Governing law / venue === property state.
 */
export function buildMergeContext(lead: LeadLike, rule: StateRule | null, requestedFeePct = DEFAULT_FEE_PCT): MergeContext {
  const propertyState = (lead.state || lead.state_abbr || "").trim().toUpperCase()
  const city = lead.city || ""
  const rawProp = lead.property_address || ""
  const propertyAddress = rawProp
    ? (city && propertyState ? `${rawProp}, ${city}, ${propertyState}${lead.zip_code ? ` ${lead.zip_code}` : ""}` : rawProp)
    : (lead.mailing_address || "")

  // Resolve surplus once. Real overage first; if none, estimate from comparable sales
  // (market value/Zestimate minus opening bid). Never fall back to $0.
  let estimatedSurplus = num(lead.overage_amount) || num(lead.estimated_surplus) || 0
  let surplusEstimated = false
  if (estimatedSurplus <= 0) {
    const marketValue = num(lead.assessed_value) || num(lead.estimated_market_value) || 0
    const saleAmt = num(lead.sale_amount) || 0
    if (marketValue > 0 && saleAmt > 0 && marketValue > saleAmt) {
      estimatedSurplus = Math.round(marketValue - saleAmt)
      surplusEstimated = true
    }
  }
  const estimatedSurplusFormatted = estimatedSurplus > 0
    ? formatSurplus(estimatedSurplus) + (surplusEstimated ? " (estimated from comparable sales)" : "")
    : "To be verified"
  const feePct = resolveFeePct(rule, requestedFeePct)

  return {
    leadId: lead.id,
    claimantName: lead.owner_name || "",
    claimantAddress: lead.mailing_address || propertyAddress,
    claimantPhone: lead.primary_phone || "",
    propertyAddress,
    propertyState,
    propertyType: lead.property_type || "Residential",
    leadType: lead.lead_type || "",
    foreclosureType: lead.foreclosure_type || "",
    saleDate: lead.sale_date || "",
    estimatedSurplus,
    estimatedSurplusFormatted,
    feePct,
    governingLawState: propertyState,
    venueText: rule?.venue_text || (propertyState ? `Claimant's jurisdiction, ${rule?.state_name || propertyState}` : ""),
    fundHolder: rule?.fund_holder || "",
    claimDeadlineText: rule?.claim_deadline_text || "",
    claimDeadlineMonths: rule?.claim_deadline_months ?? null,
    rule,
  }
}
