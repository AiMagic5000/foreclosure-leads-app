import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

const PRIMARY_ADMIN_EMAIL = 'coreypearsonemail@gmail.com'

// fresh_unassigned_leads = deliverable_leads (trusted source + overage $5k-$5M +
// servable + DNC-clean) minus anything already in operator_lead_assignments.
const LEAD_COLUMNS =
  'id,owner_name,property_address,mailing_address,city,state,state_abbr,zip_code,county,surplus_county,' +
  'parcel_id,apn_number,overage_amount,sale_amount,mortgage_amount,sale_date,lender_name,foreclosure_type,' +
  'primary_phone,secondary_phone,primary_email,source,source_url,skip_trace_source,skip_traced_at,scraped_at,' +
  'dnc_checked,on_dnc,can_contact,dnc_type,deed_verified,deed_data_source,lead_tier,case_number'

async function requireAdmin() {
  const user = await currentUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const email = user.emailAddresses[0]?.emailAddress
  if (email !== PRIMARY_ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) }
  }
  return { email }
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { searchParams } = new URL(req.url)

  // Agent search over active operator pins (the assignment target).
  if (searchParams.has('agents')) {
    const qstr = (searchParams.get('agents') || '').toLowerCase().trim()
    const { data, error } = await supabaseAdmin
      .from('user_pins')
      .select('id, full_name, display_name, email, package_type')
      .eq('is_active', true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const TIER_LABEL: Record<string, string> = {
      basic: 'Free', free: 'Free', free_webcast: 'Free', partnership: 'Partnership',
      junior_owner_operator: 'Jr Owner Operator', owner_operator: 'Owner Operator', admin: 'Admin',
    }
    const agents = (data || [])
      .map((p) => {
        const pin = p as { id: string; full_name?: string; display_name?: string; email?: string; package_type?: string }
        const tierRaw = pin.package_type || 'basic'
        return {
          pinId: pin.id,
          name: pin.display_name || pin.full_name || pin.email || '(unnamed)',
          email: pin.email || '',
          tier: TIER_LABEL[tierRaw] || tierRaw,
        }
      })
      // No query -> return the WHOLE list (so the dropdown loads everyone); with a
      // query, filter by name/email. Admin is the human-in-the-loop verifier.
      .filter((a) => !qstr || a.name.toLowerCase().includes(qstr) || a.email.toLowerCase().includes(qstr))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 500)
    return NextResponse.json({ agents })
  }

  // Pending agent lead-requests queue.
  if (searchParams.has('requests')) {
    const { data, error } = await supabaseAdmin
      .from('lead_requests')
      .select('id, user_email, user_name, account_type, requested_count, state_preference, operator_pin_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ requests: data || [] })
  }

  // States list for the filter chips.
  if (searchParams.has('states')) {
    const { data, error } = await supabaseAdmin.from('fresh_unassigned_leads').select('state_abbr')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const counts: Record<string, number> = {}
    for (const r of data || []) {
      const s = (r as { state_abbr: string | null }).state_abbr || '—'
      counts[s] = (counts[s] || 0) + 1
    }
    const states = Object.entries(counts).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count)
    return NextResponse.json({ states })
  }

  const state = searchParams.get('state')
  const limit = Math.min(Number(searchParams.get('limit')) || 200, 6000)
  let query = supabaseAdmin
    .from('fresh_unassigned_leads')
    .select(LEAD_COLUMNS)
    .order('overage_amount', { ascending: false })
    .limit(limit)
  if (state && state !== 'ALL') query = query.eq('state_abbr', state)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data || [], count: (data || []).length })
}

// POST body: { leadIds: string[], pinId: string, agentName?: string }
// Issues leads to an operator. Exclusivity is enforced by the UNIQUE(lead_id)
// constraint on operator_lead_assignments — already-assigned leads are skipped.
export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  let body: { leadIds?: string[]; pinId?: string; agentName?: string; requestId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { leadIds, pinId, agentName, requestId } = body
  if (!Array.isArray(leadIds) || leadIds.length === 0 || !pinId) {
    return NextResponse.json({ error: 'leadIds[] and pinId are required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const rows = leadIds.map((id) => ({
    lead_id: id,
    operator_pin_id: pinId,
    assigned_by: gate.email,
    assigned_at: now,
    status: 'active',
  }))

  // ignoreDuplicates => existing lead_id rows (assigned to anyone) are left
  // untouched; only genuinely-unassigned leads are claimed.
  const { data, error } = await supabaseAdmin
    .from('operator_lead_assignments')
    .upsert(rows, { onConflict: 'lead_id', ignoreDuplicates: true })
    .select('lead_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const claimed = (data || []).map((r) => (r as { lead_id: string }).lead_id)
  // Stamp display fields on the claimed leads (for the leads page).
  if (claimed.length > 0) {
    await supabaseAdmin
      .from('foreclosure_leads')
      .update({ assigned_agent: agentName || null, assigned_date: now, last_updated: now })
      .in('id', claimed)
  }

  // If fulfilling a specific agent request, advance/close it.
  if (requestId && claimed.length > 0) {
    const { data: reqRow } = await supabaseAdmin
      .from('lead_requests')
      .select('requested_count, fulfilled_count')
      .eq('id', requestId)
      .maybeSingle()
    const prev = (reqRow as { requested_count?: number; fulfilled_count?: number } | null) || {}
    const newFulfilled = (prev.fulfilled_count || 0) + claimed.length
    await supabaseAdmin
      .from('lead_requests')
      .update({
        fulfilled_count: newFulfilled,
        status: newFulfilled >= (prev.requested_count || 0) ? 'fulfilled' : 'pending',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', requestId)
  }

  return NextResponse.json({
    issued: claimed.length,
    skipped: leadIds.length - claimed.length,
  })
}
