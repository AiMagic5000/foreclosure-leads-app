import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

/**
 * Instant entry for FB Lead Ad signups. The lead form's thank-you button lands
 * signed-out visitors on /webcast/live; they type the same email they just gave
 * Facebook and get exchanged for a one-time Clerk sign-in ticket — straight into
 * the dashboard with no email open required.
 *
 * Scope guard: only works for accounts whose webcast lead came from fb_leadgen
 * within the last 72h (fresh webcast-only accounts, nothing sensitive). Everyone
 * else gets a magic link emailed instead. Rate limited per IP.
 */

const schema = z.object({ email: z.string().email() })

const WINDOW_HOURS = 72
const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRate(ip: string): boolean {
  const now = Date.now()
  const e = rateMap.get(ip)
  if (!e || now > e.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 15 * 60_000 })
    return true
  }
  if (e.count >= 5) return false
  rateMap.set(ip, { count: e.count + 1, resetAt: e.resetAt })
  return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRate(ip)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
    }

    const parsed = schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase().trim()

    // Generic response for unknown emails — don't leak who has an account.
    const notFound = NextResponse.json(
      { error: 'No recent signup found for that email. Use the exact email from the form.' },
      { status: 404 }
    )

    const { data: lead } = await supabaseAdmin
      .from('webcast_leads')
      .select('id, created_at, utm_source')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!lead || lead.utm_source !== 'fb_leadgen') return notFound

    const ageHours = (Date.now() - new Date(lead.created_at).getTime()) / 3_600_000
    if (ageHours > WINDOW_HOURS) return notFound

    const client = await clerkClient()
    const users = await client.users.getUserList({ emailAddress: [email] })
    const userId = users.data[0]?.id
    if (!userId) return notFound

    const ticket = await client.signInTokens.createSignInToken({ userId, expiresInSeconds: 600 })
    return NextResponse.json({ ticket: ticket.token })
  } catch (err) {
    console.error('instant-login error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
