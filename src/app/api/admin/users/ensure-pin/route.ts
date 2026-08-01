import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"
import crypto from "crypto"
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

export const dynamic = "force-dynamic"

// Ensure an active user_pins row exists for a given user email so an admin can
// "View as" any account — even Basic signups that never had a PIN provisioned.
export async function POST(req: NextRequest) {
  const user = await currentUser()
  const adminEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  if (!adminEmail || adminEmail !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const body = await req.json()
  // Fold a merged 2nd login onto the primary account email so "View as" lands on
  // the account's real pin (with the leads) instead of trying to insert a new pin
  // — which would collide with the deactivated duplicate's unique email.
  const email = canonicalEmail(body?.email)
  const accountType = String(body?.accountType || "basic")
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })

  // Already have a pin? Return it.
  const { data: existing } = await supabaseAdmin
    .from("user_pins")
    .select("id")
    .ilike("email", email)
    .eq("is_active", true)
    .maybeSingle()
  if (existing?.id) return NextResponse.json({ pinId: existing.id })

  const hashedPin = await bcrypt.hash(crypto.randomBytes(4).toString("hex").toUpperCase(), 10)
  const role = accountType === "owner_operator" || accountType === "admin" ? "owner_operator" : "standard"

  const { data: row, error } = await supabaseAdmin
    .from("user_pins")
    .insert({
      email,
      pin: hashedPin,
      states_access: [],
      package_type: accountType,
      is_active: true,
      role,
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pinId: row.id })
}
