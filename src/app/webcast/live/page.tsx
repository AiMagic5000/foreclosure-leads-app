'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// The live webcast now lives inside the dashboard (/dashboard/live-webcast) so signed-in
// viewers stay in their account with the nav + hamburger. This public route just forwards
// there (preserving autoplay/welcome); the dashboard route is auth-gated, so cold visitors
// land on sign-in.
function Redirector() {
  const router = useRouter()
  const sp = useSearchParams()
  useEffect(() => {
    const qs = sp.toString()
    router.replace('/dashboard/live-webcast' + (qs ? `?${qs}` : ''))
  }, [router, sp])
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
