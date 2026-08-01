"use client"

import { useEffect, useState } from "react"

// Google blocks OAuth inside embedded webviews (Messenger, Instagram, Facebook,
// TikTok in-app browsers) with "403: disallowed_useragent". Email signup still
// works there — only the Google button dies. This banner catches those users
// before they hit the wall and shows them the way out to a real browser.
export function InAppBrowserBanner() {
  const [inApp, setInApp] = useState<null | "ios" | "android">(null)

  useEffect(() => {
    const ua = navigator.userAgent || ""
    const isInApp = /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|TikTok|BytedanceWebview/i.test(ua)
    if (!isInApp) return
    setInApp(/iPhone|iPad|iPod/i.test(ua) ? "ios" : "android")
  }, [])

  if (!inApp) return null

  const openInBrowser = () => {
    const url = window.location.href
    if (inApp === "android") {
      // Chrome intent escape — works in most Android in-app browsers
      window.location.href =
        "intent://" + url.replace(/^https?:\/\//, "") + "#Intent;scheme=https;package=com.android.chrome;end"
    } else {
      // iOS has no reliable programmatic escape; copy the link so the user can paste in Safari
      navigator.clipboard?.writeText(url).catch(() => {})
      alert("Link copied! Open Safari and paste it in the address bar.")
    }
  }

  return (
    <div className="bg-amber-50 border-b-2 border-amber-400 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Signing in with Google? Open this page in your browser first.</p>
      <p className="mt-1">
        Google blocks its sign-in inside the {inApp === "ios" ? "Messenger/Instagram" : "in-app"} browser.
        {inApp === "ios"
          ? " Tap the ••• menu (bottom right) and choose \"Open in Browser\" — or use your email below, which works right here."
          : " Tap the button below to open in Chrome — or use your email below, which works right here."}
      </p>
      <button
        onClick={openInBrowser}
        className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
      >
        {inApp === "android" ? "Open in Chrome" : "Copy link for Safari"}
      </button>
    </div>
  )
}
