'use client'

// Browser-side Meta Pixel helpers. Safe to call anywhere — they no-op when the
// pixel script hasn't loaded (env not set).

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : undefined
}

export const getFbp = (): string | undefined => getCookie('_fbp')
export const getFbc = (): string | undefined => getCookie('_fbc')

export function genEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'evt_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Fire a deduplicated Lead. Pass the same eventId to the server CAPI call so Meta
// collapses the browser + server copies into one conversion.
export function trackLead(eventId: string, custom?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', 'Lead', custom || {}, { eventID: eventId })
}
