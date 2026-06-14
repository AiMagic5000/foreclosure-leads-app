// Per-lead economics. The firm charges the claimant a recovery fee of UP TO 30%
// of the surplus (capped lower by state statute where applicable). That total
// fee is then split 50/50 between the firm and the partner agent.
// Fee caps sourced from the "50 States Overage Guide" (statutory finder/recovery limits).

export const MAX_FEE_PCT = 30   // max total fee charged to the claimant
export const FIRM_SHARE = 0.5   // firm's half of the fee
export const AGENT_SHARE = 0.5  // agent's half of the fee (50/50 partnership)

// pct = max % of the surplus the fee may be; flat = hard $ cap on the total fee;
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
  feePct: number          // effective total fee % charged to claimant
  flatCap: number | null
  restricted: boolean
  totalFee: number | null // total $ the claimant pays (null if overage unknown)
  firmCut: number | null  // firm's 50%
  agentCut: number | null // agent's 50%
  capLabel: string        // e.g. "30%", "20% (TX cap)", "$1,000 cap", "restricted"
  note?: string
}

export function leadEconomics(overage: number | null | undefined, stateAbbr: string | null | undefined): LeadEconomics {
  const state = (stateAbbr || "").toUpperCase()
  const cap = STATE_FEE_CAP[state] || {}
  const restricted = !!cap.restricted
  const feePct = restricted ? 0 : Math.min(MAX_FEE_PCT, cap.pct ?? MAX_FEE_PCT)
  const flatCap = cap.flat ?? null
  const ov = typeof overage === "number" && overage > 0 ? overage : null

  let totalFee: number | null = null
  if (ov !== null && !restricted) {
    totalFee = ov * (feePct / 100)
    if (flatCap !== null) totalFee = Math.min(totalFee, flatCap)
  }
  const firmCut = totalFee !== null ? totalFee * FIRM_SHARE : null
  const agentCut = totalFee !== null ? totalFee * AGENT_SHARE : null

  let capLabel: string
  if (restricted) capLabel = "restricted"
  else if (flatCap !== null && cap.pct === undefined) capLabel = `$${flatCap.toLocaleString()} cap`
  else if (flatCap !== null) capLabel = `${feePct}% / $${flatCap.toLocaleString()} cap`
  else capLabel = `${feePct}%${cap.pct !== undefined ? ` (${state} cap)` : ""}`

  return { overage: ov, state, feePct, flatCap, restricted, totalFee, firmCut, agentCut, capLabel, note: cap.note }
}

export function fmtUsd(n: number | null): string {
  if (n == null) return "—"
  return "$" + Math.round(n).toLocaleString("en-US")
}
