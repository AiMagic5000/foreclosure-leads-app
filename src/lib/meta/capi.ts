import crypto from 'crypto'

// Meta Conversions API (server-side events). No-ops safely when env is absent,
// so the app is safe to deploy before the pixel/token exist.
const PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '826118017015360'
const CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || ''
const API_VERSION = process.env.META_GRAPH_VERSION || 'v21.0'
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || ''

export function metaCapiConfigured(): boolean {
  return Boolean(PIXEL_ID && CAPI_TOKEN)
}

function sha256(value?: string | null): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, '')
  if (!digits) return undefined
  return crypto.createHash('sha256').update(digits).digest('hex')
}

export interface LeadEventInput {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  // Same id must be passed to the browser pixel `eventID` so Meta dedupes
  // the browser + server copies of the same conversion.
  eventId?: string
  eventName?: string
  eventSourceUrl?: string
  clientIp?: string | null
  userAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  actionSource?: 'website' | 'system_generated'
}

export async function sendMetaLeadEvent(
  input: LeadEventInput
): Promise<{ ok: boolean; error?: string }> {
  if (!metaCapiConfigured()) return { ok: false, error: 'capi_not_configured' }

  const userData: Record<string, unknown> = {}
  const em = sha256(input.email)
  if (em) userData.em = [em]
  const ph = hashPhone(input.phone)
  if (ph) userData.ph = [ph]
  const fn = sha256(input.firstName)
  if (fn) userData.fn = [fn]
  const ln = sha256(input.lastName)
  if (ln) userData.ln = [ln]
  if (input.clientIp) userData.client_ip_address = input.clientIp
  if (input.userAgent) userData.client_user_agent = input.userAgent
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc

  const event: Record<string, unknown> = {
    event_name: input.eventName || 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    action_source: input.actionSource || 'website',
    user_data: userData,
  }
  if (input.eventId) event.event_id = input.eventId
  if (input.eventSourceUrl) event.event_source_url = input.eventSourceUrl

  const payload: Record<string, unknown> = { data: [event] }
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `meta_capi_${res.status}: ${text.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'capi_fetch_failed' }
  }
}

// Convenience: pull fbp/fbc click-id cookies off an incoming request (first-party,
// set by the browser pixel on the same domain).
export function readFbCookies(cookieHeader?: string | null): { fbp?: string; fbc?: string } {
  if (!cookieHeader) return {}
  const get = (name: string) => {
    const m = cookieHeader.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : undefined
  }
  return { fbp: get('_fbp'), fbc: get('_fbc') }
}
