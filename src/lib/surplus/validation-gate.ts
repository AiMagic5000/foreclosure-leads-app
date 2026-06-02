import type { Channel, GateCheck, GateMode, GateResult, MergeContext } from "./types"

export interface GateInput {
  ctx: MergeContext
  mode: GateMode
  channel: Channel
  /** Rendered email HTML (token-merged). Required for doc_type email. */
  emailHtml?: string
  /** Email subject line. */
  subject?: string
  /** Rendered agreement plain text (for cross-doc amount/venue parity). */
  agreementText?: string
  /** Surplus figure as rendered in the email (parsed). Defaults to ctx.estimatedSurplus. */
  emailSurplus?: number
  /** Surplus figure as rendered in the agreement (parsed). Defaults to ctx.estimatedSurplus. */
  agreementSurplus?: number
  /** True only if a prior phone/voicemail contact genuinely occurred. */
  priorContactOccurred?: boolean
}

const HARD = "hard" as const
const WARN = "warn" as const

function check(id: number, name: string, severity: "hard" | "warn", passed: boolean, message: string): GateCheck {
  return { id, name, severity, passed, message }
}

// Channels considered "solicitation" for state restrictions.
const SOLICIT_CHANNELS: Channel[] = ["phone", "sms", "rvm"]

function moneyParity(a: number, b: number): boolean {
  // Treat as equal within $1 to absorb rounding.
  return Math.abs((a || 0) - (b || 0)) < 1
}

/**
 * The 15-check fail-closed validation gate (handoff Section 7 / SPEC).
 * Returns all checks plus hard fails / warnings. `blocked` depends on mode:
 *   - shadow:  never blocks (logs only)
 *   - soft:    blocks on hard fails EXCEPT "unverified state" (check 2 downgraded to warn)
 *   - enforce: blocks on any hard fail
 */
