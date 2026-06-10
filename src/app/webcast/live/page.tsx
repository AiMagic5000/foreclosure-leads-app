'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useSignIn } from '@clerk/nextjs'

// The live webcast lives inside the dashboard (/dashboard/live-webcast) so signed-in
// viewers stay in their account with the nav + hamburger. This public route forwards
// there (preserving autoplay/welcome). If a ?ticket= Clerk sign-in token is present
// (magic login links emailed to FB Lead Ad signups), it is exchanged for a session
// FIRST so the visitor arrives at the auth-gated room already logged in.
function Redirector() {
  const router = useRouter()
  const sp = useSearchParams()
  const { isSignedIn } = useAuth()
  const { signIn, setActive, isLoaded } = useSignIn()
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded || started.current) return
    started.current = true

    const params = new URLSearchParams(sp.toString())
    const ticket = params.get('ticket')
    params.delete('ticket') // single-use; never forward it
    const qs = params.toString()
    const dest = '/dashboard/live-webcast' + (qs ? `?${qs}` : '')

    ;(async () => {
      if (ticket && !isSignedIn && signIn && setActive) {
        try {
          const result = await signIn.create({ strategy: 'ticket', ticket })
          if (result.createdSessionId) {
            await setActive({ session: result.createdSessionId })
          }
        } catch {
          /* expired/used ticket — continue; they'll see sign-in */
        }
      }
      router.replace(dest)
    })()
  }, [isLoaded, isSignedIn, signIn, setActive, router, sp])

  return null
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
