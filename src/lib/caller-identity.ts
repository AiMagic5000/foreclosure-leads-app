// Single source of truth for "who is calling this API".
//
// Two failure modes cost a paying agent an entire working day on 2026-07-31, and
// both are easy to reintroduce, so every route should use these helpers instead
// of reading Clerk directly:
//
//  1. `user.emailAddresses[0]` is NOT guaranteed to be the primary address. An
//     agent with a second address on their Clerk account (a company mailbox added
//     so they can sign in with either) can land with the address that has no
//     user_pins row at index 0. Every email-keyed lookup then misses and the agent
//     is treated as a stranger — 403s on comms, contact details hidden behind a
//     PIN prompt, phone saves that silently write to zero rows.
//
//  2. `.single()` and `.maybeSingle()` BOTH null out `data` when a query returns
//     more than one row (maybeSingle only tolerates ZERO rows, not many). Both
//     `users` and `user_pins` contain duplicate rows for some emails, so these
//     silently deny access to real agents. Use limit-then-pick instead.
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"

type Clerkish = {
  emailAddresses?: { id?: string; emailAddress?: string | null }[] | null
  primaryEmailAddressId?: string | null
} | null | undefined

/**
 * Every address this caller could legitimately be known by, canonicalised and
 * deduped, primary first. Never returns undefined entries.
 */
export function resolveCallerEmails(user: Clerkish): string[] {
  const list = user?.emailAddresses ?? []
  const primary = list.find((e) => e?.id && e.id === user?.primaryEmailAddressId)?.emailAddress
  return Array.from(
    new Set(
      [primary, ...list.map((e) => e?.emailAddress)]
        .filter(Boolean)
        .map((e) => canonicalEmail(String(e)))
        .filter(Boolean)
    )
  )
}

// Prefer the pin that actually looks like the agent's working account: one with
// comms credentials connected, then the highest tier. Mirrors user/role.
const PKG_RANK: Record<string, number> = {
  admin: 0, owner_operator: 1, junior_owner_operator: 2, multi_state: 2, partnership: 3, basic: 9,
}

export type PinRow = {
  id: string
  email?: string | null
  package_type?: string | null
  is_active?: boolean | null
  slybroadcast_email?: string | null
  textbee_api_key?: string | null
  [k: string]: unknown
}

export function pickBestPin<T extends PinRow>(rows: T[]): T | null {
  return (
    [...rows].sort((a, b) => {
      const ca = (a?.slybroadcast_email ? 1 : 0) + (a?.textbee_api_key ? 1 : 0)
      const cb = (b?.slybroadcast_email ? 1 : 0) + (b?.textbee_api_key ? 1 : 0)
      if (cb !== ca) return cb - ca
      return (PKG_RANK[String(a?.package_type ?? "")] ?? 5) - (PKG_RANK[String(b?.package_type ?? "")] ?? 5)
    })[0] || null
  )
}

/**
 * Find the caller's active pin across ALL their addresses. Never uses
 * .single()/.maybeSingle(), so duplicate rows degrade to "pick the best one"
 * rather than "deny access".
 */
export async function resolvePinForEmails(
  emails: string[],
  columns = "id, email, package_type, is_active, slybroadcast_email, textbee_api_key"
): Promise<PinRow | null> {
  for (const email of emails) {
    if (!email) continue
    const { data } = await supabaseAdmin
      .from("user_pins")
      .select(columns)
      .ilike("email", email)
      .eq("is_active", true)
      .limit(5)
    const best = pickBestPin((data ?? []) as unknown as PinRow[])
    if (best) return best
  }
  return null
}

/** Convenience: resolve straight from a Clerk user object. */
export async function resolvePinForUser(user: Clerkish, columns?: string): Promise<PinRow | null> {
  return resolvePinForEmails(resolveCallerEmails(user), columns)
}
