import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import nodemailer from 'nodemailer'

const partnershipSchema = z.object({
  leadId: z.string().uuid().optional(),
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  state: z.string().max(50).optional(),
  experienceLevel: z.string().max(100).optional(),
  whyInterested: z.string().max(2000).optional(),
})

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || ''
const ADMIN_EMAIL = 'coreypearsonemail@gmail.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = partnershipSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { leadId, fullName, email, phone, state, experienceLevel, whyInterested } = parsed.data

    const { error: insertError } = await supabaseAdmin
      .from('webcast_partnership_applications')
      .insert({
        lead_id: leadId || null,
        full_name: fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        state: state || null,
        experience_level: experienceLevel || null,
        why_interested: whyInterested || null,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    // Update lead record if we have a leadId
    if (leadId) {
      await supabaseAdmin
        .from('webcast_leads')
        .update({
          partnership_offer_clicked: true,
          partnership_offer_clicked_at: new Date().toISOString(),
        })
        .eq('id', leadId)
    }

    // Notify admin
    if (SMTP_PASS) {
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      await transport.sendMail({
        from: `"Webcast Funnel" <${SMTP_USER}>`,
        to: ADMIN_EMAIL,
        subject: `New Partnership Application: ${fullName}`,
        html: `<h2>New 50/50 Partnership Application</h2>
<p><strong>Name:</strong> ${fullName}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
<p><strong>State:</strong> ${state || 'Not provided'}</p>
<p><strong>Experience:</strong> ${experienceLevel || 'Not provided'}</p>
<p><strong>Why Interested:</strong> ${whyInterested || 'Not provided'}</p>`,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
