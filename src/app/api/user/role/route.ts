import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRIMARY_ADMIN_EMAIL, resolveImpersonationTarget } from '@/lib/admin-guard'
import { canonicalEmail } from '@/lib/email-alias'

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

// Packages allowed to send voice drops. Every drop is delivered through the
// COMPANY SlyBroadcast account (the only one with API access) using the agent's
// own voice + caller ID — so the button no longer depends on the agent saving
// personal SlyBroadcast creds. Any voicedrop-eligible package gets a live button.
// Must match isCommsAuthorized() in operator-config.ts — otherwise an agent could
// see a live button that 403s on send.
const VOICEDROP_PACKAGES = new Set([
  'partnership',
  'junior_owner_operator',
  'owner_operator',
  'admin',
])

// Outreach-button availability. Voice-drop is company-routed, so it's enabled for
// any voicedrop-eligible package. SMS (TextBee) still needs the agent's own device
// creds, so it stays gated on those.
async function credFlags(
  pinId: string | null,
  packageType?: string | null
): Promise<{ hasSlybroadcast: boolean; hasTextbee: boolean }> {
  // Voicedrop is live if the package is eligible (company-routed delivery) OR the
  // pin has SlyBroadcast creds saved. Either path turns the button green.
  const pkgEligible = VOICEDROP_PACKAGES.has((packageType || '').toLowerCase())
  if (!pinId) return { hasSlybroadcast: pkgEligible, hasTextbee: false }
  const { data } = await supabaseAdmin
    .from('user_pins')
    .select('slybroadcast_email, slybroadcast_password, textbee_api_key, textbee_device_id')
    .eq('id', pinId)
    .maybeSingle()
  const p = (data || {}) as Record<string, string | null>
  return {
    hasSlybroadcast: pkgEligible || !!(p.slybroadcast_email && p.slybroadcast_password),
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

  // Fold known account-merge aliases so a user's 2nd login resolves to their
  // canonical pin/users row (leads, tier, notes persist across both logins).
  //
  // Clerk does NOT guarantee emailAddresses[0] is the primary. When an agent has a
  // second address on their account (e.g. their company mailbox added so they can
  // sign in with either), [0] can be the address that has NO user_pins row. That
  // returns pinId=null, which leaves isVerified false in pin-context — so every
  // phone number and email on their leads stays hidden behind a PIN prompt they
  // cannot find. Resolve against ALL their addresses and use the one that owns a pin.
  const candidateEmails = Array.from(
    new Set(
      [
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress,
        ...user.emailAddresses.map((e) => e.emailAddress),
      ]
        .filter(Boolean)
        .map((e) => canonicalEmail(String(e)))
        .filter(Boolean)
    )
  )
  if (candidateEmails.length === 0) {
    return NextResponse.json({ isAdmin: false, isPrimaryAdmin: false })
  }
  // Prefer an address that actually has an active pin; fall back to the primary.
  let email = candidateEmails[0]
  if (candidateEmails.length > 1) {
    for (const cand of candidateEmails) {
      const { data: probe } = await supabaseAdmin
        .from('user_pins').select('id').ilike('email', cand).eq('is_active', true).limit(1)
      if (probe && probe.length > 0) { email = cand; break }
    }
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
    const tFlags = await credFlags(target.pinId, effectiveAccountType)
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
  const selfFlags = await credFlags(pinId, isAdmin ? 'admin' : accountType)

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
