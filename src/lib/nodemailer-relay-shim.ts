import zlib from 'zlib'

/**
 * Drop-in replacement for `import nodemailer from "nodemailer"` on Vercel.
 *
 * Vercel's serverless runtime cannot reach SMTP hosts (getaddrinfo EBUSY), so
 * every direct nodemailer send was failing silently. This shim keeps the
 * nodemailer surface (`createTransport().sendMail({from,to,subject,html,text})`)
 * but delivers over HTTPS through the tradelinejet PHP -> MXRoute relay.
 *
 * Swap `import nodemailer from "nodemailer"` for
 * `import nodemailer from "@/lib/nodemailer-relay-shim"` — nothing else changes.
 */

const RELAY_URL = process.env.MAIL_RELAY_URL || 'https://www.assetrecoverybusiness.com/_api/usfr-relay.php'
const RELAY_TOKEN = process.env.MAIL_RELAY_TOKEN || ''

type Address = string | { name?: string; address: string }

interface SendMailOptions {
  from?: Address
  to?: Address | Address[]
  subject?: string
  html?: string
  text?: string
  replyTo?: Address
  [key: string]: unknown
}

function parseAddress(a?: Address): { name: string; email: string } {
  if (!a) return { name: '', email: '' }
  if (typeof a === 'object') return { name: a.name || '', email: a.address }
  const m = a.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/)
  if (m) return { name: m[1].trim(), email: m[2].trim() }
  return { name: '', email: a.trim() }
}

function toList(to?: Address | Address[]): string[] {
  if (!to) return []
  const arr: Address[] = Array.isArray(to) ? to : [to]
  const expanded: Address[] = []
  for (const a of arr) {
    if (typeof a === 'string') {
      for (const part of a.split(',')) expanded.push(part)
    } else {
      expanded.push(a)
    }
  }
  return expanded.map((a) => parseAddress(a).email).filter(Boolean)
}

function b64gz(s: string): string {
  return zlib.gzipSync(Buffer.from(s)).toString('base64')
}

async function relaySend(opts: SendMailOptions): Promise<{ messageId: string; accepted: string[]; rejected: string[] }> {
  if (!RELAY_TOKEN) throw new Error('MAIL_RELAY_TOKEN not configured')
  const from = parseAddress(opts.from)
  const recipients = toList(opts.to)
  if (recipients.length === 0) throw new Error('sendMail: no recipients')

  let lastId = ''
  for (const to of recipients) {
    const body: Record<string, unknown> = {
      to,
      subject: opts.subject || '',
      from_email: from.email || 'support@usforeclosureleads.com',
      from_name: from.name || 'US Foreclosure Leads',
    }
    if (opts.html) body.html_b64gz = b64gz(String(opts.html))
    if (opts.text) body.text_b64gz = b64gz(String(opts.text))
    if (!opts.html && !opts.text) body.text_b64gz = b64gz('')
    const reply = parseAddress(opts.replyTo)
    if (reply.email) body.reply_to = reply.email

    const res = await fetch(RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-USFR-Relay-Token': RELAY_TOKEN },
      body: JSON.stringify(body),
    })
    const textRes = await res.text()
    if (!res.ok) throw new Error(`mail relay ${res.status}: ${textRes.slice(0, 200)}`)
    try {
      lastId = (JSON.parse(textRes) as { message_id?: string }).message_id || ''
    } catch {
      lastId = ''
    }
  }
  return { messageId: lastId, accepted: recipients, rejected: [] }
}

function createTransport(_config?: unknown) {
  void _config // SMTP config ignored — delivery goes via the HTTPS relay
  return {
    sendMail: (opts: SendMailOptions) => relaySend(opts),
    verify: async () => true,
  }
}

const nodemailerShim = { createTransport }
export default nodemailerShim
export { createTransport }
