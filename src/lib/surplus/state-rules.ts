import { supabaseAdmin } from "@/lib/supabase"
import type { StateRule } from "./types"

// In-process cache. State rules change rarely (only when counsel verifies a state).
const cache = new Map<string, { rule: StateRule | null; at: number }>()
const TTL_MS = 5 * 60 * 1000

/**
 * Authoritative compliance source. Reads surplus_state_rules (migration 005).
 * Returns null if the jurisdiction is not seeded — the gate treats that as a hard fail (check 1).
 */
export async function getStateRule(stateAbbr: string | null | undefined): Promise<StateRule | null> {
  const key = (stateAbbr || "").trim().toUpperCase()
  if (!key || key.length !== 2) return null

  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rule

  try {
    const { data, error } = await supabaseAdmin
      .from("surplus_state_rules")
      .select("*")
      .eq("state", key)
      .single()
    if (error) {
      // Not seeded / transient — do NOT throw; the gate will fail check 1 closed.
      console.error("[getStateRule] lookup failed", { state: key, error: error.message })
      cache.set(key, { rule: null, at: Date.now() })
      return null
    }
    const rule = data as StateRule
    cache.set(key, { rule, at: Date.now() })
    return rule
  } catch (e) {
    console.error("[getStateRule] exception", { state: key, error: e instanceof Error ? e.message : e })
    return null
  }
}

export function clearStateRuleCache(): void {
  cache.clear()
}
