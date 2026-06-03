import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

// Resolve the target email — the caller's own, or (admin only) an impersonated user's.
async function targetEmail(req: NextRequest, asPinIdFromBody?: string | null): Promise<{ email: string | null; error?: string }> {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return { email: null, error: "Unauthorized" }
  const asPinId = asPinIdFromBody ?? req.nextUrl.searchParams.get("asPinId")
  if (asPinId) {
    const target = await resolveImpersonationTarget(asPinId)
    if (!target) return { email: null, error: "Not authorized" }
    return { email: target.email }
  }
  return { email }
}

function digits(s: string) {
  return (s || "").replace(/[^\d]/g, "")
}

// GET — does this account have a phone on file? Returns the masked phone + consent.
export async function GET(req: NextRequest) {
  const { email, error } = await targetEmail(req)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  const { data } = await supabaseAdmin
    .from("users")
    .select("profile_phone, sms_consent")
    .ilike("email", email as string)
    .single()
  const phone = data?.profile_phone || ""
  return NextResponse.json({
    hasPhone: !!phone,
    phone,
    smsConsent: !!data?.sms_consent,
  })
}

// POST — save the account's phone number + SMS consent.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, error } = await targetEmail(req, body?.asPinId || null)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })

  const phone = String(body?.phone || "").trim()
  const consent = body?.consent === true
  const d = digits(phone)
  if (d.length < 10) return NextResponse.json({ error: "Enter a valid phone number (at least 10 digits)." }, { status: 400 })
  if (!consent) return NextResponse.json({ error: "Please agree to the communications consent to continue." }, { status: 400 })

  const { error: upErr } = await supabaseAdmin
    .from("users")
    .update({ profile_phone: phone, sms_consent: true, sms_consent_at: new Date().toISOString() })
    .ilike("email", email as string)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ success: true, hasPhone: true, phone })
}
