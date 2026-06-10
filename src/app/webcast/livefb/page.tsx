'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth, useSignIn } from '@clerk/nextjs'
import { LiveRoom } from '@/components/webcast/live-room'

// No-login live webcast for FB Lead Ad signups. We already have their info from
// the lead form, so the link in their email/Messenger drops them STRAIGHT into
// the live room — zero walls. If a ?ticket= sign-in token is present it is
// exchanged silently in the background (fires the admin login notice and leaves
// them logged in for the rest of the site) but playback never waits on it.
function SilentTicketLogin() {
  const sp = useSearchParams()
  const { isSignedIn } = useAuth()
  const { signIn, setActive, isLoaded } = useSignIn()
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded || started.current) return
    started.current = true
    const ticket = sp.get('ticket')
    if (!ticket || isSignedIn || !signIn || !setActive) return
    ;(async () => {
      try {
        const result = await signIn.create({ strategy: 'ticket', ticket })
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId })
          fetch('/api/webcast/login-notify', { method: 'POST', keepalive: true }).catch(() => {})
        }
      } catch {
        /* expired/used ticket — they still watch, nothing blocks */
      }
    })()
  }, [isLoaded, isSignedIn, signIn, setActive, sp])

  return null
}

export default function LiveFbPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050d1a' }}>
      <Suspense fallback={null}>
        <SilentTicketLogin />
      </Suspense>
      <LiveRoom />
    </div>
  )
}
