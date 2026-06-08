import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getNextSessionTime, getSessionLabel, getSecondsUntilSession } from '@/lib/webcast/session-manager'
import { getEmailTemplate } from '@/lib/webcast/email-templates'
import { sendAdminNotification } from '@/lib/email'
import nodemailer from 'nodemailer'

/**
 * Enroll a Clerk-authenticated webcast signup into the webcast automations.
 * Called once from /webcast/live?welcome=1 after a Clerk sign-up on /webcast.
 * Mirrors /api/webcast/register but takes identity from the Clerk session (no phone) —
 * email confirmation + email drip + lead capture + admin notice. SMS/voicemail drips
 * start later when the user adds a phone (handled by the existing phone-add flow).
 * Idempotent: if the lead already has a drip queued, it no-ops.
 */

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || ''

async function sendConfirmationEmail(lead: { first_name: string; email: string }, sessionTime: Date) {
  if (!SMTP_PASS) return
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  const template = getEmailTemplate(0, {
    first_name: lead.first_name,
    email: lead.email,
    session_time: getSessionLabel(sessionTime),
    countdown_minutes: Math.ceil(getSecondsUntilSession(sessionTime) / 60),
  })
  await transport.sendMail({
    from: `"Corey | Foreclosure Recovery Inc." <${SMTP_USER}>`,
    to: lead.email,
    subject: template.subject,
    html: template.html,
  })
}

async function queueEmailDrip(leadId: string, sessionTime: Date) {
  const delays = [
    { step: 1, hoursAfter: 2 },
    { step: 2, hoursAfter: 24 },
    { step: 3, hoursAfter: 72 },
    { step: 4, hoursAfter: 120 },
    { step: 5, hoursAfter: 168 },
  ]
  const rows = delays.map((d) => ({
    lead_id: leadId,
    step_number: d.step,
    scheduled_at: new Date(sessionTime.getTime() + d.hoursAfter * 3600000).toISOString(),
    status: 'pending',
  }))
  await supabaseAdmin.from('webcast_email_drip_queue').insert(rows)
}

export async function POST() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const email = (user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '').toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 })
    }
    const firstName = user.firstName || (email.split('@')[0] || 'there')
    const lastName = user.lastName || null

    // Respect permanent email suppression (STOP / opt-outs)
    const { data: emailBl } = await supabaseAdmin
      .from('email_blacklist')
      .select('email')
      .eq('email', email)
      .limit(1)
    if (emailBl && emailBl.length > 0) {
      return NextResponse.json({ success: true, status: 'suppressed' })
    }

    const sessionTime = getNextSessionTime()

    const { data: session } = await supabaseAdmin
      .from('webcast_sessions')
      .upsert(
        { session_start: sessionTime.toISOString(), session_label: getSessionLabel(sessionTime) },
        { onConflict: 'session_start' }
      )
      .select('id')
      .single()

    const { data: lead, error: insertError } = await supabaseAdmin
      .from('webcast_leads')
      .upsert(
        {
          first_name: firstName,
          last_name: lastName,
          email,
          utm_source: 'clerk_webcast',
          session_id: session?.id || null,
          assigned_session_time: sessionTime.toISOString(),
          status: 'registered',
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (insertError || !lead) {
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 })
    }

    // Idempotency: only queue the drip + send confirmation the FIRST time
    const { data: existingDrip } = await supabaseAdmin
      .from('webcast_email_drip_queue')
      .select('id')
      .eq('lead_id', lead.id)
      .limit(1)

    if (existingDrip && existingDrip.length > 0) {
      return NextResponse.json({ success: true, status: 'already_enrolled', leadId: lead.id })
    }

    await queueEmailDrip(lead.id, sessionTime).catch(() => {})
    // Welcome email is owned by the Clerk user.created webhook (single source — no duplicate welcomes).
    void sendConfirmationEmail
    sendAdminNotification(
      `New Webcast Signup (Clerk): ${firstName}${lastName ? ' ' + lastName : ''}`,
      `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
        <p><strong>New webcast signup via Clerk</strong></p>
        <p>Name: ${firstName}${lastName ? ' ' + lastName : ''}<br/>
        Email: ${email}<br/>
        Phone: (none yet — Clerk signup)<br/>
        Session: ${getSessionLabel(sessionTime)} (${sessionTime.toISOString()})</p>
      </div>`
    ).catch(() => {})

    return NextResponse.json({ success: true, status: 'enrolled', leadId: lead.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
