import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import nodemailer from '@/lib/nodemailer-relay-shim'

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const SMTP_USER = process.env.SMTP_USER || 'support@usforeclosureleads.com'
const SMTP_PASS = process.env.SMTP_PASS || ''
const NOTIFY_EMAILS = (process.env.WEBCAST_NOTIFY_EMAIL || 'xscore10@protonmail.com,coreypearsonemail@gmail.com')
  .split(',').map((e) => e.trim()).filter(Boolean)

// Bot user-agent patterns to filter out
const BOT_PATTERNS = /bot|crawl|spider|slurp|facebook|twitter|discord|telegram|whatsapp|preview|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|headless|phantom|selenium|puppeteer|playwright|curl|wget|python|java\/|go-http|node-fetch|axios/i

// In-memory cooldown: max 1 email per 2 minutes per page (serverless = per-instance, not perfect but good enough)
const lastEmailSent: Record<string, number> = {}
const COOLDOWN_MS = 120_000 // 2 minutes
const pendingVisits: Array<{ page: string; ip: string; referer: string; ua: string; utms: string; ts: string; who: string }> = []

function getDeviceType(ua: string): string {
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  if (/macintosh|mac os/i.test(ua)) return 'Mac'
  if (/windows/i.test(ua)) return 'Windows'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Unknown'
}

function getBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari'
  if (/firefox/i.test(ua)) return 'Firefox'
  return 'Other'
}

async function sendNotification(visits: typeof pendingVisits) {
  if (!SMTP_PASS || visits.length === 0) return

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  const rows = visits.map((v) => {
    const device = getDeviceType(v.ua)
    const browser = getBrowser(v.ua)
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:bold;color:${v.who === 'Anonymous' ? '#6b7280' : '#059669'}">${v.who}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:bold;color:#d4a84b">${v.page}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${v.ts}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${device} / ${browser}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${v.referer || 'Direct'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#888">${v.utms || '--'}</td>
      </tr>`
  }).join('')

  const count = visits.length
  const subject = count === 1
    ? `Webcast Visitor: ${visits[0].who !== 'Anonymous' ? visits[0].who + ' — ' : ''}${visits[0].page} (${getDeviceType(visits[0].ua)})`
    : `${count} Webcast Visitors in the last 2 minutes`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
      <div style="background:#09274c;padding:16px 24px;border-radius:8px 8px 0 0">
        <h2 style="color:#d4a84b;margin:0;font-size:18px">Webcast Traffic Alert</h2>
        <p style="color:#ffffff99;margin:4px 0 0;font-size:13px">${count} visitor${count > 1 ? 's' : ''} just hit your webcast pages</p>
      </div>
      <div style="background:#f9fafb;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#09274c;color:#fff">
              <th style="padding:8px 12px;text-align:left">Who</th>
              <th style="padding:8px 12px;text-align:left">Page</th>
              <th style="padding:8px 12px;text-align:left">Time</th>
              <th style="padding:8px 12px;text-align:left">Device</th>
              <th style="padding:8px 12px;text-align:left">Referrer</th>
              <th style="padding:8px 12px;text-align:left">UTMs</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#6b7280">
          This is an automated alert from your webcast funnel at usforeclosureleads.com.
          Real human visitors only -- bots are filtered out.
        </p>
      </div>
    </div>`

  for (const to of NOTIFY_EMAILS) {
    await transport.sendMail({
      from: `"Webcast Alerts" <${SMTP_USER}>`,
      to,
      subject,
      html,
    }).catch((e) => console.error('webcast track alert failed:', to, e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const page = body.page || '/webcast'
    const ua = req.headers.get('user-agent') || ''
    const referer = req.headers.get('referer') || body.referrer || ''
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    // Filter bots
    if (BOT_PATTERNS.test(ua)) {
      return NextResponse.json({ ok: true, filtered: 'bot' })
    }

    // Build UTM string
    const utms = [body.utm_source, body.utm_medium, body.utm_campaign].filter(Boolean).join(' / ')

    // Identify signed-in visitors (magic-link logins, account holders) so the
    // alert says WHO is on the page, not just a device.
    let who = 'Anonymous'
    try {
      const { userId } = getAuth(req)
      if (userId) {
        const user = await (await clerkClient()).users.getUser(userId)
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
        const email = user.emailAddresses?.[0]?.emailAddress || ''
        who = name && email ? `${name} (${email})` : name || email || 'Signed-in user'
      }
    } catch {
      /* identity is best-effort */
    }

    const visit = {
      page,
      ip,
      referer: referer.replace(/https?:\/\//, '').slice(0, 80),
      ua,
      utms,
      ts: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, month: 'short', day: 'numeric' }),
      who,
    }

    // Log to the visits table — the hourly digest cron (R740xd) emails counts.
    // Per-visit emails retired 2026-06-11 (too noisy at scale).
    void pendingVisits
    void lastEmailSent
    void COOLDOWN_MS
    void sendNotification
    await supabaseAdmin.from('webcast_visits').insert({
      page: visit.page,
      device: getDeviceType(ua),
      browser: getBrowser(ua),
      referer: visit.referer,
      utms: visit.utms || null,
      who,
    }).then(() => {}, () => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
