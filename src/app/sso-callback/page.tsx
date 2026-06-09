"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

// Finalizes Google OAuth started from /webcast (and anywhere else), then sends the
// new user into the live webcast with the welcome flag so the email drips enroll.
export default function SSOCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1a" }}>
      <div className="flex items-center gap-3 text-white/70">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        Signing you in...
      </div>
      <AuthenticateWithRedirectCallback
        signUpForceRedirectUrl="/dashboard/live-webcast?autoplay=1&welcome=1"
        signInForceRedirectUrl="/dashboard/live-webcast?autoplay=1&welcome=1"
      />
    </div>
  )
}
