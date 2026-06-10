import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import zlib from 'zlib'

/**
 * Fired by the /webcast/live redirector right after a magic-link ticket login.
 * Identifies the user from their freshly-created Clerk session (server-side, so
 * it can't be spoofed) and emails the admin inboxes that the lead logged in.
 */

const RELAY_URL = process.env.MAIL_RELAY_URL || 'https://www.assetrecoverybusiness.com/_api/usfr-relay.php'
const RELAY_TOKEN = process.env.MAIL_RELAY_TOKEN || ''
const NOTIFY_TO = ['xscore10@protonmail.com', 'support@usforeclosureleads.com']

function b64gz(s: string): string {
  return zlib.gzipSync(Buffer.from(s)).toString('base64')
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) return NextResponse.json({ ok: false }, { status: 401 })

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown'
    const email = user.emailAddresses?.[0]?.emailAddress || 'unknown'
    const when = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;max-width:560px">
      <div style="background:linear-gradient(135deg,#059669,#047857);padding:18px;border-radius:10px 10px 0 0"><h2 style="color:#fff;margin:0;font-size:18px">🔓 Magic Link Login — Lead Entered the Webcast</h2></div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:18px">
        <p style="margin:0 0 4px"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 4px"><strong>Email:</strong> ${email}</p>
        <p style="margin:0 0 4px"><strong>Logged in:</strong> ${when} (PT)</p>
        <p style="margin:8px 0 0;font-size:12px;color:#64748b">They clicked their one-tap login email and are now in the live webcast — hottest moment to follow up.</p>
      </div></div>`

    if (RELAY_TOKEN) {
      for (const to of NOTIFY_TO) {
        fetchRelay(to, name, email, html).catch((e) => console.error('login-notify relay failed:', e))
      }
      // Give the sends a moment to flush before the function freezes.
      await new Promise((r) => setTimeout(r, 1500))
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('login-notify error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

async function fetchRelay(to: string, name: string, email: string, html: string) {
  const res = await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-USFR-Relay-Token': RELAY_TOKEN },
    body: JSON.stringify({
      to,
      subject: `🔓 Webcast login: ${name} (${email})`,
      html_b64gz: b64gz(html),
      text_b64gz: b64gz(`Magic link login: ${name} (${email}) just entered the webcast.`),
      from_name: 'USFR Lead Notifications',
    }),
  })
  if (!res.ok) throw new Error(`relay ${res.status}`)
}
