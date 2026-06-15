import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRIMARY_ADMIN_EMAIL, resolveImpersonationTarget } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

// A phone/number/country ban must NEVER lock out an account that has no phone on
// file — no number = full access, by rule. Only an account that actually saved a
// phone (with a disallowed country) can be suspended for a bad number. Non-phone
// bans (fraud, abuse, "Banned by admin") always apply.
function effectiveBan(row: { banned?: boolean | null; ban_reason?: string | null; profile_phone?: string | null } | null | undefined): { banned: boolean; banReason: string | null } {
  if (!row?.banned) return { banned: false, banReason: null }
  const reason = row.ban_reason || null
  const isPhoneReason = !!reason && /phone|number|country|calling code/i.test(reason)
  const hasPhoneOnFile = !!(row.profile_phone && String(row.profile_phone).trim())
  if (isPhoneReason && !hasPhoneOnFile) return { banned: false, banReason: null }
  return { banned: true, banReason: reason }
}

// Whether an operator pin has the outreach credentials saved. Voice-drop needs
// SlyBroadcast; SMS needs TextBee. Buttons stay inactive until these are true.
async function credFlags(pinId: string | null): Promise<{ hasSlybroadcast: boolean; hasTextbee: boolean }> {
  if (!pinId) return { hasSlybroadcast: false, hasTextbee: false }
  const { data } = await supabaseAdmin
    .from('user_pins')
    .select('slybroadcast_email, slybroadcast_password, textbee_api_key, textbee_device_id')
    .eq('id', pinId)
    .maybeSingle()
  const p = (data || {}) as Record<string, string | null>
  return {
    hasSlybroadcast: !!(p.slybroadcast_email && p.slybroadcast_password),
    hasTextbee: !!(p.textbee_api_key && p.textbee_device_id),
  }
}

// The Clerk dev->prod migration left duplicate rows per email (a paid one and a
// downgraded free one). A login must ALWAYS resolve to the highest-access row,
// never an arbitrary/duplicate one — otherwise paid users get locked out.
const TIER_RANK: Record<string, number> = { owner_operator: 0, multi_state: 1, partnership: 2, free: 9 }
const ACCT_RANK: Record<string, number> = { admin: 0, owner_operator: 1, junior_owner_operator: 2, partnership: 3, basic: 9 }
const PKG_RANK: Record<string, number> = { owner_operator: 0, junior_owner_operator: 1, multi_state: 1, partnership: 2 }

function pickBestUser<T extends { subscription_tier?: string | null; account_type?: string | null }>(rows: T[]): T | null {
  return [...rows].sort((a, b) =>
    (TIER_RANK[a?.subscription_tier ?? ''] ?? 5) - (TIER_RANK[b?.subscription_tier ?? ''] ?? 5) ||
    (ACCT_RANK[a?.account_type ?? ''] ?? 5) - (ACCT_RANK[b?.account_type ?? ''] ?? 5)
  )[0] || null
}

function pickBestPin<T extends { package_type?: string | null; slybroadcast_email?: string | null; textbee_api_key?: string | null }>(rows: T[]): T | null {
  return [...rows].sort((a, b) => {
    const ca = (a?.slybroadcast_email ? 1 : 0) + (a?.textbee_api_key ? 1 : 0)
    const cb = (b?.slybroadcast_email ? 1 : 0) + (b?.textbee_api_key ? 1 : 0)
    if (cb !== ca) return cb - ca
    return (PKG_RANK[a?.package_type ?? ''] ?? 5) - (PKG_RANK[b?.package_type ?? ''] ?? 5)
  })[0] || null
}

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
      .select('role, subscription_tier, account_type, training_unlocked, phone_verified, profile_phone, banned, ban_reason')
      .ilike('email', target.email)
      .limit(1)
      .maybeSingle()
    // users.account_type is the source of truth (what the admin sets + what the User Data
    // table shows). The pin's package_type can be stale, so prefer the users row.
    const effectiveAccountType = tUser?.account_type || target.packageType || 'basic'
    const effectiveIsAdmin = effectiveAccountType === 'admin' || tUser?.role === 1
    const tFlags = await credFlags(target.pinId)
    return NextResponse.json({
      ...tFlags,
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
      hasPhone: !!tUser?.phone_verified,
      ...effectiveBan(tUser),
    })
  }

  // Normal (self) resolution. Fetch ALL rows for the email (duplicates exist) and
  // pick the best — never .single() (throws on dupes) or limit(1) (arbitrary).
  const [{ data: userRows }, { data: pinRows }] = await Promise.all([
    supabaseAdmin.from('users').select('role, subscription_tier, account_type, training_unlocked, phone_verified, profile_phone, banned, ban_reason').ilike('email', email),
    supabaseAdmin.from('user_pins').select('id, package_type, states_access, is_active, role, slybroadcast_email, textbee_api_key').ilike('email', email).eq('is_active', true),
  ])
  const data = pickBestUser(userRows || [])
  const pinData = pickBestPin(pinRows || [])

  const isAdmin = realIsAdmin
  const subscriptionTier = data?.subscription_tier || 'free'
  const accountType = pinData?.package_type || data?.account_type || 'basic'
  const pinId = pinData?.id || null
  const statesAccess = pinData?.states_access || []
  // training unlocked if ANY duplicate row has it
  const trainingUnlocked = (userRows || []).some((r) => r?.training_unlocked)
  const selfFlags = await credFlags(pinId)

  return NextResponse.json({
    ...selfFlags,
    isAdmin,
    isPrimaryAdmin: realIsPrimaryAdmin,
    isRealAdmin: realIsAdmin,
    impersonating: null,
    email,
    subscriptionTier,
    accountType,
    pinId,
    statesAccess,
    trainingUnlocked,
    hasPhone: !!data?.phone_verified,
    ...effectiveBan(data),
  })
}
