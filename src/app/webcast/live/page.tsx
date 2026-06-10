'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useSignIn } from '@clerk/nextjs'

// The live webcast lives inside the dashboard (/dashboard/live-webcast) so signed-in
// viewers stay in their account with the nav + hamburger. This public route forwards
// there (preserving autoplay/welcome). If a ?ticket= Clerk sign-in token is present
// (magic login links emailed to FB Lead Ad signups), it is exchanged for a session
// FIRST so the visitor arrives at the auth-gated room already logged in.
// Signed-out visitors with NO ticket (e.g. the FB lead form's thank-you button)
// get the instant-entry gate: type the email from the form -> auto-login.
function Redirector() {
  const router = useRouter()
  const sp = useSearchParams()
  const { isSignedIn } = useAuth()
  const { signIn, setActive, isLoaded } = useSignIn()
  const started = useRef(false)
  const [showGate, setShowGate] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const dest = (() => {
    const params = new URLSearchParams(sp.toString())
    params.delete('ticket')
    const qs = params.toString()
    return '/dashboard/live-webcast' + (qs ? `?${qs}` : '')
  })()

  async function loginWithTicket(ticket: string): Promise<boolean> {
    if (!signIn || !setActive) return false
    try {
      const result = await signIn.create({ strategy: 'ticket', ticket })
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        // Tell the admins a lead just logged in (identity comes from the fresh
        // session server-side; keepalive survives the redirect).
        fetch('/api/webcast/login-notify', { method: 'POST', keepalive: true }).catch(() => {})
        return true
      }
    } catch {
      /* expired/used ticket */
    }
    return false
  }

  useEffect(() => {
    if (!isLoaded || started.current) return
    started.current = true

    const ticket = sp.get('ticket')
    ;(async () => {
      if (isSignedIn) {
        router.replace(dest)
        return
      }
      if (ticket) {
        await loginWithTicket(ticket)
        router.replace(dest) // logged in or not, forward (sign-in gate catches failures)
        return
      }
      setShowGate(true) // signed out, no ticket -> instant-entry gate
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/webcast/instant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ticket && (await loginWithTicket(data.ticket))) {
        router.replace(dest)
        return
      }
      setError(data.error || 'Login failed. Try again or use the link from your email.')
    } catch {
      setError('Connection problem. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!showGate) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#0b1f3a', border: '1px solid #1e3a5f', borderRadius: 14, padding: 28, textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>You&apos;re almost in</h1>
        <p style={{ color: '#93b3d8', fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>
          Enter the email you used on the form and we&apos;ll log you straight into the live webcast.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 9, border: '1px solid #2c4a73', background: '#071529', color: '#fff', fontSize: 15, marginBottom: 12 }}
          />
          <button
            type="submit"
            disabled={busy}
            style={{ width: '100%', padding: '13px 0', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 16, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}
          >
            {busy ? 'Logging you in…' : '▶ Enter the Live Webcast'}
          </button>
        </form>
        {error && <p style={{ color: '#fca5a5', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
        <p style={{ color: '#5b7ba3', fontSize: 12, margin: '16px 0 0' }}>
          Already have a password?{' '}
          <a href="/sign-in?direct=1" style={{ color: '#93b3d8' }}>Sign in here</a>
        </p>
      </div>
    </div>
  )
}

export default function WebcastLiveRedirect() {
  return (
    <div style={{ minHeight: '100vh', background: '#050d1a' }}>
      <Suspense fallback={null}>
        <Redirector />
      </Suspense>
    </div>
  )
}
