import { supabaseAdmin } from "@/lib/supabase"
import type { DocType, GateResult, MergeContext } from "./types"

/**
 * Persist a gate evaluation. Writes generated_documents always; writes send_blocks when there
 * are hard fails (in shadow mode these are "would have blocked" rows). Never throws — logging
 * must not break the user action.
 */
export async function logGateResult(opts: {
  ctx: MergeContext
  result: GateResult
  docType: DocType
  actor: string
  artifactRef?: string
}): Promise<void> {
  const { ctx, result, docType, actor, artifactRef } = opts
  try {
    const { data: doc } = await supabaseAdmin
      .from("generated_documents")
      .insert({
        lead_id: ctx.leadId,
        doc_type: docType,
        gate_mode: result.mode,
        gate_passed: result.passed,
        gate_blocked: result.blocked,
        gate_fails: result.fails,
        state: ctx.propertyState || null,
        estimated_surplus: ctx.estimatedSurplus || null,
        artifact_ref: artifactRef || null,
        created_by: actor,
      })
      .select("id")
      .single()

    if (result.fails.length > 0) {
      await supabaseAdmin.from("send_blocks").insert({
        lead_id: ctx.leadId,
        state: ctx.propertyState || null,
        doc_type: docType,
        gate_mode: result.mode,
        would_block: true,
        failed_checks: result.fails,
        actor,
      })
    }
    void doc
  } catch (e) {
    console.error("[logGateResult] failed", { leadId: ctx.leadId, error: e instanceof Error ? e.message : e })
  }
}
