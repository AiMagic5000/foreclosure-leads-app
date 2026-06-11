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
])

export default clerkMiddleware(async (auth, req) => {
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
