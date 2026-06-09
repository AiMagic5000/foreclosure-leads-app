'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Zap, MessageCircle } from 'lucide-react'
import { WebcastEmailGate } from '@/components/webcast/email-gate'
import { SCRIPTED_MESSAGES, getSessionOffset } from '@/data/webcast-scripted-chat'
import Hls from 'hls.js'

const BRAND = {
  navy: '#09274c',
  navyDark: '#050d1a',
  gold: '#d4a84b',
  white: '#ffffff',
  green: '#10b981',
}

function getLocalTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
}

interface ChatMsg {
  id: string
  sender_name: string
  sender_type: string
  message: string
}

// Read-only chat preview showing the live session's conversation
function LiveChatPreview() {
  const offsetRef = useRef(getSessionOffset())

  const [messages, setMessages] = useState<ChatMsg[]>(() =>
    SCRIPTED_MESSAGES
      .filter((m) => m.trigger_second <= offsetRef.current)
      .map((m) => ({
        id: `s-${m.trigger_second}`,
        sender_name: m.sender_name,
        sender_type: m.sender_type || 'attendee',
        message: m.message,
      }))
  )

  // Schedule future messages based on session offset
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const offset = offsetRef.current

    SCRIPTED_MESSAGES.filter((m) => m.trigger_second > offset).forEach((m) => {
      const jitter = m.sender_type === 'moderator_ai' ? (Math.random() * 3000 + 2000) : (Math.random() * 6000 - 3000)
      const delay = (m.trigger_second - offset) * 1000 + jitter

      const timer = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `s-${m.trigger_second}`,
            sender_name: m.sender_name,
            sender_type: m.sender_type || 'attendee',
            message: m.message,
          },
        ])
      }, Math.max(0, delay))
      timers.push(timer)
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  // Auto-scroll only if user is near the bottom (not reading earlier messages)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    if (distanceFromBottom < 120) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(5,13,26,0.95)' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 shrink-0">
        <MessageCircle className="w-4 h-4" style={{ color: BRAND.gold }} />
        <span className="font-semibold text-sm text-white">LIVE CHAT</span>
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1" />
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-2 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: msg.sender_type === 'moderator_ai' ? BRAND.green : 'rgba(255,255,255,0.15)',
                color: msg.sender_type === 'moderator_ai' ? BRAND.navy : BRAND.white,
              }}
            >
              {msg.sender_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span
                className="font-semibold text-sm"
                style={{ color: msg.sender_type === 'moderator_ai' ? BRAND.green : 'rgba(255,255,255,0.7)' }}
              >
                {msg.sender_name}
              </span>
              {msg.sender_type === 'moderator_ai' && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-green-900/40 text-green-400 ml-1.5">MOD</span>
              )}
              <p className="text-sm text-white/80 mt-0.5">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-white/10 shrink-0 text-center">
        <p className="text-xs text-white/40">Sign up free to join the conversation</p>
      </div>
    </div>
  )
}

const HLS_URL = 'https://stream.usforeclosureleads.com/webcast.m3u8'

function LockedVideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, startLevel: 0, maxBufferLength: 10 })
      hls.loadSource(HLS_URL)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.currentTime = getSessionOffset()
        video.muted = true
        video.play().catch(() => {})
      })
      return () => hls.destroy()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_URL
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = getSessionOffset()
        video.muted = true
        video.play().catch(() => {})
      }, { once: true })
    }
  }, [])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video">
      <video
        ref={videoRef}
        className="w-full h-full object-cover brightness-75"
        playsInline
        muted
        autoPlay
        loop
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        disablePictureInPicture
        style={{ pointerEvents: 'none' }}
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}

function HeroCountdown() {
  const [secs, setSecs] = useState(10)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return <div className="h-12 mb-4" />

  return (
    <div className="mb-5 inline-flex items-center gap-3 rounded-xl border border-red-500/30 bg-black/30 px-4 py-2">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70 animate-ping" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
      </span>
      <span className="text-white/70 text-sm uppercase tracking-widest">
        {secs > 0 ? "Your session starts in" : "Your session is starting"}
      </span>
      {secs > 0 && (
        <span className="font-extrabold text-2xl tabular-nums" style={{ color: BRAND.gold }}>
          0:{String(secs).padStart(2, "0")}
        </span>
      )}
    </div>
  )
}

