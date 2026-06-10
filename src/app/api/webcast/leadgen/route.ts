import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

/**
 * FB Lead Ads -> n8n -> this endpoint.
 * Creates a real Clerk account server-side (random password), enrolls the lead in
 * the full webcast funnel (drips + CAPI via /api/webcast/register), and emails a
 * one-tap magic login link straight into the live webcast.
 * Secured by the x-leadgen-secret header (LEADGEN_WEBHOOK_SECRET env).
 */

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
})

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_USFR_LEADS_PASSWORD || ''
const SITE = 'https://usforeclosureleads.com'

async function sendMagicLinkEmail(to: string, firstName: string, ticket: string) {
  if (!SMTP_PASS) return
  const link = `${SITE}/webcast/live?autoplay=1&welcome=1&ticket=${encodeURIComponent(ticket)}`
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  await transport.sendMail({
    from: `"Corey | Foreclosure Recovery Inc." <${SMTP_USER}>`,
    to,
    subject: 'You’re in — tap to join the live webcast',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#09274c,#1E3A5F);padding:26px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">Your seat is saved, ${firstName}</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:26px;text-align:center">
          <p style="font-size:15px;line-height:1.6;margin:0 0 18px">Your free account is ready. One tap below logs you in and drops you straight into the live surplus recovery webcast — no password needed.</p>
          <a href="${link}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 34px;border-radius:10px">▶ Join the Live Webcast</a>
          <p style="font-size:12px;color:#64748b;margin:18px 0 0">This login link works for 24 hours. After that, sign in at usforeclosureleads.com with your email (use “Forgot password” to set one).</p>
        </div>
      </div>`,
  })
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.LEADGEN_WEBHOOK_SECRET
    if (!secret || req.headers.get('x-leadgen-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { firstName, lastName, email, phone } = parsed.data

    const client = await clerkClient()

    // Create the account (random strong password) or find the existing one.
    let userId: string | null = null
    try {
      const user = await client.users.createUser({
        emailAddress: [email],
        password: crypto.randomBytes(18).toString('base64url'),
        firstName,
        lastName: lastName || undefined,
      })
      userId = user.id
    } catch (err: unknown) {
      const errors = (err as { errors?: Array<{ code?: string }> })?.errors || []
      if (errors[0]?.code === 'form_identifier_exists') {
        const existing = await client.users.getUserList({ emailAddress: [email] })
        userId = existing.data[0]?.id || null
      } else {
        throw err
      }
    }
    if (!userId) {
      return NextResponse.json({ error: 'Account creation failed' }, { status: 500 })
    }

    // Full funnel enrollment (lead row, drips, CAPI Lead, suppression checks) —
    // reuse the existing register route so the logic stays in one place.
    fetch(`${SITE}/api/webcast/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        smsConsent: Boolean(phone),
        utmSource: 'fb_leadgen',
        utmMedium: 'lead_ad',
      }),
    }).catch(() => {})

    // Magic login link (24h) straight into the live room.
    const ticket = await client.signInTokens.createSignInToken({ userId, expiresInSeconds: 86400 })
    await sendMagicLinkEmail(email, firstName, ticket.token)

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Leadgen webhook error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
