import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getNextSessionTime, getSessionLabel } from '@/lib/webcast/session-manager'
import { getEmailTemplate } from '@/lib/webcast/email-templates'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const unlockSchema = z.object({
  firstName: z.string().min(1).max(100),
  email: z.string().email(),
})

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || ''

function generateTempPassword(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = unlockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid name and email required' }, { status: 400 })
    }

    const { firstName, email } = parsed.data
    const emailLower = email.toLowerCase()
    const sessionTime = getNextSessionTime()

    // 1. Upsert webcast lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('webcast_leads')
      .upsert(
        {
          first_name: firstName,
          email: emailLower,
          status: 'registered',
          session_id: null,
          assigned_session_time: sessionTime.toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id, leads_account_provisioned')
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }

    // 2. Queue 6-part email drip
    const delays = [
      { step: 1, hoursAfter: 2 },
      { step: 2, hoursAfter: 24 },
      { step: 3, hoursAfter: 72 },
      { step: 4, hoursAfter: 120 },
      { step: 5, hoursAfter: 168 },
    ]
    const dripRows = delays.map((d) => ({
      lead_id: lead.id,
      step_number: d.step,
      scheduled_at: new Date(Date.now() + d.hoursAfter * 3600000).toISOString(),
      status: 'pending',
    }))
    await supabaseAdmin.from('webcast_email_drip_queue').upsert(dripRows, {
      onConflict: 'lead_id,step_number',
      ignoreDuplicates: true,
    }).then(() => {})

    // 3. Create usforeclosureleads.com preview account (if not already provisioned)
    let tempPassword = ''
    if (!lead.leads_account_provisioned) {
      tempPassword = generateTempPassword()

      await supabaseAdmin
        .from('user_pins')
        .upsert(
          {
            email: emailLower,
            pin: tempPassword,
            full_name: firstName,
            package_type: 'free_webcast',
            is_active: true,
            leads_allocated: 0,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )

      await supabaseAdmin
        .from('webcast_leads')
        .update({
          leads_account_provisioned: true,
          leads_account_provisioned_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
    }

    // 4. Send welcome email with account credentials (best-effort)
    if (SMTP_PASS && tempPassword) {
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })

      transport.sendMail({
        from: `"Corey | Foreclosure Recovery Inc." <${SMTP_USER}>`,
        to: emailLower,
        subject: 'Your Preview Account Is Ready -- Welcome to the Team',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#09274c;">Welcome, ${firstName}!</h2>
            <p>Your preview account on <strong>usforeclosureleads.com</strong> is now active. Log in to explore the dashboard and see how the surplus fund recovery system works.</p>
            <div style="background:#f0f7ff;border:1px solid #09274c;border-radius:8px;padding:20px;margin:20px 0;">
              <p style="margin:4px 0;"><strong>Website:</strong> <a href="https://usforeclosureleads.com">usforeclosureleads.com</a></p>
              <p style="margin:4px 0;"><strong>Email:</strong> ${emailLower}</p>
              <p style="margin:4px 0;"><strong>Temporary PIN:</strong> ${tempPassword}</p>
            </div>
            <p><strong>Ready to access live leads?</strong> The Asset Recovery Agent Partnership gets you 50 exclusive leads per week, certified letters mailed on your behalf, and full outreach automation pre-configured. $995 total -- pay in full, three monthly payments of $331, or in-house financing.</p>
            <p style="margin-top:12px;"><a href="https://usforeclosureleads.com/apply" style="display:inline-block;background:#d4a84b;color:#09274c;padding:12px 28px;text-decoration:none;font-weight:700;border-radius:6px;">ENROLL IN THE PARTNERSHIP</a></p>
            <p style="margin-top:20px;">Questions? Call us at <strong>(888) 545-8007</strong></p>
            <p>-- Corey Pearson<br/>Foreclosure Recovery Inc.</p>
          </div>
        `,
      }).catch(() => {})
    } else if (SMTP_PASS && !tempPassword) {
      // Account already existed -- send drip email 0 instead
      const template = getEmailTemplate(0, {
        first_name: firstName,
        email: emailLower,
        session_time: getSessionLabel(sessionTime),
        countdown_minutes: 0,
      })
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      transport.sendMail({
        from: `"Corey | Foreclosure Recovery Inc." <${SMTP_USER}>`,
        to: emailLower,
        subject: template.subject,
        html: template.html,
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
