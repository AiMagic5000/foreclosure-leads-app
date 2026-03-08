import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || ''

function generateTempPassword(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()
    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 })
    }

    const { data: lead } = await supabaseAdmin
      .from('webcast_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.foreclosure_leads_provisioned_at) {
      return NextResponse.json({ error: 'Account already provisioned' }, { status: 400 })
    }

    const tempPassword = generateTempPassword()

    // Create preview account (no leads assigned -- leads access requires Junior Partner or Owner Operator tier)
    const { error: pinError } = await supabaseAdmin
      .from('user_pins')
      .upsert(
        {
          email: lead.email.toLowerCase(),
          pin: tempPassword,
          full_name: `${lead.first_name} ${lead.last_name || ''}`.trim(),
          package_type: 'free_webcast',
          is_active: true,
          leads_allocated: 0,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )

    if (pinError) {
      return NextResponse.json({ error: 'Failed to create account: ' + pinError.message }, { status: 500 })
    }

    // Mark as provisioned (preview-only -- leads assigned after partnership upgrade)
    await supabaseAdmin
      .from('webcast_leads')
      .update({
        foreclosure_leads_provisioned_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    // Send credentials email
    if (SMTP_PASS) {
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })

      await transport.sendMail({
        from: `"Corey | Foreclosure Recovery Inc." <${SMTP_USER}>`,
        to: lead.email,
        subject: 'Your Preview Account Is Ready',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#09274c;">Welcome, ${lead.first_name}!</h2>
            <p>Your preview account on <strong>usforeclosureleads.com</strong> is now active. Log in to explore the dashboard and see how the surplus fund recovery system works.</p>
            <div style="background:#f0f7ff;border:1px solid #09274c;border-radius:8px;padding:20px;margin:20px 0;">
              <p style="margin:4px 0;"><strong>Website:</strong> <a href="https://usforeclosureleads.com">usforeclosureleads.com</a></p>
              <p style="margin:4px 0;"><strong>Email:</strong> ${lead.email}</p>
              <p style="margin:4px 0;"><strong>Temporary PIN:</strong> ${tempPassword}</p>
            </div>
            <p><strong>Ready to access live leads?</strong> Junior Partners and Owner Operators get leads assigned directly to their account with full outreach automation. Apply for the partnership program to get started.</p>
            <p style="margin-top:12px;"><a href="https://usforeclosureleads.com/apply" style="display:inline-block;background:#d4a84b;color:#09274c;padding:12px 28px;text-decoration:none;font-weight:700;border-radius:6px;">APPLY FOR PARTNERSHIP</a></p>
            <p style="margin-top:20px;">Questions? Call us at <strong>(888) 545-8007</strong></p>
            <p>-- Corey Pearson<br/>Foreclosure Recovery Inc.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({
      success: true,
      accountType: 'preview',
      email: lead.email,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
