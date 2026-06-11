import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'
import crypto from 'crypto'
import zlib from 'zlib'

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

// Accepts JSON or form-encoded bodies; tolerates fullName instead of first/last
// and FB's array-shaped field values. Returns a schema-shaped object.
async function parseLead(req: NextRequest): Promise<{ firstName: string; lastName?: string; email: string; phone?: string } | null> {
  const ct = req.headers.get('content-type') || ''
  let raw: Record<string, unknown> = {}
  try {
    if (ct.includes('application/json')) {
      raw = await req.json()
    } else {
      const form = await req.formData()
      for (const [k, v] of form.entries()) raw[k] = v
    }
  } catch {
    return null
  }
  const pick = (v: unknown): string => {
    if (Array.isArray(v)) return String(v[0] ?? '').trim()
    return String(v ?? '').trim()
  }
  let firstName = pick(raw.firstName)
  let lastName = pick(raw.lastName) || undefined
  const fullName = pick(raw.fullName ?? raw.full_name)
  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/)
    firstName = parts[0] || ''
    lastName = parts.slice(1).join(' ') || undefined
  }
  const email = pick(raw.email).toLowerCase()
  const phone = pick(raw.phone) || undefined
  if (!firstName) firstName = 'there'
  const parsed = schema.safeParse({ firstName, lastName, email, phone })
  return parsed.success ? parsed.data : null
}

const SITE = 'https://usforeclosureleads.com'

// Vercel's serverless runtime can't reach SMTP reliably (getaddrinfo EBUSY), so the
// magic-link email goes out over HTTPS via the proven tradelinejet PHP->MXRoute relay.
const RELAY_URL = process.env.MAIL_RELAY_URL || 'https://www.assetrecoverybusiness.com/_api/usfr-relay.php'
const RELAY_TOKEN = process.env.MAIL_RELAY_TOKEN || ''

async function sendMagicLinkEmail(to: string, firstName: string, ticket: string) {
  if (!RELAY_TOKEN) return
  // livefb = the no-login live room (FB leads gave us their info already; the
  // ticket logs them in silently in the background, never blocks playback).
  const link = `${SITE}/webcast/livefb?autoplay=1&welcome=1&ticket=${encodeURIComponent(ticket)}`
  const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#09274c,#1E3A5F);padding:26px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">Your seat is saved, ${firstName}</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:26px;text-align:center">
          <p style="font-size:15px;line-height:1.6;margin:0 0 18px">Your free account is ready. One tap below logs you in and drops you straight into the live surplus recovery webcast — no password needed.</p>
          <a href="${link}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 34px;border-radius:10px">▶ Join the Live Webcast</a>
          <p style="font-size:12px;color:#64748b;margin:18px 0 0">This login link works for 24 hours. After that, sign in at usforeclosureleads.com with your email (use “Forgot password” to set one).</p>
        </div>
      </div>`
  const text = `Your seat is saved, ${firstName}. Tap to join the live webcast (logs you in automatically, link valid 24h): ${link}`
  const res = await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-USFR-Relay-Token': RELAY_TOKEN },
    body: JSON.stringify({
      to,
      subject: 'You’re in — tap to join the live webcast',
      html_b64gz: zlib.gzipSync(Buffer.from(html)).toString('base64'),
      text_b64gz: zlib.gzipSync(Buffer.from(text)).toString('base64'),
      from_email: 'support@usforeclosureleads.com',
      from_name: 'Corey | Foreclosure Recovery Inc.',
      reply_to: 'support@usforeclosureleads.com',
    }),
  })
  if (!res.ok) throw new Error(`relay ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

async function sendEnrollmentFailureAlert(
  email: string,
  firstName: string,
  lastName: string | undefined,
  phone: string | undefined,
  errorMsg: string
) {
  if (!RELAY_TOKEN) return
  const name = [firstName, lastName].filter(Boolean).join(' ')
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;max-width:560px">
    <div style="background:#b91c1c;padding:18px;border-radius:10px 10px 0 0"><h2 style="color:#fff;margin:0;font-size:18px">⚠️ New FB Lead — enrollment FAILED (needs backfill)</h2></div>
    <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:18px">
      <p style="margin:0 0 4px"><strong>Name:</strong> ${name}</p>
      <p style="margin:0 0 4px"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 4px"><strong>Phone:</strong> ${phone || '—'}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b">Clerk account + magic link were sent, but the lead row / drip / notice step failed: ${errorMsg}</p>
    </div></div>`
  for (const to of ['xscore10@protonmail.com', 'support@usforeclosureleads.com']) {
    await fetch(RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-USFR-Relay-Token': RELAY_TOKEN },
      body: JSON.stringify({
        to,
        subject: `⚠️ FB lead NOT enrolled: ${name} (${email})`,
        html_b64gz: zlib.gzipSync(Buffer.from(html)).toString('base64'),
        text_b64gz: zlib.gzipSync(Buffer.from(`FB lead enrollment failed for ${name} (${email}, ${phone || 'no phone'}): ${errorMsg}`)).toString('base64'),
        from_email: 'support@usforeclosureleads.com',
        from_name: 'USFR Lead Notifications',
      }),
    }).catch(() => {})
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.LEADGEN_WEBHOOK_SECRET
    if (!secret || req.headers.get('x-leadgen-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lead = await parseLead(req)
    if (!lead) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const { firstName, lastName, email, phone } = lead

    const client = await clerkClient()

    // Create the account or find the existing one. When the lead gave a phone
    // number it doubles as their password ("log in: your email + your phone
    // number") — these are free webcast accounts, recall beats entropy here.
    // skipPasswordChecks: phone numbers trip Clerk's breach-list filter.
    let userId: string | null = null
    const phoneDigits = (phone || '').replace(/\D/g, '')
    try {
      const user = await client.users.createUser({
        emailAddress: [email],
        password: phoneDigits.length >= 10 ? phoneDigits : crypto.randomBytes(18).toString('base64url'),
        skipPasswordChecks: phoneDigits.length >= 10,
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

    // Full funnel enrollment (lead row, drips, CAPI Lead, admin notice, suppression) —
    // reuse the existing register route so the logic stays in one place.
    // MUST be awaited: Vercel freezes the function after the response, so a
    // fire-and-forget fetch here randomly never completes (lost drips/notices).
    // The x-leadgen-secret header bypasses register's per-IP rate limit (all
    // internal calls share Vercel's egress IP — real leads were getting 429'd).
    let registerError = ''
    try {
      const regRes = await fetch(`${SITE}/api/webcast/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-leadgen-secret': secret },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          smsConsent: Boolean(phone),
          utmSource: 'fb_leadgen',
          utmMedium: 'lead_ad',
        }),
      })
      if (!regRes.ok) {
        registerError = `register ${regRes.status}: ${(await regRes.text()).slice(0, 200)}`
      }
    } catch (e) {
      registerError = e instanceof Error ? e.message : String(e)
    }
    // Never lose a lead silently: if enrollment failed, alert the admin inboxes
    // directly so the lead can be backfilled.
    if (registerError) {
      console.error('leadgen: register enrollment failed:', registerError)
      await sendEnrollmentFailureAlert(email, firstName, lastName, phone, registerError).catch((e) =>
        console.error('leadgen: failure alert send failed', e)
      )
    }

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