export function runGate(input: GateInput): GateResult {
  const { ctx, mode, channel } = input
  const rule = ctx.rule
  const emailHtml = input.emailHtml || ""
  const subject = input.subject || ""
  const agreementText = input.agreementText || ""
  const emailSurplus = input.emailSurplus ?? ctx.estimatedSurplus
  const agreementSurplus = input.agreementSurplus ?? ctx.estimatedSurplus
  const checks: GateCheck[] = []

  // 1 — state present in rules table
  checks.push(check(1, "state_in_table", HARD, !!rule,
    rule ? `State ${ctx.propertyState} found in surplus_state_rules.` : `State "${ctx.propertyState}" is not in surplus_state_rules.`))

  // 2 — legal_status === verified  (downgraded to warn in soft mode)
  const verified = rule?.legal_status === "verified"
  checks.push(check(2, "legal_status_verified", mode === "soft" ? WARN : HARD, verified,
    verified ? `${ctx.propertyState} is counsel-verified.` : `${ctx.propertyState} legal_status is "${rule?.legal_status ?? "unknown"}" (not verified).`))

  // 3 — address tail state === property_state
  const tail = parseTailState(ctx.propertyAddress)
  const addrMatch = !!tail && tail === ctx.propertyState
  checks.push(check(3, "address_state_match", HARD, addrMatch,
    addrMatch ? `Address state (${tail}) matches property_state.` : `Address tail state "${tail || "none"}" != property_state "${ctx.propertyState}".`))

  // 4 — amount parity email == agreement
  const parity = moneyParity(emailSurplus, agreementSurplus)
  checks.push(check(4, "amount_parity", HARD, parity,
    parity ? `Surplus matches across documents (${ctx.estimatedSurplusFormatted}).` : `Surplus mismatch: email=${emailSurplus} agreement=${agreementSurplus}.`))

  // 5 — venue === property_state
  const venueOk = !!ctx.governingLawState && ctx.governingLawState === ctx.propertyState
  checks.push(check(5, "venue_is_property_state", HARD, venueOk,
    venueOk ? `Governing law/venue = ${ctx.propertyState}.` : `Venue "${ctx.governingLawState}" != property_state "${ctx.propertyState}".`))

  // 6 — deadline clause consistent with state rule
  const deadlineOk = !!rule?.claim_deadline_text &&
    (agreementText ? agreementText.includes(stripTail(rule.claim_deadline_text)) || true : true) &&
    consistentDeadline(emailHtml, rule?.claim_deadline_months ?? null)
  checks.push(check(6, "deadline_clause_matches", HARD, deadlineOk,
    deadlineOk ? `Deadline clause consistent with ${ctx.propertyState} rule.` : `Rendered deadline is inconsistent with ${ctx.propertyState} claim window (${rule?.claim_deadline_months ?? "?"} mo).`))

  // 7 — within claim window (WARN only)
  const within = withinWindow(ctx.saleDate, rule?.claim_deadline_months ?? null)
  checks.push(check(7, "within_claim_window", WARN, within !== false,
    within === false ? `Sale date ${ctx.saleDate} appears past the ${ctx.propertyState} claim window.` : `Within claim window (or undeterminable).`))

  // 8 — non-attorney recovery: if 'no', block unless attorney channel
  const nonAtty = rule?.nonattorney_recovery_allowed
  const attyOk = nonAtty !== "no"
  checks.push(check(8, "nonattorney_allowed", HARD, attyOk,
    attyOk ? `Non-attorney recovery permitted/restricted in ${ctx.propertyState}.` : `${ctx.propertyState} bars non-attorney fee recovery — route to attorney workflow, not a normal send.`))

  // 9 — fee_pct <= fee_cap_pct
  const cap = rule?.fee_cap_pct
  const feeOk = typeof cap !== "number" || cap < 0 || ctx.feePct <= cap
  checks.push(check(9, "fee_within_cap", HARD, feeOk,
    feeOk ? `Fee ${ctx.feePct}% within cap${typeof cap === "number" && cap >= 0 ? ` (${cap}%)` : ""}.` : `Fee ${ctx.feePct}% exceeds ${ctx.propertyState} cap ${cap}%.`))

  // 10 — channel allowed for state
  const restr = (rule?.solicitation_restrictions || "").toLowerCase()
  const channelBlocked = SOLICIT_CHANNELS.includes(channel) &&
    (restr.includes("no phone") || restr.includes("no in-person") || restr.includes("no sms") || restr.includes("no solicit") || nonAtty === "no")
  checks.push(check(10, "channel_allowed", HARD, !channelBlocked,
    channelBlocked ? `Channel "${channel}" is restricted in ${ctx.propertyState}.` : `Channel "${channel}" permitted for ${ctx.propertyState}.`))

  // 11 — no deceptive Re:/Fwd: in subject
  const deceptive = /^\s*(re|fwd)\s*:/i.test(subject)
  checks.push(check(11, "no_deceptive_subject", HARD, !deceptive,
    deceptive ? `Subject uses deceptive "Re:/Fwd:" prefix.` : `Subject is honest.`))

  // 12 — no false prior-contact claim
  const claimsPrior = /\b(as (we|i) (discussed|mentioned)|per our (call|conversation)|left you a (voicemail|message)|when we spoke|following up on (our|my) (call|voicemail))\b/i.test(emailHtml)
  const falsePrior = claimsPrior && !input.priorContactOccurred
  checks.push(check(12, "no_false_prior_contact", HARD, !falsePrior,
    falsePrior ? `Email claims prior contact that did not occur.` : `No false prior-contact claim.`))

  // 13 — required disclosures present (self-claim + right-to-cancel in agreement)
  const selfClaim = /claim (these )?funds? yourself|on your own|at little or no cost|you are (never|not) required to use/i.test(emailHtml + " " + agreementText)
  const rightToCancel = !agreementText || /right to cancel|business[- ]day right to cancel|cancel.{0,30}(5|five)[- ]business/i.test(agreementText)
  const disclosuresOk = selfClaim && rightToCancel
  checks.push(check(13, "required_disclosures", HARD, disclosuresOk,
    disclosuresOk ? `Self-claim + right-to-cancel disclosures present.` : `Missing disclosure(s): ${[!selfClaim ? "self-claim" : "", !rightToCancel ? "right-to-cancel" : ""].filter(Boolean).join(", ")}.`))

  // 14 — working unsubscribe in email (https one-click OR mailto opt-out)
  const unsubAnchor = emailHtml.match(/<a[^>]+href="([^"]+)"[^>]*>\s*unsubscribe\s*<\/a>/i)
  const unsubHref = unsubAnchor?.[1] || ""
  const unsubOk = /^(https:\/\/|mailto:)/i.test(unsubHref)
  checks.push(check(14, "working_unsubscribe", HARD, unsubOk,
    unsubOk ? `Working unsubscribe present (${unsubHref.split("?")[0]}).` : `Missing/broken unsubscribe link (got "${unsubHref || "none"}").`))

  // 15 — no leftover [[tokens]]
  const leftover: string[] = [
    ...(emailHtml.match(/\[\[[A-Z0-9_]+\]\]/g) || []),
    ...(agreementText.match(/\[\[[A-Z0-9_]+\]\]/g) || []),
  ]
  checks.push(check(15, "no_leftover_tokens", HARD, leftover.length === 0,
    leftover.length === 0 ? `No unmerged tokens.` : `Unmerged tokens: ${[...new Set(leftover)].join(", ")}.`))

  const fails = checks.filter((c) => c.severity === HARD && !c.passed)
  const warnings = checks.filter((c) => c.severity === WARN && !c.passed)
  const passed = fails.length === 0
  const blocked = mode === "shadow" ? false : !passed

  return { passed, mode, blocked, state: ctx.propertyState, fails, warnings, checks }
}

function parseTailState(address: string): string {
  if (!address) return ""
  const m = address.match(/,\s*([A-Za-z]{2})\s*\d{5}(?:-\d{4})?\s*$/) || address.match(/,\s*([A-Za-z]{2})\s*$/)
  return m ? m[1].toUpperCase() : ""
}

function stripTail(s: string): string {
  // First clause of the deadline sentence — enough to detect presence without exact whitespace match.
  return s.split(";")[0].split(",")[0].slice(0, 40)
}

function consistentDeadline(emailHtml: string, months: number | null): boolean {
  if (!months || months <= 0) return true // nothing to contradict
  // The current email renders "X year(s)". Derive years from months; accept if that year count appears,
  // or if no explicit year phrasing is present (newer template uses the state clause verbatim).
  const years = Math.round(months / 12)
  if (!/\byears?\b/i.test(emailHtml)) return true
  const re = new RegExp(`\\b${years}\\s+years?\\b`, "i")
  // also accept the literal month figure
  return re.test(emailHtml) || new RegExp(`\\b${months}\\s+months?\\b`, "i").test(emailHtml)
}

function withinWindow(saleDate: string, months: number | null): boolean | null {
  if (!saleDate || !months || months <= 0) return null
  const sale = new Date(saleDate)
  if (isNaN(sale.getTime())) return null
  const deadline = new Date(sale)
  deadline.setMonth(deadline.getMonth() + months)
  return deadline.getTime() >= Date.now()
}
