// Per-lead economics: what the firm can charge the claimant (capped by state),
// and the partner agent's 50/50 cut of that fee.
// Fee caps sourced from the "50 States Overage Guide" (statutory finder/recovery
// fee limits). Firm charges UP TO 40% where no lower statutory cap applies.

export const FIRM_MAX_PCT = 40
export const AGENT_SHARE = 0.5 // 50/50 partnership

// pct = max % of the surplus the firm may charge; flat = hard $ cap;
// restricted = state where non-attorney recovery is barred/illegal.
type Cap = { pct?: number; flat?: number; restricted?: boolean; note?: string }

export const STATE_FEE_CAP: Record<string, Cap> = {
  WA: { pct: 5, note: "RCW 63.29.350" },
  AR: { pct: 10, note: ">10% unconscionable" },
  IN: { pct: 10 },
  NV: { pct: 10, flat: 2500, note: "tax 10% / mortgage $2,500" },
  TN: { pct: 10, note: "PI license required" },
  CO: { pct: 20, note: "30-mo deadline" },
  TX: { pct: 20, note: "assignment form; non-attorney limits" },
  FL: { pct: 20, note: "POA limit (stmt 717)" },
  HI: { pct: 25 },
  NC: { flat: 1000 },
  AZ: { flat: 2500, note: "mortgage finder limit" },
  CA: { restricted: true, note: "mortgage recovery restricted" },
}

export interface LeadEconomics {
  overage: number | null
  state: string
  feePct: number          // effective % the firm charges
  flatCap: number | null  // $ cap if any
  restricted: boolean
  firmCut: number | null  // $ the firm earns (null if overage unknown)
  agentCut: number | null // $ the agent earns (50% of firm cut)
  capLabel: string        // e.g. "20% (TX cap)" or "40%" or "$1,000 cap"
  note?: string
}

export function leadEconomics(overage: number | null | undefined, stateAbbr: string | null | undefined): LeadEconomics {
  const state = (stateAbbr || "").toUpperCase()
  const cap = STATE_FEE_CAP[state] || {}
  const restricted = !!cap.restricted
  const feePct = restricted ? 0 : Math.min(FIRM_MAX_PCT, cap.pct ?? FIRM_MAX_PCT)
  const flatCap = cap.flat ?? null
  const ov = typeof overage === "number" && overage > 0 ? overage : null

  let firmCut: number | null = null
  if (ov !== null && !restricted) {
    firmCut = ov * (feePct / 100)
    if (flatCap !== null) firmCut = Math.min(firmCut, flatCap)
  }
  const agentCut = firmCut !== null ? firmCut * AGENT_SHARE : null

  let capLabel: string
  if (restricted) capLabel = "restricted"
  else if (flatCap !== null && cap.pct === undefined) capLabel = `$${flatCap.toLocaleString()} cap`
  else if (flatCap !== null) capLabel = `${feePct}% / $${flatCap.toLocaleString()} cap`
  else capLabel = `${feePct}%${cap.pct !== undefined ? ` (${state} cap)` : ""}`

  return { overage: ov, state, feePct, flatCap, restricted, firmCut, agentCut, capLabel, note: cap.note }
}

export function fmtUsd(n: number | null): string {
  if (n == null) return "—"
  return "$" + Math.round(n).toLocaleString("en-US")
}
