import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from("user_pins")
    .select("id, email, package_type, is_active, role, created_at")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }

  // Cross-reference users table to get account_type (set by admin in User Data page)
  const { data: usersData } = await supabaseAdmin
    .from("users")
    .select("email, account_type")

  const accountTypeMap = new Map(
    (usersData || []).map((u) => [u.email?.toLowerCase(), u.account_type])
  )

  const enriched = (data || []).map((pin) => ({
    ...pin,
    account_type: accountTypeMap.get(pin.email?.toLowerCase()) || pin.package_type || "basic",
  }))

  return NextResponse.json({ users: enriched })
}
