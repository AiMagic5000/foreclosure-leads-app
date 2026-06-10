import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getNextSessionTime, getSessionLabel, getSecondsUntilSession } from '@/lib/webcast/session-manager'
import { getEmailTemplate, SMS_TEMPLATES } from '@/lib/webcast/email-templates'
import { sendAdminNotification } from '@/lib/email'
import { sendMetaLeadEvent, readFbCookies } from '@/lib/meta/capi'
import nodemailer from '@/lib/nodemailer-relay-shim'

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  smsConsent: z.boolean().optional(),
  honeypot: z.string().max(0).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  eventId: z.string().max(100).optional(),
})

const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY || ''
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || ''
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || ''

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 })
    return true
  }
  if (entry.count >= 5) return false
  rateLimitMap.set(ip, { count: entry.count + 1, resetAt: entry.resetAt })
  return true
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return '+1' + digits
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  return '+' + digits
}

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

async function sendWelcomeSms(phone: string, firstName: string, sessionTime: Date) {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) return
  const message = SMS_TEMPLATES[0]
    .replace('{first_name}', firstName)
    .replace('{session_time}', getSessionLabel(sessionTime))
  await fetch(
    `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
    {
      method: 'POST',
      headers: {
        'x-api-key': TEXTBEE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipients: [formatPhone(phone)], message }),
    }
  )
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

async function queueSmsDrip(leadId: string, phone: string, sessionTime: Date) {
  const delays = [
    { step: 1, minutesBefore: 5, isPreWebcast: true },
    { step: 2, hoursAfter: 1 },
    { step: 3, hoursAfter: 48 },
    { step: 4, hoursAfter: 96 },
    { step: 5, hoursAfter: 168 },
  ]
  const rows = delays.map((d) => {
    const scheduledAt = d.isPreWebcast
      ? new Date(sessionTime.getTime() - (d.minutesBefore || 5) * 60000)
      : new Date(sessionTime.getTime() + (d.hoursAfter || 0) * 3600000)
    return {
      lead_id: leadId,
      step_number: d.step,
      phone,
      message: SMS_TEMPLATES[d.step] || '',
      scheduled_at: scheduledAt.toISOString(),
      status: 'pending',
    }
  })
  await supabaseAdmin.from('webcast_sms_queue').insert(rows)
}

export async function POST(request: NextRequest) {
  try {
    // Internal calls from the FB leadgen webhook all share Vercel's egress IP, so
    // the per-IP limit (5/hr) would silently block real leads. The leadgen secret
    // marks them trusted and skips the IP limit (leadgen has its own auth gate).
    const internalSecret = process.env.LEADGEN_WEBHOOK_SECRET
    const isTrustedInternal = Boolean(internalSecret && request.headers.get('x-leadgen-secret') === internalSecret)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!isTrustedInternal && !checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many signups. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { firstName, lastName, email, phone, smsConsent, honeypot, utmSource, utmMedium, utmCampaign, eventId } = parsed.data

    if (honeypot) {
      return NextResponse.json({ success: true, sessionTime: new Date().toISOString(), leadId: 'ok' })
    }

    // Permanent suppression check — STOP replies / opt-outs (eternal)
    const phoneDigits = (phone || '').replace(/\D/g, '')
    const phoneVariants = phoneDigits
      ? [phoneDigits, '+1' + phoneDigits, '1' + phoneDigits, '+' + phoneDigits]
      : []
    if (phoneVariants.length > 0) {
      const { data: phoneBl } = await supabaseAdmin
        .from('phone_blacklist')
        .select('phone_number')
        .in('phone_number', phoneVariants)
        .limit(1)
      if (phoneBl && phoneBl.length > 0) {
        return NextResponse.json({ success: true, sessionTime: new Date().toISOString(), leadId: 'suppressed' })
      }
    }
    const { data: emailBl } = await supabaseAdmin
      .from('email_blacklist')
      .select('email')
      .eq('email', email.toLowerCase())
      .limit(1)
    if (emailBl && emailBl.length > 0) {
      return NextResponse.json({ success: true, sessionTime: new Date().toISOString(), leadId: 'suppressed' })
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
          last_name: lastName || null,
          email: email.toLowerCase(),
          phone: phone || null,
          sms_consent: smsConsent || false,
          ip_address: ip,
          utm_source: utmSource || null,
          utm_medium: utmMedium || null,
          utm_campaign: utmCampaign || null,
          session_id: session?.id || null,
          assigned_session_time: sessionTime.toISOString(),
          status: 'registered',
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (insertError || !lead) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }

    // Await DB operations (fast) -- must complete before response
    const dbTasks: Promise<unknown>[] = [
      queueEmailDrip(lead.id, sessionTime),
    ]
    // SMS drip RE-ENABLED 2026-06-05 (now on TextBee w/ browser UA header)
    if (phone && smsConsent) {
      dbTasks.push(queueSmsDrip(lead.id, phone, sessionTime))
    }
    await Promise.allSettled(dbTasks)

    // Welcome email is owned by the Clerk user.created webhook (single source — no duplicate welcomes).
    // This route only captures the lead + queues the drip. SMS welcome still fires if a phone/consent given.
    void sendConfirmationEmail
    if (phone && smsConsent) {
      await sendWelcomeSms(phone, firstName, sessionTime).catch(() => {})
    }

    // Notice of new webcast registration -> xscore10 + claim@ (admin emails).
    // MUST be awaited: Vercel freezes the function right after the response is
    // returned, so fire-and-forget sends randomly never complete (lost notices).
    await sendAdminNotification(
      `New Webcast Registration: ${firstName}${lastName ? " " + lastName : ""}`,
      `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
        <p><strong>New webcast registration</strong></p>
        <p>Name: ${firstName}${lastName ? " " + lastName : ""}<br/>
        Email: ${email}<br/>
        Phone: ${phone || "(none)"}<br/>
        SMS consent: ${phone && smsConsent ? "yes" : "no"}<br/>
        Session: ${getSessionLabel(sessionTime)} (${sessionTime.toISOString()})<br/>
        Source: ${utmSource || "direct"}${utmCampaign ? " / " + utmCampaign : ""}</p>
      </div>`
    ).catch(() => {})

    // Voice drop + account provisioning handled by n8n (90s delay can't run in serverless)

    // Meta Conversions API — server-side Lead (deduped with browser pixel via eventId).
    // Best-effort; no-ops until META_CAPI_ACCESS_TOKEN is set.
    try {
      const { fbp, fbc } = readFbCookies(request.headers.get('cookie'))
      await sendMetaLeadEvent({
        email,
        phone: phone || undefined,
        firstName,
        lastName: lastName || undefined,
        eventId,
        eventSourceUrl: request.headers.get('referer') || 'https://usforeclosureleads.com/webcast',
        clientIp: ip !== 'unknown' ? ip : undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        fbp,
        fbc,
        actionSource: 'website',
      })
    } catch (capiErr) {
      console.error('Meta CAPI (webcast register) error:', capiErr)
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      sessionTime: sessionTime.toISOString(),
      sessionLabel: getSessionLabel(sessionTime),
      secondsUntil: getSecondsUntilSession(sessionTime),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
