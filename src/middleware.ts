import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/pricing',
  '/states-guide(.*)',
  '/faq',
  '/privacy',
  '/terms',
  '/income-disclaimer',
  '/compliance',
  '/unsubscribe(.*)',
  '/blocked',
  '/blog',
  '/webcast(.*)',
  '/waiting-room(.*)',
  '/thank-you(.*)',
  '/apply(.*)',
  '/lander(.*)',
  '/talks(.*)',
  '/training(.*)',
  '/api/webhook(.*)',
  '/api/cron(.*)',
  '/api/webcast(.*)',
  '/api/subscribe',
  '/api/sw(.*)',
  '/api/chat', // public support chatbot — anonymous homeowners must reach it (else auth.protect 404s)
  '/api/arb(.*)', // assetrecoverybusiness.com is a static site posting cross-origin; the buyer has
                  // already paid and is not a platform user, so this cannot require auth
])

// Maintenance gate: set MAINTENANCE_MODE=1 in Vercel env (+ redeploy) while the
// database server is down. Serves a self-contained page for dashboard/API routes
// so logged-in users see "we'll be right back" instead of raw DB errors.
// Marketing pages stay live. Webhooks excluded — Stripe/Clerk retry on 503 anyway.
const MAINTENANCE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60"><title>Scheduled Maintenance | US Foreclosure Leads</title></head><body style="margin:0"><div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px"><div style="max-width:560px;width:100%;background:#fff;border-radius:16px;padding:44px 40px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.45)"><div style="font-size:18px;font-weight:700;margin-bottom:22px">&#129413; <span style="color:#dc2626">Foreclosure Recovery</span> <span style="color:#111827">Inc.</span></div><h1 style="color:#111827;font-size:30px;margin:0 0 14px;font-weight:800">We'll be right back.</h1><p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 20px">We're performing scheduled database maintenance to keep your dashboard fast and reliable. Your account and your leads are safe.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;color:#334155;font-size:14px;margin-bottom:26px">Expected downtime: under 1 hour. This page refreshes automatically.</div><a href="sms:+17252902778" style="display:block;background:#dc2626;color:#fff;font-weight:700;font-size:16px;padding:15px 20px;border-radius:8px;text-decoration:none;margin-bottom:12px">Text us: (725) 290-2778</a><a href="https://www.facebook.com/profile.php?id=61573366966623" style="display:block;background:#111827;color:#fff;font-weight:700;font-size:16px;padding:15px 20px;border-radius:8px;text-decoration:none;margin-bottom:24px">Message us on Facebook</a><p style="color:#94a3b8;font-size:13px;margin:0 0 8px">Need us in the meantime? Email <a href="mailto:support@usforeclosureleads.com" style="color:#2563eb;text-decoration:none">support@usforeclosureleads.com</a></p><p style="color:#94a3b8;font-size:13px;margin:0">Your account and data are safe. This page refreshes automatically.</p></div></div></body></html>`

export default clerkMiddleware(async (auth, req) => {
  if (process.env.MAINTENANCE_MODE === '1') {
    const p = req.nextUrl.pathname
    if ((p.startsWith('/dashboard') || p.startsWith('/api')) && !p.startsWith('/api/webhook')) {
      return new NextResponse(MAINTENANCE_HTML, {
        status: 503,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'retry-after': '1800',
          'cache-control': 'no-store',
        },
      })
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // The lead form's "View website" button (immutable on the published form)
  // points at the homepage. Those clicks always open in Facebook's in-app
  // browser, so homepage hits from FB go straight to the no-login live room.
  if (req.nextUrl.pathname === '/') {
    const ua = req.headers.get('user-agent') || ''
    const referer = req.headers.get('referer') || ''
    const fromFbApp = /FB_IAB|FBAN|FBAV|FB4A|FBIOS/i.test(ua)
    const fromFbWeb = /facebook\.com|fb\.com/i.test(referer)
    if (fromFbApp || fromFbWeb) {
      const dest = req.nextUrl.clone()
      dest.pathname = '/webcast/livefb'
      return NextResponse.redirect(dest)
    }
  }

  const response = NextResponse.next()

  if (req.nextUrl.pathname === '/webcast/live') {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://assetrecoverybusiness.com https://usforeclosureleads.com")
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf|docx?|xlsx?|pptx?|zip|webmanifest|xml|mp4|mp3|wav|ogg|webm|mov|avi|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}
