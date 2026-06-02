// Surplus compliance gate — shared types.

export type LegalStatus = "verified" | "unverified"
export type NonAttorneyAllowed = "yes" | "no" | "restricted"
export type GateMode = "shadow" | "soft" | "enforce"
export type Channel = "email" | "sms" | "rvm" | "certified_mail" | "phone"
export type DocType = "email" | "agreement"

export interface StateRule {
  state: string
  state_name: string
  foreclosure_type: string | null
  covers: string | null
  claim_deadline_text: string | null
  claim_deadline_months: number | null
  fund_holder: string | null
  venue_text: string | null
  nonattorney_recovery_allowed: NonAttorneyAllowed | null
  fee_cap_pct: number | null
  fee_cap_text: string | null
  solicitation_restrictions: string | null
  statute_refs: string | null
  legal_status: LegalStatus
  research_confidence: string | null
  notes: string | null
}

/**
 * The single-source merge context. Every value that goes into BOTH the email and
 * the agreement is resolved here exactly once, so the two documents can never disagree.
 */
export interface MergeContext {
  leadId: string
  claimantName: string
  claimantAddress: string
  claimantPhone: string
  propertyAddress: string
  propertyState: string          // 2-letter, authoritative
  propertyType: string
  saleDate: string
  estimatedSurplus: number        // SINGLE SOURCE OF TRUTH
  estimatedSurplusFormatted: string
  feePct: number                  // proposed contingency %, already capped to state max
  governingLawState: string       // === propertyState, always
  venueText: string
  fundHolder: string
  claimDeadlineText: string
  claimDeadlineMonths: number | null
  rule: StateRule | null
}

export type Severity = "hard" | "warn"

export interface GateCheck {
  id: number
  name: string
  severity: Severity
  passed: boolean
  message: string
}

export interface GateResult {
  passed: boolean                 // true when NO hard check failed
  mode: GateMode
  blocked: boolean                // whether this result actually blocks the action (mode-dependent)
  state: string
  fails: GateCheck[]              // hard failures
  warnings: GateCheck[]          // warn failures
  checks: GateCheck[]            // all 15, pass or fail
}
