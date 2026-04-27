import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/states-guide(.*)',
  '/faq',
  '/privacy',
  '/terms',
  '/income-disclaimer',
  '/compliance',
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
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|mp4|mp3|wav|ogg|webm|mov|avi|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}
