import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

export const PRIMARY_ADMIN_EMAIL = "coreypearsonemail@gmail.com"

/**
 * True when the CURRENTLY LOGGED-IN user is an admin. The single source of truth for
 * honoring an impersonation override — never trust a client-supplied "I'm admin" flag.
 */
export async function isRequestAdmin(): Promise<boolean> {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  if (!email) return false
  if (email === PRIMARY_ADMIN_EMAIL) return true
  const [{ data: u }, { data: pin }] = await Promise.all([
    supabaseAdmin.from("users").select("role").ilike("email", email).single(),
    supabaseAdmin.from("user_pins").select("role").ilike("email", email).eq("is_active", true).single(),
  ])
  return u?.role === 1 || pin?.role === "admin"
}

export interface ImpersonationTarget {
  pinId: string
  email: string
  name: string
  packageType: string
  statesAccess: string[]
}

/**
 * Resolve an admin-requested impersonation target by pin id. Returns null unless the
 * caller is an admin AND the pin exists. Every route that accepts `asPinId` MUST gate on this.
 */
export async function resolveImpersonationTarget(asPinId: string | null): Promise<ImpersonationTarget | null> {
  if (!asPinId) return null
  if (!(await isRequestAdmin())) return null
  const { data: pin } = await supabaseAdmin
    .from("user_pins")
    .select("id, email, package_type, states_access")
    .eq("id", asPinId)
    .single()
  if (!pin) return null
  const { data: u } = await supabaseAdmin
    .from("users")
    .select("full_name, fullname")
    .ilike("email", pin.email)
    .single()
  return {
    pinId: pin.id,
    email: pin.email,
    name: u?.full_name || u?.fullname || pin.email,
    packageType: pin.package_type || "basic",
    statesAccess: pin.states_access || [],
  }
}
