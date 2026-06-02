import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { isCommsAuthorized, resolveOperatorConfig } from "@/lib/operator-config"
import { reviewCopy } from "@/lib/surplus/copy-linter"

// POST /api/review-copy  { raw_copy }
// Runs the banned-language linter over agent-authored outreach copy, logs the review,
// and returns { passed, violations[] }. Agents must pass through this before using custom copy.
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    if (!userEmail || !(await isCommsAuthorized(userEmail))) {
      return NextResponse.json({ error: "Access required" }, { status: 403 })
    }

    const body = await request.json()
    const rawCopy = String(body?.raw_copy ?? "")
    if (!rawCopy.trim()) {
      return NextResponse.json({ error: "raw_copy is required" }, { status: 400 })
    }

    const review = reviewCopy(rawCopy)

    // Resolve the agent's pin id (best effort) for the audit row.
    let agentId: string | null = null
    try {
      const config = await resolveOperatorConfig({ clerkEmail: userEmail, operatorPinId: body?.operatorPinId || null })
      agentId = config.pinId || null
    } catch {
      agentId = null
    }

    try {
      await supabaseAdmin.from("outreach_copy_reviews").insert({
        agent_id: agentId,
        raw_copy: rawCopy.slice(0, 8000),
        violations: review.violations,
        passed: review.passed,
      })
    } catch (e) {
      console.error("[review-copy] log failed", e instanceof Error ? e.message : e)
    }

    return NextResponse.json({ success: true, passed: review.passed, violations: review.violations })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
