import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const PRIMARY_ADMIN_EMAIL = "coreypearsonemail@gmail.com"

// Referral program: $100 when a referred person signs up, $500 when their
// signed claim is paid out. Each operator has a code derived from their pin id.
function codeFor(pinId: string): string {
  return "REF-" + pinId.replace(/-/g, "").slice(0, 8).toUpperCase()
}

// Resolves the EFFECTIVE operator. A real admin may pass ?asPinId / {asPinId} to
// view a specific operator (impersonation); everyone else is locked to their own
// pin, so no user can ever see another user's referrals.
async function resolvePin(asPinId?: string | null): Promise<{ pinId: string; email: string } | null> {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  if (!email) return null
  if (asPinId && email === PRIMARY_ADMIN_EMAIL) {
    const { data } = await supabaseAdmin
      .from("user_pins")
      .select("id, email")
      .eq("id", asPinId)
      .maybeSingle()
    const p = data as { id?: string; email?: string } | null
    if (p?.id) return { pinId: p.id, email: (p.email || "").toLowerCase() }
    return null
  }
  const { data } = await supabaseAdmin
    .from("user_pins")
    .select("id")
    .ilike("email", email)
    .eq("is_active", true)
    .maybeSingle()
  const id = (data as { id?: string } | null)?.id
  if (!id) return null
  return { pinId: id, email }
}

export async function GET(req: NextRequest) {
  const op = await resolvePin(req.nextUrl.searchParams.get("asPinId"))
  if (!op) return NextResponse.json({ error: "No operator account" }, { status: 403 })
  const code = codeFor(op.pinId)
  const { data, error } = await supabaseAdmin
    .from("referrals")
    .select("id, referred_name, referred_email, status, bonus_signup, bonus_paid, created_at")
    .eq("referrer_pin_id", op.pinId)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = data || []
  const earned = rows.reduce((s, r) => {
    const x = r as { status: string; bonus_signup: number; bonus_paid: number }
    if (x.status === "signed_up") return s + Number(x.bonus_signup || 0)
    if (x.status === "paid") return s + Number(x.bonus_signup || 0) + Number(x.bonus_paid || 0)
    return s
  }, 0)
  return NextResponse.json({ referralCode: code, referrals: rows, totalEarned: earned })
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; asPinId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  const op = await resolvePin(body.asPinId)
  if (!op) return NextResponse.json({ error: "No operator account" }, { status: 403 })
  const name = (body.name || "").trim()
  const email = (body.email || "").trim()
  if (!name && !email) {
    return NextResponse.json({ error: "Enter a name or email" }, { status: 400 })
  }
  const { error } = await supabaseAdmin.from("referrals").insert({
    referrer_pin_id: op.pinId,
    referrer_email: op.email,
    referral_code: codeFor(op.pinId),
    referred_name: name || null,
    referred_email: email || null,
    status: "invited",
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
