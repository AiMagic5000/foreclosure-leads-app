// Certified-letter credit policy.
// Each account gets FREE_WEEKLY_LIMIT (5) certified letters per week that the company
// prints + mails for free — but ONLY for the first FREE_WEEKS (4 = "one month") after the
// account is created, capped at FREE_TOTAL (20) letters. After that free month is over
// (or the 20-letter cap is reached), there are no more free credits: the agent either pays
// PRICE_PER_LETTER (shipping & handling) to have us keep mailing, or prints and mails their
// own letters (cover letter + agreement + POA) from their own printer.

export const FREE_WEEKLY_LIMIT = 5           // free letters per week during the free month
export const FREE_WEEKS = 4                  // the "one free month"
export const FREE_TOTAL = FREE_WEEKLY_LIMIT * FREE_WEEKS // 20 total free
export const PRICE_PER_LETTER_CENTS = 1250   // $12.50 shipping & handling per letter
// Back-compat alias (older imports referenced FREE_LIMIT as the weekly cap).
export const FREE_LIMIT = FREE_WEEKLY_LIMIT
const TZ = "America/Los_Angeles"

// End of the free month for an account created at createdAtISO (null-safe).
export function freeMonthEnd(createdAtISO: string | null | undefined): Date | null {
  if (!createdAtISO) return null
  const t = new Date(createdAtISO).getTime()
  if (Number.isNaN(t)) return null
  return new Date(t + FREE_WEEKS * 7 * 24 * 60 * 60 * 1000)
}

// Is the account still inside its free month?
export function inFreeMonth(createdAtISO: string | null | undefined, now: Date = new Date()): boolean {
  const end = freeMonthEnd(createdAtISO)
  return !!end && now.getTime() < end.getTime()
}

// Most recent Monday 12:00 noon Pacific, as a real UTC instant.
export function certWeekStart(now: Date = new Date()): Date {
  // "now" expressed in Pacific wall-clock fields
  const pt = new Date(now.toLocaleString("en-US", { timeZone: TZ }))
  const offset = now.getTime() - pt.getTime() // real-vs-PT-frame delta
  const day = pt.getDay() // 0 Sun .. 6 Sat
  const daysSinceMonday = (day + 6) % 7
  const monday = new Date(pt)
  monday.setDate(pt.getDate() - daysSinceMonday)
  monday.setHours(12, 0, 0, 0)
  if (pt.getTime() < monday.getTime()) monday.setDate(monday.getDate() - 7) // before Mon noon -> last week
  return new Date(monday.getTime() + offset)
}

// Next Monday 12:00 noon Pacific (when fresh free credits arrive).
export function certWeekReset(now: Date = new Date()): Date {
  return new Date(certWeekStart(now).getTime() + 7 * 24 * 60 * 60 * 1000)
}

// Certified letters this agent has requested since the weekly reset. Leads are owned
// via operator_lead_assignments (the agent_email column is unreliable), so count by pin.
// `db` is a supabase admin client (passed in to keep this lib free of server imports).
export async function freeUsedForPin(db: { from: (t: string) => any }, pinId: string, weekStartISO: string): Promise<number> {
  if (!pinId) return 0
  const { data: assigns } = await db.from("operator_lead_assignments").select("lead_id").eq("operator_pin_id", pinId)
  const leadIds = (assigns || []).map((a: { lead_id: string }) => a.lead_id)
  if (!leadIds.length) return 0
  const { count } = await db.from("foreclosure_leads")
    .select("id", { count: "exact", head: true })
    .in("id", leadIds)
    .gte("certified_letter_requested_at", weekStartISO)
  return count || 0
}
