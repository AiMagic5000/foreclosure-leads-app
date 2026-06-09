'use client'

// Google Ads conversion firing (browser). No-ops if gtag hasn't loaded.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// send_to = "AW-<conversion_id>/<conversion_label>" for the Webcast Registration action.
const WEBCAST_SEND_TO =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_WEBCAST_LABEL ||
  'AW-17115352419/3-2ECIvd3LocEOOanuE_'

export function trackGoogleWebcastConversion() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', 'conversion', { send_to: WEBCAST_SEND_TO })
}
