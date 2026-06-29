// Certified-letter weekly credit policy.
// Each agent gets FREE_LIMIT certified letters per week that the company prints + mails
// for free. Beyond that they either wait for the weekly reset (Monday 12:00 noon Pacific)
// or buy extra at PRICE_PER_LETTER each (invoiced via the Certified Credits modal).

export const FREE_LIMIT = 5
export const PRICE_PER_LETTER_CENTS = 1000 // $10.00
const TZ = "America/Los_Angeles"

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
