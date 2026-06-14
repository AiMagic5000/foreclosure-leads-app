import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendAdminNotification } from "@/lib/email"

export const dynamic = "force-dynamic"

// Bump when the consent wording below changes so we can tell which version an
// agent agreed to.
export const CONSENT_VERSION = "check-proof-consent-2026-06-14"

// GET — has this agent consented to marketing use of their uploaded check images?
export async function GET() {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ consented: false }, { status: 401 })

  const { data } = await supabaseAdmin
    .from("user_activity")
    .select("details, created_at")
    .eq("user_id", email)
    .eq("action", "check_proof_consent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const consented = !!data && (data.details as { version?: string } | null)?.version === CONSENT_VERSION
  return NextResponse.json({ consented, at: data?.created_at || null })
}

// POST — record consent to add privacy markers + use check images for marketing.
export async function POST(req: NextRequest) {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body?.agreed !== true) {
    return NextResponse.json({ error: "Consent not granted" }, { status: 400 })
  }

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email
  const at = new Date().toISOString()

  const { error } = await supabaseAdmin.from("user_activity").insert({
    user_id: email,
    action: "check_proof_consent",
    details: {
      version: CONSENT_VERSION,
      name,
      agreed: true,
      scope: ["add_privacy_markers", "social_media", "marketing"],
      at,
    },
  })
  if (error) return NextResponse.json({ error: "Could not record consent" }, { status: 500 })

  // Best-effort: notify the team an agent opted in so we can pull + mark the images.
  try {
    await sendAdminNotification(
      "Check-proof marketing consent granted",
      `${name} (${email}) consented to privacy-marking + social/marketing use of their uploaded payout check images on ${at}.`
    )
  } catch {
    // never block the response on email delivery
  }

  return NextResponse.json({ consented: true, at })
}
