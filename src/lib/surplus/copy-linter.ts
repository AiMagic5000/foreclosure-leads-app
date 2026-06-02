// Agent custom-copy compliance linter (handoff Section 8).
// Agents may write their own outreach copy; this catches banned language before it ships.
// Severity: "block" = must not send; "flag" = warn/review.

export type CopySeverity = "block" | "flag"

export interface CopyViolation {
  rule: string
  severity: CopySeverity
  match: string
  message: string
}

export interface CopyReview {
  passed: boolean            // true when no "block" violations
  violations: CopyViolation[]
}

interface Rule {
  rule: string
  severity: CopySeverity
  pattern: RegExp
  message: string
  // If set, the match is only a violation when this guard is NOT satisfied by the copy.
  unless?: RegExp
}

const RULES: Rule[] = [
  {
    rule: "guarantee_language",
    severity: "block",
    pattern: /\b(guarantee[ds]?|guaranteed|confirmed yours|(these funds|the money|it) (is|are) (legally )?yours|belongs to you)\b/i,
    message: 'Absolute ownership/guarantee claims are prohibited. Surplus is a preliminary estimate "subject to verification".',
  },
  {
    rule: "absolute_no_risk",
    severity: "block",
    pattern: /\bno risk whatsoever|zero risk|risk[- ]free|absolutely no risk\b/i,
    message: 'Absolute risk claims are prohibited. Use "no upfront cost" / "we are paid only if you are".',
  },
  {
    rule: "lose_forever",
    severity: "block",
    pattern: /\b(lose it forever|gone forever|permanent(ly)? (property of|forfeit)|government keeps? it forever)\b/i,
    unless: /\b(deadline|statute|claim window|state law|years? from the (date of )?sale)\b/i,
    message: 'Loss/forfeiture scare language is only allowed when tied to a verified state deadline.',
  },
  {
    rule: "off_program_contact",
    severity: "block",
    pattern: /([a-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|icloud|proton(mail)?)\.[a-z]+)|\b(my (personal )?cell|text me (personally|directly) at)\b/i,
    message: "Off-program / personal contact info is prohibited. Use your name@usforeclosurerecovery.com and the program 800 line.",
  },
  {
    rule: "missing_self_claim_disclosure",
    severity: "block",
    pattern: /^[\s\S]*$/,
    unless: /\b(claim (these )?funds? yourself|on your own|you (are )?(never|not) required to use|at little or no cost|contact(ing)? the (court|county|state|government) (office )?(directly|yourself))\b/i,
    message: 'Required disclosure missing: the recipient must be told they may claim the funds themselves (possibly free).',
  },
  {
    rule: "specific_dollar_amount_cold",
    severity: "flag",
    pattern: /\$\s?\d{1,3}(,\d{3})+(\.\d+)?|\$\s?\d{4,}/,
    message: "Specific dollar amounts in cold copy are discouraged; if used, label as a preliminary estimate subject to verification.",
  },
  {
    rule: "generic_unclaimed_framing",
    severity: "flag",
    pattern: /\b(we audit government records|unclaimed (money|property|funds) (database|records)|find money the government owes you)\b/i,
    message: "Generic unclaimed-property framing misrepresents the product (foreclosure surplus). Be specific about foreclosure surplus.",
  },
]

export function reviewCopy(rawCopy: string): CopyReview {
  const copy = rawCopy || ""
  const violations: CopyViolation[] = []

  for (const r of RULES) {
    const m = copy.match(r.pattern)
    if (!m) continue
    // "unless" rules fire when the guard is ABSENT.
    if (r.unless) {
      if (r.unless.test(copy)) continue
      violations.push({
        rule: r.rule,
        severity: r.severity,
        match: r.rule === "missing_self_claim_disclosure" ? "(disclosure absent)" : (m[0] || "").slice(0, 80),
        message: r.message,
      })
      continue
    }
    violations.push({ rule: r.rule, severity: r.severity, match: (m[0] || "").slice(0, 80), message: r.message })
  }

  const passed = !violations.some((v) => v.severity === "block")
  return { passed, violations }
}
