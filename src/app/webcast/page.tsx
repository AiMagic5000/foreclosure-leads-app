'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, CheckCircle, Clock, Users, ArrowRight, Zap, MessageCircle, Lock } from 'lucide-react'
import { SCRIPTED_MESSAGES, getSessionOffset } from '@/data/webcast-scripted-chat'
import Hls from 'hls.js'

const BRAND = {
  navy: '#09274c',
  navyDark: '#050d1a',
  gold: '#d4a84b',
  white: '#ffffff',
  green: '#10b981',
}

function getSecondsUntilNextSlot(): number {
  const now = new Date()
  const min = now.getMinutes()
  const sec = now.getSeconds()
  if (min < 30) return (30 - min) * 60 - sec
  return (60 - min) * 60 - sec
}

function getNextSessionLabel(): string {
  const now = new Date()
  const min = now.getMinutes()
  const next = new Date(now)
  if (min < 30) {
    next.setMinutes(30, 0, 0)
  } else {
    next.setMinutes(0, 0, 0)
    next.setHours(next.getHours() + 1)
  }
  return next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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
        <p className="text-xs text-white/40">Register to join the conversation</p>
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
  const [remaining, setRemaining] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setRemaining(getSecondsUntilNextSlot())
    setMounted(true)
    const interval = setInterval(() => setRemaining(getSecondsUntilNextSlot()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return <div className="h-20 mb-6" />

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60

  return (
    <div className="mb-6 flex flex-col items-center">
      <p className="text-white/50 text-sm uppercase tracking-widest mb-2">Next Session Starts In</p>
      <div className="flex items-center gap-8 font-extrabold text-5xl md:text-7xl uppercase" style={{ fontFamily: "'Futura Condensed', 'Inter', sans-serif" }}>
        <span className="text-red-500 animate-pulse">LIVE IN</span>
        <span className="tabular-nums" style={{ color: BRAND.gold }}>
          {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}

function UrgencyBar() {
  const [viewers, setViewers] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [nextLabel, setNextLabel] = useState('')
  const [localTime, setLocalTime] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // All time calculations must run client-side only (Vercel SSR uses UTC)
    setViewers(34 + Math.floor(Math.random() * 20))
    setRemaining(getSecondsUntilNextSlot())
    setNextLabel(getNextSessionLabel())
    setLocalTime(getLocalTime())
    setMounted(true)

    const interval = setInterval(() => {
      setViewers((v) => Math.max(20, v + Math.floor(Math.random() * 7) - 3))
      setRemaining(getSecondsUntilNextSlot())
      setNextLabel(getNextSessionLabel())
      setLocalTime(getLocalTime())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60

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
          Next session: <span className="font-semibold" style={{ color: BRAND.gold }}>{nextLabel}</span>
          {' '}(<span className="font-mono tabular-nums" style={{ color: BRAND.gold }}>{String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}</span>)
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline font-bold text-sm" style={{ color: BRAND.gold }}>
          Claim your 50/50 partner account TODAY ONLY — just complete the form on this page
        </span>
        <span className="text-white/50 font-mono tabular-nums text-xs">{localTime}</span>
      </div>
    </div>
  )
}

export default function WebcastLandingPage() {
  return (
    <Suspense fallback={<div style={{ background: '#050d1a' }} className="min-h-screen" />}>
      <WebcastLandingContent />
    </Suspense>
  )
}

function WebcastLandingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)
  const chatContainerRef2 = useRef<HTMLDivElement>(null)

  // Sync chat height to form container height
  useEffect(() => {
    function syncHeight() {
      if (formContainerRef.current && chatContainerRef2.current) {
        const h = formContainerRef.current.offsetHeight
        chatContainerRef2.current.style.height = h + 'px'
      }
    }
    syncHeight()
    window.addEventListener('resize', syncHeight)
    return () => window.removeEventListener('resize', syncHeight)
  }, [])

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

  // No auto-redirect -- prospects must fill in the form to access the live session

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/webcast/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          email,
          phone: phone || undefined,
          smsConsent,
          honeypot,
          utmSource: searchParams.get('utm_source') || undefined,
          utmMedium: searchParams.get('utm_medium') || undefined,
          utmCampaign: searchParams.get('utm_campaign') || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      router.push(`/waiting-room?leadId=${data.leadId}&session=${data.sessionTime}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const offerItems = [
    'Live Webcast Access -- Next session starts soon',
    'Free Preview Account on usforeclosureleads.com',
    'See the Dashboard, Leads System & Outreach Tools',
    'Full Training Series Delivered to Your Inbox',
    'Partnership Program Details Revealed in Webcast',
    'Claim your 50/50 partner account TODAY ONLY — just complete the form on this page',
  ]

  return (
    <div style={{ background: BRAND.navyDark }} className="min-h-screen text-white">
      <UrgencyBar />

      {/* Hero */}
      <div
        className="pt-20 pb-12 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/webcast-hero-bg.webp)' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,13,26,0.55), rgba(5,13,26,0.85))' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-4"
            style={{ background: 'rgba(5,13,26,0.85)', color: BRAND.gold, border: '1px solid rgba(212,168,75,0.4)' }}
          >
            <Zap className="w-4 h-4" />
            LIVE SESSIONS EVERY 30 MINUTES
          </div>

          <HeroCountdown />

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 uppercase tracking-tight" style={{ fontFamily: "'Futura Condensed', 'Inter', sans-serif" }}>
            One of the Highest-Paying Independent Opportunities{' '}
            <span style={{ color: BRAND.gold }}>Most People Have Never Heard Of</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-4">
            Former homeowners leave millions behind every year. We show you exactly how to legally recover it.
          </p>

          <p className="text-white/50 mb-8">No license. No experience. No ceiling.</p>

          {/* Logo row: FRI logo | As Seen On | USFL logo */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mb-4 md:mb-2">
            <img
              src="/assets/foreclosure-recovery-inc-logo.png"
              alt="Foreclosure Recovery Inc"
              className="h-12 md:h-16 w-auto object-contain"
            />
            <img
              src="/assets/as-seen-on-dark.png"
              alt="As Seen On ABC, FOX, NBC, CBS, CW, Telemundo"
              className="hidden md:block h-16 w-auto object-contain rounded-lg"
              style={{ padding: '4px 12px' }}
            />
            <img
              src="/us-foreclosure-leads-logo.png"
              alt="US Foreclosure Leads"
              className="h-12 md:h-16 w-auto object-contain"
            />
          </div>
          {/* As Seen On -- full width on mobile, hidden on desktop (shown inline above) */}
          <div className="md:hidden flex justify-center mb-6 -mx-4">
            <img
              src="/assets/as-seen-on-dark.png"
              alt="As Seen On ABC, FOX, NBC, CBS, CW, Telemundo"
              className="w-full max-w-[100vw] h-auto object-contain rounded-lg"
              style={{ background: '#ffffff', padding: '6px 16px' }}
            />
          </div>
          <div className="hidden md:block" style={{ marginBottom: '5px' }} />
        </div>
      </div>

      {/* Main Content: Form + Video + Offer (left) | Live Chat (right) */}
      <div className="px-4 pb-20" style={{ marginTop: '0' }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_350px] gap-8" style={{ alignItems: 'start' }}>
          {/* Left: Registration Form + Locked Video Preview + Offer Stack */}
          <div className="space-y-10">
            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* Form */}
              <div
                ref={formContainerRef}
                className="rounded-2xl p-8 border order-2 md:order-1"
                style={{ background: 'rgba(9,39,76,0.6)', borderColor: 'rgba(212,168,75,0.3)' }}
              >
                <h2 className="text-2xl font-extrabold mb-6 text-center uppercase tracking-tight" style={{ fontFamily: "'Futura Condensed', 'Inter', sans-serif" }}>Reserve Your 50/50 Recovery Partner Account FREE</h2>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b] transition"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b] transition"
                />
                <input
                  type="tel"
                  placeholder="Phone (for free account setup + SMS)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b] transition"
                />

                {/* Honeypot */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-white/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    required
                    className="mt-0.5 rounded flex-shrink-0"
                  />
                  <span>
                    By checking this box, I expressly consent to receive communications from Foreclosure Recovery Inc., including emails, SMS/text messages, and pre-recorded or artificial voice messages (including ringless voicemail), at the email address and/or phone number provided above, using automated technology. I understand that my consent is not a condition of purchase and that I may revoke consent at any time by replying STOP to any text message or clicking unsubscribe in any email. Message frequency varies. Msg & data rates may apply. View our{' '}
                    <a href="/privacy" className="underline text-white/60 hover:text-white/80">Privacy Policy</a>{' '}and{' '}
                    <a href="/terms" className="underline text-white/60 hover:text-white/80">Terms of Service</a>.
                  </span>
                </label>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: BRAND.gold, color: BRAND.navy }}
                >
                  {loading ? (
                    <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <>
                      RESERVE MY FREE SPOT
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-white/50">
                <Shield className="w-4 h-4" />
                Your Free Preview Account Gets Created Automatically
              </div>
            </div>

            {/* Right col: Locked Video (small) + Offer Stack */}
            <div className="space-y-6 order-1 md:order-2">
              {/* Locked Video Preview -- fits column width */}
              <div className="w-full">
                <p className="text-red-500 font-bold uppercase tracking-widest animate-pulse text-center w-full" style={{ marginBottom: '5px', fontSize: '1.35rem', letterSpacing: '0.25em' }}>Current Live Session</p>
                <LockedVideoPreview />
              </div>

              <h3
                className="text-xl font-bold mb-4 uppercase tracking-wider"
                style={{ color: BRAND.gold }}
              >
                What You Get When You Sign Up (Free)
              </h3>
              <div className="space-y-4">
                {offerItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: BRAND.green }} />
                    <span className="text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>

          </div>

          {/* Right: Live Chat Preview (desktop) -- matches left column height */}
          <div ref={chatContainerRef2} className="hidden lg:block rounded-2xl overflow-hidden border border-white/10" style={{ position: 'sticky', top: '50px' }}>
            <LiveChatPreview />
          </div>
        </div>

        {/* Live Chat Preview (mobile/tablet -- below form content) */}
        <div className="lg:hidden max-w-6xl mx-auto mt-8 h-[400px] rounded-2xl overflow-hidden border border-white/10">
          <LiveChatPreview />
        </div>

        {/* Reviews -- full width, 2 rows */}
        <div className="max-w-6xl mx-auto mt-16">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-6 text-center">What People Are Saying</p>
          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            {[
              { img: '/assets/headshot-marcus.png', name: 'Marcus T.', location: 'Virginia', quote: '$23,400 on my first deal. I never thought this was real until the check cleared.', amount: '$23,400' },
              { img: '/assets/headshot-sandra.png', name: 'Sandra R.', location: 'Alabama', quote: 'I had no idea this existed. Signed up on a whim and recovered funds within 60 days.', amount: '$18,200' },
              { img: '/assets/headshot-mike.png', name: 'Mike S.', location: 'Georgia', quote: '47k in one deal. This changed everything for my family.', amount: '$47,000' },
            ].map((r, i) => (
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
                <p className="text-sm text-white/70 italic leading-relaxed mb-4">"{r.quote}"</p>
                <div className="mt-auto pt-3 border-t border-white/10 w-full">
                  <p className="text-sm font-semibold text-white/90">{r.name}</p>
                  <p className="text-xs text-white/40">{r.location}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Row 2: 2 cards centered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[calc(66.666%+0.625rem)] mx-auto">
            {[
              { img: '/assets/headshot-lisa.png', name: 'Lisa W.', location: 'Mississippi', quote: 'I was skeptical at first but closed my second case in under 45 days. $31K recovered for a family who had no idea they were owed money.', amount: '$31,000' },
              { img: '/assets/headshot-carlos.png', name: 'Carlos M.', location: 'Arizona', quote: 'The leads and tools made it simple. Filed three claims my first month and two already paid out.', amount: '$52,800' },
            ].map((r, i) => (
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
                <p className="text-sm text-white/70 italic leading-relaxed mb-4">"{r.quote}"</p>
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
            <a href="/terms" className="text-white/50 hover:text-white/80 transition-colors">
              Terms of Service
            </a>
            <span className="text-white/20">|</span>
            <a href="/privacy" className="text-white/50 hover:text-white/80 transition-colors">
              Privacy Policy
            </a>
            <span className="text-white/20">|</span>
            <a href="/income-disclaimer" className="text-white/50 hover:text-white/80 transition-colors">
              Income Disclaimer
            </a>
          </div>

          <div className="max-w-3xl mx-auto mb-8 px-4">
            <p className="text-[11px] leading-relaxed text-white/30">
              <strong className="text-white/40">Income Disclaimer:</strong> The results shared on this page and in our webcast are individual experiences and are not typical. There is no guarantee that you will earn any specific amount of money using our information, tools, strategies, or lead data. Your results will vary based on your effort, experience, market conditions, and many other factors. Many participants earn little to no money. All business ventures involve risk. See our full <a href="/income-disclaimer" className="underline text-white/40 hover:text-white/60">Income & Earnings Disclaimer</a> for complete details. This is not financial, legal, or professional advice.
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
