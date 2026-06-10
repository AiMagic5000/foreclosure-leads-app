'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignUp, useSignIn, useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { trackLead, genEventId } from '@/lib/meta/pixel-client'
import { trackGoogleWebcastConversion } from '@/lib/google/ads-client'

const LIVE_URL = '/dashboard/live-webcast?autoplay=1&welcome=1'

// Webcast signup that creates a REAL account so there is no second sign-in when the
// viewer clicks "My Dashboard" from the live room. Two one-step paths:
//  - Continue with Google  -> Clerk OAuth -> /sso-callback -> live room (logged in)
//  - First name + email + password -> /api/webcast/signup creates the Clerk account
//    server-side (no email-code step) and returns a sign-in ticket we exchange for an
//    active session, then fires the drips/pixel and drops them in the live room.
export function WebcastEmailGate() {
  const router = useRouter()
  const params = useSearchParams()
  const { isSignedIn } = useAuth()
  const { signUp } = useSignUp()
  const { signIn, setActive } = useSignIn()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'google' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Fire the lead capture (drips + pixel CAPI + Google conversion). Best-effort.
  async function fireLead() {
    try {
      const eventId = genEventId()
      await fetch('/api/webcast/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          eventId,
          utmSource: params.get('utm_source') || 'webcast_gate',
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
        }),
      })
      trackLead(eventId, { content_name: 'webcast_registration' })
      trackGoogleWebcastConversion()
    } catch {
      /* non-blocking */
    }
  }

  async function handleGoogle() {
    if (!signUp || status === 'loading' || status === 'google') return
    setStatus('google')
    setErrorMsg('')
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: LIVE_URL,
      })
    } catch {
      setErrorMsg('Could not start Google sign-up. Please try email instead.')
      setStatus('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !email.trim() || password.length < 8 || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')

    try {
      // Already signed in (returning visitor) -> just fire the lead + go in.
      if (isSignedIn) {
        await fireLead()
        router.push(LIVE_URL)
        return
      }

      const res = await fetch('/api/webcast/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), email: email.trim(), password }),
      })
      const data = await res.json()

      if (res.ok && data.ticket && signIn && setActive) {
        // Exchange the one-time ticket for an active session = logged in for real.
        const result = await signIn.create({ strategy: 'ticket', ticket: data.ticket })
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId })
        }
        await fireLead()
        router.push(LIVE_URL)
        return
      }

      if (res.status === 409 && data.exists) {
        // Account already exists — capture the lead, send them in, let them sign in for the dashboard.
        await fireLead()
        setErrorMsg('You already have an account — taking you to the webcast. Use "Sign In" for your dashboard.')
        setTimeout(() => router.push(LIVE_URL), 1400)
        return
      }

      setErrorMsg(data.error || 'Something went wrong. Please try again.')
      setStatus('error')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  const busy = status === 'loading' || status === 'google'

  return (
    <div className="w-full flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full h-12 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        {status === 'google' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="flex items-center gap-3 my-1">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="text" name="given-name" autoComplete="given-name" autoCapitalize="words"
          placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
          required disabled={busy}
          className="w-full h-12 px-4 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/30 outline-none"
        />
        <input
          type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
          placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
          required disabled={busy}
          className="w-full h-12 px-4 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/30 outline-none"
        />
        <input
          type="password" name="new-password" autoComplete="new-password"
          placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)}
          required minLength={8} disabled={busy}
          className="w-full h-12 px-4 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/30 outline-none"
        />
        <p className="text-[11px] text-slate-400 -mt-1">Your password sets up your account so your dashboard is ready after the webcast.</p>
        <button
          type="submit"
          disabled={busy || !firstName.trim() || !email.trim() || password.length < 8}
          className="w-full h-12 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-60 text-white font-bold text-base tracking-wide transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Get Instant Access →'}
        </button>
        {status === 'error' && <p className="text-red-300 text-xs text-center">{errorMsg}</p>}
        {status === 'loading' && errorMsg && <p className="text-amber-300 text-xs text-center">{errorMsg}</p>}
        <p className="text-center text-xs text-slate-400">
          Already have an account? <a href="/sign-in?direct=1&redirect_url=/webcast/live?autoplay=1" className="font-semibold text-[#1e3a5f] hover:underline">Sign in</a>
        </p>
      </form>
    </div>
  )
}
