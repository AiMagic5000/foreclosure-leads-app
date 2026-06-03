import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRIMARY_ADMIN_EMAIL, resolveImpersonationTarget } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ isAdmin: false, isPrimaryAdmin: false }, { status: 401 })
  }

  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  if (!email) {
    return NextResponse.json({ isAdmin: false, isPrimaryAdmin: false })
  }

  const realIsPrimaryAdmin = email === PRIMARY_ADMIN_EMAIL
  const [{ data: realUser }, { data: realPin }] = await Promise.all([
    supabaseAdmin.from('users').select('role').ilike('email', email).single(),
    supabaseAdmin.from('user_pins').select('role').ilike('email', email).eq('is_active', true).single(),
  ])
  const realIsAdmin = realIsPrimaryAdmin || (realUser?.role === 1) || (realPin?.role === 'admin')

  // Admin impersonation override (?asPinId=). Only honored when the real caller is admin.
  const asPinId = req.nextUrl.searchParams.get('asPinId')
  if (asPinId) {
    const target = await resolveImpersonationTarget(asPinId)
    if (!target) {
      return NextResponse.json({ error: 'Not authorized to impersonate, or pin not found' }, { status: 403 })
    }
    const { data: tUser } = await supabaseAdmin
      .from('users')
      .select('role, subscription_tier, account_type, training_unlocked, profile_phone')
      .ilike('email', target.email)
      .limit(1)
      .maybeSingle()
    // users.account_type is the source of truth (what the admin sets + what the User Data
    // table shows). The pin's package_type can be stale, so prefer the users row.
    const effectiveAccountType = tUser?.account_type || target.packageType || 'basic'
    const effectiveIsAdmin = effectiveAccountType === 'admin' || tUser?.role === 1
    return NextResponse.json({
      isAdmin: effectiveIsAdmin,
      isPrimaryAdmin: false,
      isRealAdmin: true,
      impersonating: { pinId: target.pinId, email: target.email, name: target.name },
      email: target.email,
      subscriptionTier: tUser?.subscription_tier || 'free',
      accountType: effectiveAccountType,
      pinId: target.pinId,
      statesAccess: target.statesAccess,
      trainingUnlocked: !!tUser?.training_unlocked,
      hasPhone: !!tUser?.profile_phone,
    })
  }

  // Normal (self) resolution.
  const [{ data }, { data: pinData }] = await Promise.all([
    supabaseAdmin.from('users').select('role, subscription_tier, account_type, training_unlocked, profile_phone').ilike('email', email).limit(1).maybeSingle(),
    supabaseAdmin.from('user_pins').select('id, package_type, states_access, is_active, role').ilike('email', email).eq('is_active', true).single(),
  ])

  const isAdmin = realIsAdmin
  const subscriptionTier = data?.subscription_tier || 'free'
  const accountType = pinData?.package_type || data?.account_type || 'basic'
  const pinId = pinData?.id || null
  const statesAccess = pinData?.states_access || []

  return NextResponse.json({
    isAdmin,
    isPrimaryAdmin: realIsPrimaryAdmin,
    isRealAdmin: realIsAdmin,
    impersonating: null,
    email,
    subscriptionTier,
    accountType,
    pinId,
    statesAccess,
    trainingUnlocked: !!data?.training_unlocked,
    hasPhone: !!data?.profile_phone,
  })
}
