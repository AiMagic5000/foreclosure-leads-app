import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveCallerEmails } from "@/lib/caller-identity"
import { canonicalEmail } from "@/lib/email-alias"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com").toLowerCase()

/**
 * Agent-scoped lead designation.
 *
 * These flags are the AGENT'S OWN judgement about a lead — a number that rang
 * dead for them, an address that bounced for them. They live in
 * `lead_agent_flags`, keyed (lead_id, operator_pin_id), NOT on foreclosure_leads.
 *
 * Why: they used to be columns on the lead itself, so they belonged to the lead
 * and not the person working it. A lead handed to a new agent arrived carrying
 * the previous holder's marks, and one agent's opinion silently became every
 * future agent's. Karen Campbell inherited "bad" on leads she had never dialled.
 *
 * Two agents can hold the same lead over time and each keeps their own view.
 *
 * Also: this route previously trusted whatever `pinId` the caller sent, with no
 * check that they owned it — so any signed-in user could flag any agent's leads.
 */
const ALLOWED = new Set(["bad_email", "bad_phone", "agent_status", "bad_phone_value", "bad_email_value"])

const phoneKey = (p: string) => String(p || "").replace(/\D/g, "").slice(-10)

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    leadId?: string
    pinId?: string
    field?: string
    value?: unknown
    contact?: string
  }
  const { leadId, pinId, field } = body
  if (!leadId || !pinId || !field) {
    return NextResponse.json({ error: "leadId, pinId and field are required" }, { status: 400 })
  }
  if (!ALLOWED.has(field)) return NextResponse.json({ error: "Invalid field" }, { status: 400 })

  // --- the caller must actually BE this pin (or be admin) ---
  const user = await currentUser()
  const callerEmails = resolveCallerEmails(user)
  const isAdmin = callerEmails.includes(ADMIN_EMAIL)
  if (!isAdmin) {
    const { data: pinRows } = await supabaseAdmin
      .from("user_pins").select("email").eq("id", pinId).limit(5)
    const owns = (pinRows ?? []).some((r) => callerEmails.includes(canonicalEmail(String(r.email || ""))))
    if (!owns) return NextResponse.json({ error: "That is not your account." }, { status: 403 })

    // ...and must hold this lead
    const { data: asg } = await supabaseAdmin
      .from("operator_lead_assignments")
      .select("operator_pin_id").eq("lead_id", leadId).limit(1)
    if (!asg?.length || asg[0].operator_pin_id !== pinId) {
      return NextResponse.json({ error: "This lead is not assigned to you." }, { status: 403 })
    }
  }

  // current row for this AGENT + lead (never another agent's)
  const { data: existingRows } = await supabaseAdmin
    .from("lead_agent_flags")
    .select("bad_phone, bad_email, agent_status, bad_phones, bad_emails")
    .eq("lead_id", leadId).eq("operator_pin_id", pinId).limit(1)
  const cur = existingRows?.[0] ?? {
    bad_phone: false, bad_email: false, agent_status: null,
    bad_phones: [] as string[], bad_emails: [] as string[],
  }

  const patch: Record<string, unknown> = {
    lead_id: leadId,
    operator_pin_id: pinId,
    bad_phone: cur.bad_phone ?? false,
    bad_email: cur.bad_email ?? false,
    agent_status: cur.agent_status ?? null,
    bad_phones: cur.bad_phones ?? [],
    bad_emails: cur.bad_emails ?? [],
    updated_at: new Date().toISOString(),
  }

  if (field === "agent_status") {
    const v = String(body.value || "")
    patch.agent_status = v === "bad" || v === "dead" ? v : null
  } else if (field === "bad_phone" || field === "bad_email") {
    patch[field] = Boolean(body.value)
  } else {
    const target = String(body.contact || "").trim()
    if (!target) return NextResponse.json({ error: "contact is required for per-contact flags" }, { status: 400 })
    const isPhone = field === "bad_phone_value"
    const list: string[] = ((isPhone ? patch.bad_phones : patch.bad_emails) as string[]) ?? []
    const same = (a: string, b: string) =>
      isPhone ? phoneKey(a) === phoneKey(b) : a.trim().toLowerCase() === b.trim().toLowerCase()
    const already = list.some((c) => same(c, target))
    const wantBad = body.value === undefined ? !already : Boolean(body.value)
    const next = wantBad ? (already ? list : [...list, target]) : list.filter((c) => !same(c, target))
    if (isPhone) patch.bad_phones = next
    else patch.bad_emails = next
  }

  const { error } = await supabaseAdmin
    .from("lead_agent_flags")
    .upsert(patch, { onConflict: "lead_id,operator_pin_id" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
