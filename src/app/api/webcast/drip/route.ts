import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEmailTemplate, SMS_TEMPLATES } from '@/lib/webcast/email-templates'
import { getSessionLabel } from '@/lib/webcast/session-manager'
// Drip email sends via Resend (verified domain, reliable) — replaces the ARB relay
// SMTP shim, which was throwing and stranding due rows as 'pending'. api.resend.com
// is behind Cloudflare, so a browser User-Agent is required (else error 1010).
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn'
const RESEND_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY || ''
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || ''

async function processEmailDrip() {
  const now = new Date().toISOString()
  const { data: pending } = await supabaseAdmin
    .from('webcast_email_drip_queue')
    .select('*, webcast_leads(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(20)

  if (!pending || pending.length === 0) return { emailsSent: 0 }

  if (!RESEND_API_KEY) return { emailsSent: 0, error: 'Resend not configured' }

  let sent = 0
  for (const item of pending) {
    const lead = item.webcast_leads
    if (!lead || lead.unsubscribed) {
      await supabaseAdmin
        .from('webcast_email_drip_queue')
        .update({ status: 'skipped' })
        .eq('id', item.id)
      continue
    }

    // Atomically CLAIM before sending so overlapping runs can't double-send this step.
    const { data: claimedEmail } = await supabaseAdmin
      .from('webcast_email_drip_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', item.id)
      .eq('status', 'pending')
      .select('id')
    if (!claimedEmail || claimedEmail.length === 0) continue

    try {
      const template = getEmailTemplate(item.step_number, {
        first_name: lead.first_name || 'there',
        email: lead.email,
        session_time: lead.assigned_session_time
          ? getSessionLabel(new Date(lead.assigned_session_time))
          : 'upcoming',
        countdown_minutes: 0,
      })

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': RESEND_UA,
        },
        body: JSON.stringify({
          from: 'Corey | Foreclosure Recovery Inc. <support@usforeclosureleads.com>',
          to: [lead.email],
          subject: template.subject,
          html: template.html,
        }),
      })
      if (!resendRes.ok) throw new Error(`Resend ${resendRes.status}: ${(await resendRes.text()).slice(0, 140)}`)

      // Row already claimed as 'sent' above — just advance the lead's step marker.
      await supabaseAdmin
        .from('webcast_leads')
        .update({ email_drip_step: item.step_number })
        .eq('id', lead.id)

      sent++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await supabaseAdmin
        .from('webcast_email_drip_queue')
        .update({ status: 'failed', error_message: errMsg })
        .eq('id', item.id)
    }
  }

  return { emailsSent: sent }
}

async function processSmsDrip() {
  const now = new Date().toISOString()
  const { data: pending } = await supabaseAdmin
    .from('webcast_sms_queue')
    .select('*, webcast_leads(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: false }) // newest drip steps first so re-enabling doesn't blast stale backlog
    .limit(40)

  if (!pending || pending.length === 0) return { smsSent: 0 }

  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) return { smsSent: 0, error: 'TextBee not configured' }

  let sent = 0
  for (const item of pending) {
    const lead = item.webcast_leads
    if (!lead || lead.unsubscribed || !lead.sms_consent) {
      await supabaseAdmin
        .from('webcast_sms_queue')
        .update({ status: 'skipped' })
        .eq('id', item.id)
      continue
    }

    // Atomically CLAIM this row before sending. The conditional eq('status','pending')
    // means only ONE run can flip it; an overlapping run gets 0 rows back and skips.
    // This is the fix for the double/triple SMS seen when drain runs overlap.
    const { data: claimedSms } = await supabaseAdmin
      .from('webcast_sms_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', item.id)
      .eq('status', 'pending')
      .select('id')
    if (!claimedSms || claimedSms.length === 0) continue

    try {
      const message = item.message || SMS_TEMPLATES[item.step_number] || ''
      const personalizedMessage = message
        .replace('{first_name}', lead.first_name || 'there')
        .replace('{session_time}', lead.assigned_session_time
          ? getSessionLabel(new Date(lead.assigned_session_time))
          : 'soon')

      await fetch(
        `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
        {
          method: 'POST',
          headers: {
            'x-api-key': TEXTBEE_API_KEY,
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          },
          body: JSON.stringify({
            recipients: [item.phone],
            message: personalizedMessage,
          }),
        }
      )

      // Row already claimed as 'sent' above — just advance the lead's step marker.
      await supabaseAdmin
        .from('webcast_leads')
        .update({ sms_drip_step: item.step_number })
        .eq('id', lead.id)

      sent++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await supabaseAdmin
        .from('webcast_sms_queue')
        .update({ status: 'failed', error_message: errMsg })
        .eq('id', item.id)
    }
  }

  return { smsSent: sent }
}

// GET: Cron-triggered drip processor (call every 5 minutes)
export async function GET() {
  try {
    // SMS drip RE-ENABLED 2026-07-06 (TextBee stable). Throttled to 40/run via the
    // batch limit so re-enabling does not blast the ~2,400-message backlog at once.
    const emailResult = await processEmailDrip()
    const smsResult = await processSmsDrip()

    return NextResponse.json({
      success: true,
      ...emailResult,
      ...smsResult,
      processedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
