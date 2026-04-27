import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

const PRIMARY_ADMIN_EMAIL = 'coreypearsonemail@gmail.com'

export async function GET() {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ isAdmin: false, isPrimaryAdmin: false }, { status: 401 })
  }

  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  if (!email) {
    return NextResponse.json({ isAdmin: false, isPrimaryAdmin: false })
  }

  const isPrimaryAdmin = email === PRIMARY_ADMIN_EMAIL

  const [{ data }, { data: pinData }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('role, subscription_tier, account_type')
      .ilike('email', email)
      .single(),
    supabaseAdmin
      .from('user_pins')
      .select('id, package_type, states_access, is_active, role')
      .ilike('email', email)
      .eq('is_active', true)
      .single(),
  ])

  const isAdmin = isPrimaryAdmin || (data?.role === 1) || (pinData?.role === 'admin')
  const subscriptionTier = data?.subscription_tier || 'free'
  // Prefer user_pins.package_type over users.account_type
  const accountType = pinData?.package_type || data?.account_type || 'basic'
  const pinId = pinData?.id || null
  const statesAccess = pinData?.states_access || []

  return NextResponse.json({ isAdmin, isPrimaryAdmin, email, subscriptionTier, accountType, pinId, statesAccess })
}
