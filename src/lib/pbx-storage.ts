import { supabaseAdmin } from "@/lib/supabase"

// Time-boxed access to the pbx-config bucket for the live phone path.
//
// SignalWire abandons an inbound call if the answering webhook has not responded in
// ~6 seconds. Measured 2026-07-29: EVERY failed CDR on the AI-direct DIDs
// (+17023471240, +14707194068) is exactly 6.000s, while +18889073234 — whose first
// document is a tiny <Play> with no storage touch — never failed. foreclosure-db
// storage was measured at 1.1s-22.6s per call (avg 5.4s), so an unbounded await here
// drops the call before the caller hears a single word. That is what "the AI
// assistant hung up on me" actually is: dead air, then a drop.
//
// Everything below therefore fails soft: a timeout yields null and the caller keeps
// their call. Losing a turn of conversation memory is always better than losing the
// caller. The same reasoning already justified serving the IVR menu audio from Vercel
// instead of this bucket (see api/sw/voice/route.ts).
const READ_BUDGET_MS = 2500
const WRITE_BUDGET_MS = 2500

function withTimeout<T>(work: PromiseLike<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    Promise.resolve(work).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
    )
  })
}

/**
 * Read outcome. `absent` means storage answered and the object is not there;
 * `unavailable` means storage did not answer in time, so we know nothing. Callers
 * whose correctness depends on "has this happened before?" (send-once markers) must
 * treat `unavailable` as "assume yes" rather than folding it in with `absent`.
 */
export type ReadResult<T> =
  | { status: "found"; value: T }
  | { status: "absent" }
  | { status: "unavailable" }

/** Download + JSON.parse an object from pbx-config, reporting why a read came back empty. */
export async function readJsonResult<T>(path: string, budgetMs = READ_BUDGET_MS): Promise<ReadResult<T>> {
  const result = await withTimeout(
    supabaseAdmin.storage.from("pbx-config").download(path),
    budgetMs,
  )
  if (result === null) return { status: "unavailable" }
  if (!result.data) return { status: "absent" }
  try {
    return { status: "found", value: JSON.parse(await result.data.text()) as T }
  } catch {
    return { status: "absent" }
  }
}

/** Convenience wrapper for reads where "missing" and "unavailable" are equivalent. */
export async function readJson<T>(path: string, budgetMs = READ_BUDGET_MS): Promise<T | null> {
  const result = await readJsonResult<T>(path, budgetMs)
  return result.status === "found" ? result.value : null
}

/** Upsert a JSON object into pbx-config. Returns false on timeout/error — never throws. */
export async function writeJson(path: string, value: unknown, budgetMs = WRITE_BUDGET_MS): Promise<boolean> {
  const result = await withTimeout(
    supabaseAdmin.storage.from("pbx-config").upload(
      path,
      new Blob([JSON.stringify(value)], { type: "application/json" }),
      { upsert: true },
    ),
    budgetMs,
  )
  return Boolean(result && !result.error)
}

/** Best-effort delete. Never throws, never blocks the caller past the budget. */
export async function removeObject(path: string, budgetMs = WRITE_BUDGET_MS): Promise<void> {
  await withTimeout(supabaseAdmin.storage.from("pbx-config").remove([path]), budgetMs)
}
