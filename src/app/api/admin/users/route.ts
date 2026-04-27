import { NextRequest, NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

const PRIMARY_ADMIN_EMAIL = 'coreypearsonemail@gmail.com'

export async function GET() {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = user.emailAddresses[0]?.emailAddress
  if (email !== PRIMARY_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Only the primary admin can manage users' }, { status: 403 })
  }

  // Pull all users from Clerk as the source of truth
  const client = await clerkClient()
  let clerkUsers: Array<{
    id: string
    emailAddresses: Array<{ emailAddress: string }>
    firstName: string | null
    lastName: string | null
    createdAt: number
    lastSignInAt: number | null
    imageUrl: string | null
    phoneNumbers: Array<{ phoneNumber: string }>
  }> = []

  try {
    const response = await client.users.getUserList({ limit: 500, orderBy: '-created_at' })
    clerkUsers = response.data as typeof clerkUsers
  } catch (err) {
    console.error('Failed to fetch Clerk users:', err)
  }

  // Get existing DB records
  const { data: dbUsers } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id, email, full_name, fullname, role, subscription_tier, subscription_status, account_type, selected_states, automation_enabled, created_at, updated_at')
    .order('created_at', { ascending: false })

  const dbMap = new Map((dbUsers || []).map((u) => [u.clerk_id, u]))

  // Auto-sync: insert any Clerk users not in DB
  const missingUsers = clerkUsers.filter((cu) => !dbMap.has(cu.id))
  if (missingUsers.length > 0) {
    const inserts = missingUsers.map((cu) => {
      const primaryEmail = cu.emailAddresses[0]?.emailAddress || 'unknown'
      const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(' ') || null
      return {
        clerk_id: cu.id,
        email: primaryEmail,
        full_name: fullName,
        subscription_tier: 'free',
        subscription_status: 'active',
        account_type: 'basic',
      }
    })

    const { data: inserted } = await supabaseAdmin
      .from('users')
      .upsert(inserts, { onConflict: 'clerk_id' })
      .select('id, clerk_id, email, full_name, fullname, role, subscription_tier, subscription_status, account_type, selected_states, automation_enabled, created_at, updated_at')

    if (inserted) {
      for (const row of inserted) {
        dbMap.set(row.clerk_id, row)
      }
    }
  }

  // Merge: Clerk data + DB data
  const mergedUsers = clerkUsers.map((cu) => {
    const db = dbMap.get(cu.id)
    const primaryEmail = cu.emailAddresses[0]?.emailAddress || 'unknown'
    const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(' ') || null

    return {
      id: db?.id || cu.id,
      clerk_id: cu.id,
      email: primaryEmail,
      full_name: fullName || db?.full_name || db?.fullname || null,
      role: db?.role || 0,
      subscription_tier: db?.subscription_tier || 'free',
      subscription_status: db?.subscription_status || 'active',
      account_type: db?.account_type || 'basic',
      selected_states: db?.selected_states || [],
      automation_enabled: db?.automation_enabled || false,
      created_at: new Date(cu.createdAt).toISOString(),
      updated_at: db?.updated_at || null,
      last_sign_in: cu.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
      phone: cu.phoneNumbers?.[0]?.phoneNumber || null,
      image_url: cu.imageUrl || null,
    }
  })

  // Also include any DB-only users (e.g., manually created) not in Clerk
  const clerkIds = new Set(clerkUsers.map((cu) => cu.id))
  const dbOnlyUsers = (dbUsers || [])
    .filter((u) => !clerkIds.has(u.clerk_id))
    .map((u) => ({
      ...u,
      account_type: u.account_type || 'basic',
      last_sign_in: null,
      phone: null,
      image_url: null,
    }))

  return NextResponse.json({ users: [...mergedUsers, ...dbOnlyUsers] })
}

export async function PATCH(req: NextRequest) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = user.emailAddresses[0]?.emailAddress
  if (email !== PRIMARY_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Only the primary admin can manage roles' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, role, accountType, subscriptionTier } = body

  const updateData: Record<string, unknown> = {}

  // Support legacy role field (0=user, 1=admin)
  if (typeof role === 'number' && (role === 0 || role === 1)) {
    updateData.role = role
  }

  // Support new account_type field
  if (accountType && ['basic', 'partnership', 'owner_operator', 'admin'].includes(accountType)) {
    updateData.account_type = accountType
  }

  // Support subscription_tier field
  if (subscriptionTier && ['free', 'single_state', 'multi_state', 'owner_operator'].includes(subscriptionTier)) {
    updateData.subscription_tier = subscriptionTier
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updateData.updated_at = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
