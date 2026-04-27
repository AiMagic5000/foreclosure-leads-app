import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEmailTemplate, SMS_TEMPLATES } from '@/lib/webcast/email-templates'
import { getSessionLabel } from '@/lib/webcast/session-manager'
import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || ''
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

  if (!SMTP_PASS) return { emailsSent: 0, error: 'SMTP not configured' }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

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

    try {
      const template = getEmailTemplate(item.step_number, {
        first_name: lead.first_name || 'there',
        email: lead.email,
        session_time: lead.assigned_session_time
          ? getSessionLabel(new Date(lead.assigned_session_time))
          : 'upcoming',
        countdown_minutes: 0,
      })

      await transport.sendMail({
        from: `"Corey | Foreclosure Recovery Inc." <${SMTP_USER}>`,
        to: lead.email,
        subject: template.subject,
        html: template.html,
      })

      await supabaseAdmin
        .from('webcast_email_drip_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', item.id)

      await supabaseAdmin
        .from('webcast_leads')
        .update({ email_drip_step: item.step_number })
        .eq('id', lead.id)

      sent++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await supabaseAdmin
        .from('webcast_email_drip_queue')
        .update({ status: 'failed', error: errMsg })
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
    .limit(20)

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
          },
          body: JSON.stringify({
            recipients: [item.phone],
            message: personalizedMessage,
          }),
        }
      )

      await supabaseAdmin
        .from('webcast_sms_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', item.id)

      await supabaseAdmin
        .from('webcast_leads')
        .update({ sms_drip_step: item.step_number })
        .eq('id', lead.id)

      sent++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await supabaseAdmin
        .from('webcast_sms_queue')
        .update({ status: 'failed', error: errMsg })
        .eq('id', item.id)
    }
  }

  return { smsSent: sent }
}

// GET: Cron-triggered drip processor (call every 5 minutes)
export async function GET() {
  try {
    const [emailResult, smsResult] = await Promise.all([
      processEmailDrip(),
      processSmsDrip(),
    ])

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
