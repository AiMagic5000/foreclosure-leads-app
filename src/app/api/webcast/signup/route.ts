import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'

/**
 * Instant webcast signup with a password — no email-verification step.
 * Creates the Clerk account server-side (already usable) and returns a one-time
 * sign-in ticket the client exchanges for an active session via signIn.create({strategy:'ticket'}).
 * Result: one password signup on /webcast = a real account they are logged into,
 * so "My Dashboard" works straight from the live webcast (no second sign-in).
 */

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter your name, email, and a password of at least 8 characters.' }, { status: 400 })
    }
    const { firstName, lastName, email, password } = parsed.data

    const client = await clerkClient()

    let userId: string
    try {
      const user = await client.users.createUser({
        emailAddress: [email],
        password,
        firstName,
        lastName: lastName || undefined,
      })
      userId = user.id
    } catch (err: unknown) {
      // Clerk throws a structured error; surface the useful cases
      const errors = (err as { errors?: Array<{ code?: string; message?: string }> })?.errors || []
      const code = errors[0]?.code || ''
      if (code === 'form_identifier_exists') {
        return NextResponse.json({ exists: true, error: 'You already have an account with this email. Please sign in.' }, { status: 409 })
      }
      if (code === 'form_password_pwned' || code === 'form_password_length_too_short' || code === 'form_password_size_in_bytes_exceeded') {
        return NextResponse.json({ error: 'Please choose a stronger password (at least 8 characters, not a commonly breached one).' }, { status: 400 })
      }
      return NextResponse.json({ error: errors[0]?.message || 'Sign up failed. Please try again.' }, { status: 400 })
    }

    const ticket = await client.signInTokens.createSignInToken({ userId, expiresInSeconds: 600 })
    return NextResponse.json({ ticket: ticket.token })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
