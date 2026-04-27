import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_EMAILS = ['coreypearsonemail@gmail.com']

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      { count: totalRegistrants },
      { count: totalAttended },
      { count: totalPartnerApps },
      { count: totalProvisioned },
      { count: pendingEmails },
      { count: pendingSms },
      { count: voiceDropsSent },
      { data: recentLeads },
      { data: recentPartnerApps },
      { data: dripStats },
    ] = await Promise.all([
      supabaseAdmin.from('webcast_leads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('webcast_leads').select('*', { count: 'exact', head: true }).eq('status', 'attended'),
      supabaseAdmin.from('webcast_partnership_applications').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('webcast_leads').select('*', { count: 'exact', head: true }).eq('leads_account_provisioned', true),
      supabaseAdmin.from('webcast_email_drip_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('webcast_sms_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('webcast_leads').select('*', { count: 'exact', head: true }).eq('voice_drop_sent', true),
      supabaseAdmin
        .from('webcast_leads')
        .select('id, first_name, last_name, email, phone, status, created_at, leads_account_provisioned, voice_drop_sent, email_drip_step, sms_drip_step, sms_consent, assigned_session_time')
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('webcast_partnership_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('webcast_email_drip_queue')
        .select('status')
        .then(({ data }) => {
          const stats = { pending: 0, sent: 0, failed: 0, skipped: 0 }
          if (data) {
            for (const row of data) {
              const s = row.status as keyof typeof stats
              if (s in stats) stats[s]++
            }
          }
          return { data: stats }
        }),
    ])

    return NextResponse.json({
      stats: {
        totalRegistrants: totalRegistrants || 0,
        totalAttended: totalAttended || 0,
        totalPartnerApps: totalPartnerApps || 0,
        totalProvisioned: totalProvisioned || 0,
        pendingEmails: pendingEmails || 0,
        pendingSms: pendingSms || 0,
        voiceDropsSent: voiceDropsSent || 0,
        attendanceRate: totalRegistrants ? Math.round(((totalAttended || 0) / totalRegistrants) * 100) : 0,
      },
      dripStats,
      recentLeads: recentLeads || [],
      recentPartnerApps: recentPartnerApps || [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