function UrgencyBar() {
  const [viewers, setViewers] = useState(0)
  const [localTime, setLocalTime] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // All time calculations must run client-side only (Vercel SSR uses UTC)
    setViewers(34 + Math.floor(Math.random() * 20))
    setLocalTime(getLocalTime())
    setMounted(true)

    const interval = setInterval(() => {
      setViewers((v) => Math.max(20, v + Math.floor(Math.random() * 7) - 3))
      setLocalTime(getLocalTime())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return (
      <div style={{ background: BRAND.navy }} className="fixed top-0 left-0 right-0 z-50 px-4 py-2 h-10" />
    )
  }

  return (
    <div
      style={{ background: BRAND.navy }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between text-sm"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 font-bold">LIVE</span>
        </span>
        <span className="text-white/70">{Math.round(viewers)} watching</span>
        <span className="text-white/40 hidden sm:inline">|</span>
        <span className="text-white/70 hidden sm:inline">
          Your live session <span className="font-semibold" style={{ color: BRAND.gold }}>starts the moment you sign up</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline font-bold text-sm" style={{ color: BRAND.gold }}>
          Sign up free &mdash; claim your Owner Operator Account, keep 100% commissions!
        </span>
        <span className="text-white/50 font-mono tabular-nums text-xs">{localTime}</span>
      </div>
    </div>
  )
}

const REVIEWS_ROW1 = [
  { img: '/assets/headshot-marcus.png', name: 'Marcus T.', location: 'Virginia', quote: '$23,400 on my first deal. I never thought this was real until the check cleared.', amount: '$23,400' },
  { img: '/assets/headshot-sandra.png', name: 'Sandra R.', location: 'Alabama', quote: 'I had no idea this existed. Signed up on a whim and recovered funds within 60 days.', amount: '$18,200' },
  { img: '/assets/headshot-mike.png', name: 'Mike S.', location: 'Georgia', quote: '47k in one deal. This changed everything for my family.', amount: '$47,000' },
]
const REVIEWS_ROW2 = [
  { img: '/assets/headshot-lisa.png', name: 'Lisa W.', location: 'Mississippi', quote: 'I was skeptical at first but closed my second case in under 45 days. $31K recovered for a family who had no idea they were owed money.', amount: '$31,000' },
  { img: '/assets/headshot-carlos.png', name: 'Carlos M.', location: 'Arizona', quote: 'The leads and tools made it simple. Filed three claims my first month and two already paid out.', amount: '$52,800' },
]

export default function WebcastLandingPage() {
  return (
    <Suspense fallback={<div style={{ background: '#050d1a' }} className="min-h-screen" />}>
      <WebcastLandingContent />
    </Suspense>
  )
}

function WebcastLandingContent() {
  const searchParams = useSearchParams()

  // Track page view for email notifications
  useEffect(() => {
    fetch('/api/webcast/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: '/webcast',
        referrer: document.referrer,
        utm_source: searchParams.get('utm_source') || '',
        utm_medium: searchParams.get('utm_medium') || '',
        utm_campaign: searchParams.get('utm_campaign') || '',
      }),
    }).catch(() => {})
  }, [searchParams])

  const offerItems = [
    'Free preview account on usforeclosureleads.com',
    'See the dashboard, leads system, and outreach tools',
    'The full training series, unlocked from day one',
    'Live webcast access, next session starts soon',
    'Your 50/50 recovery partner account, today only',
  ]

  return (
    <div style={{ background: BRAND.navyDark }} className="min-h-screen text-white">
      <UrgencyBar />

      {/* Hero — signup above the fold */}
      <div
        className="pt-16 pb-12 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/webcast-hero-bg.webp)' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,13,26,0.6), rgba(5,13,26,0.9))' }} />
        <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-[1.05fr_440px] gap-8 lg:gap-12 items-center">
          {/* Left: copy + proof */}
          <div className="text-center lg:text-left">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{ background: 'rgba(5,13,26,0.85)', color: BRAND.gold, border: '1px solid rgba(212,168,75,0.4)' }}
            >
              <Zap className="w-4 h-4" />
  YOUR FREE LIVE SESSION &mdash; STARTS NOW
            </div>

            <HeroCountdown />

            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 uppercase tracking-tight" style={{ fontFamily: "'Futura Condensed', 'Inter', sans-serif" }}>
              One of the Highest-Paying Opportunities{' '}
              <span style={{ color: BRAND.gold }}>Most People Have Never Heard Of</span>
            </h1>

            <p className="text-base md:text-lg text-white/70 max-w-xl mx-auto lg:mx-0 mb-2">
              Former homeowners leave millions behind every year. We show you exactly how to legally recover it.
            </p>
            <p className="text-white/50 mb-6">No license. No experience. No ceiling.</p>

            <div className="space-y-2.5 max-w-md mx-auto lg:mx-0">
              {offerItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-left">
                  <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: BRAND.green }} />
                  <span className="text-white/90 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 mt-7">
              <img src="/assets/foreclosure-recovery-inc-logo.png" alt="Foreclosure Recovery Inc" className="h-10 md:h-12 w-auto object-contain" />
              <img src="/us-foreclosure-leads-logo.png" alt="US Foreclosure Leads" className="h-10 md:h-12 w-auto object-contain" />
            </div>
            <div className="flex justify-center lg:justify-start mt-4">
              <img
                src="/assets/as-seen-on-dark.png"
                alt="As Seen On ABC, FOX, NBC, CBS, CW, Telemundo"
                className="h-12 w-auto object-contain rounded-lg bg-white"
                style={{ padding: '4px 12px' }}
              />
            </div>
          </div>

          {/* Right: Clerk signup card — above the fold, Google + email, no phone */}
          <div id="signup" className="w-full">
            <div className="rounded-2xl overflow-hidden bg-white shadow-2xl">
              <div className="px-6 py-5 text-center" style={{ background: `linear-gradient(90deg, ${BRAND.navyDark}, ${BRAND.navy}, ${BRAND.navyDark})` }}>
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-300 text-[10px] font-bold tracking-[0.14em] uppercase">$0 &middot; No card &middot; No phone required</span>
                </div>
                <h2 className="text-white font-extrabold text-2xl tracking-tight">Sign Up Free</h2>
                <p className="text-blue-200/70 text-sm mt-1">Instant dashboard access. Live session included.</p>
              </div>
              <div className="px-5 sm:px-8 py-7 flex justify-center">
                <div className="w-full max-w-[400px]">
                  <WebcastEmailGate />
                </div>
              </div>
            </div>
            {/* 3-line legal */}
            <p className="mt-3 text-center text-[11px] leading-relaxed text-white/45">
              By signing up you agree to our <a href="/terms" className="underline hover:text-white/70">Terms</a> and <a href="/privacy" className="underline hover:text-white/70">Privacy Policy</a>.
              We email your free training and live webcast access &mdash; no phone required.
              Add a number later only if you want SMS reminders. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Below the fold: live session preview + chat */}
      <div className="px-4 pb-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_350px] gap-8" style={{ alignItems: 'start' }}>
          <div className="space-y-6">
            <div>
              <p className="text-red-500 font-bold uppercase tracking-widest animate-pulse text-center lg:text-left w-full" style={{ marginBottom: '8px', fontSize: '1.1rem', letterSpacing: '0.22em' }}>
                Current Live Session
              </p>
              <LockedVideoPreview />
              <p className="text-center text-white/50 text-sm mt-3">
                Sign up free above to unlock sound and join the live session in progress.
              </p>
            </div>
          </div>

          {/* Live Chat Preview (desktop) */}
          <div className="hidden lg:block rounded-2xl overflow-hidden border border-white/10 h-[520px]">
            <LiveChatPreview />
          </div>
        </div>

        {/* Live Chat Preview (mobile/tablet) */}
        <div className="lg:hidden max-w-6xl mx-auto mt-8 h-[400px] rounded-2xl overflow-hidden border border-white/10">
          <LiveChatPreview />
        </div>

        {/* Reviews — full width, 2 rows */}
        <div className="max-w-6xl mx-auto mt-16">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-6 text-center">What People Are Saying</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            {REVIEWS_ROW1.map((r, i) => (
              <div
                key={i}
                className="relative rounded-2xl p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(145deg, rgba(9,39,76,0.8) 0%, rgba(5,13,26,0.9) 100%)',
                  border: '1px solid rgba(212,168,75,0.2)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div className="absolute -top-1 right-4 px-2 py-0.5 rounded-b-md text-[10px] font-bold tracking-wider" style={{ background: BRAND.gold, color: BRAND.navy }}>
                  RECOVERED
                </div>
                <div className="w-16 h-16 rounded-full overflow-hidden mb-4" style={{ boxShadow: `0 0 0 2px ${BRAND.navy}, 0 0 0 4px ${BRAND.gold}` }}>
                  <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-2xl font-extrabold mb-2" style={{ color: BRAND.gold }}>{r.amount}</p>
                <p className="text-sm text-white/70 italic leading-relaxed mb-4">&quot;{r.quote}&quot;</p>
                <div className="mt-auto pt-3 border-t border-white/10 w-full">
                  <p className="text-sm font-semibold text-white/90">{r.name}</p>
                  <p className="text-xs text-white/40">{r.location}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[calc(66.666%+0.625rem)] mx-auto">
            {REVIEWS_ROW2.map((r, i) => (
              <div
                key={i}
                className="relative rounded-2xl p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(145deg, rgba(9,39,76,0.8) 0%, rgba(5,13,26,0.9) 100%)',
                  border: '1px solid rgba(212,168,75,0.2)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div className="absolute -top-1 right-4 px-2 py-0.5 rounded-b-md text-[10px] font-bold tracking-wider" style={{ background: BRAND.gold, color: BRAND.navy }}>
                  RECOVERED
                </div>
                <div className="w-16 h-16 rounded-full overflow-hidden mb-4" style={{ boxShadow: `0 0 0 2px ${BRAND.navy}, 0 0 0 4px ${BRAND.gold}` }}>
                  <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-2xl font-extrabold mb-2" style={{ color: BRAND.gold }}>{r.amount}</p>
                <p className="text-sm text-white/70 italic leading-relaxed mb-4">&quot;{r.quote}&quot;</p>
                <div className="mt-auto pt-3 border-t border-white/10 w-full">
                  <p className="text-sm font-semibold text-white/90">{r.name}</p>
                  <p className="text-xs text-white/40">{r.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-4" style={{ background: 'rgba(5,13,26,0.95)' }}>
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <a href="/terms" className="text-white/50 hover:text-white/80 transition-colors">Terms of Service</a>
            <span className="text-white/20">|</span>
            <a href="/privacy" className="text-white/50 hover:text-white/80 transition-colors">Privacy Policy</a>
            <span className="text-white/20">|</span>
            <a href="/income-disclaimer" className="text-white/50 hover:text-white/80 transition-colors">Income Disclaimer</a>
          </div>

          <div className="max-w-3xl mx-auto mb-8 px-4">
            <p className="text-[11px] leading-relaxed text-white/30">
              <strong className="text-white/40">Income Disclaimer:</strong> The results shared on this page and in our webcast are individual experiences and are not typical. There is no guarantee that you will earn any specific amount of money using our information, tools, strategies, or lead data. Your results will vary based on your effort, experience, market conditions, and many other factors. Many participants earn little to no money. All business ventures involve risk. See our full <a href="/income-disclaimer" className="underline text-white/40 hover:text-white/60">Income &amp; Earnings Disclaimer</a> for complete details. This is not financial, legal, or professional advice.
            </p>
          </div>

          <p className="text-xs text-white/30 mb-2">
            &copy; {new Date().getFullYear()} Foreclosure Recovery Inc. All rights reserved.
          </p>
          <p className="text-[10px] text-white/20 max-w-xl mx-auto">
            No part of this website, webcast, or any associated content may be reproduced, distributed, or transmitted in any form without the express written permission of Foreclosure Recovery Inc.
          </p>
        </div>
      </footer>
    </div>
  )
}
