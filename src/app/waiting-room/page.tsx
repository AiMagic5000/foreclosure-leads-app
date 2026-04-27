'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap } from 'lucide-react'

const BRAND = {
  navy: '#09274c',
  navyDark: '#050d1a',
  gold: '#d4a84b',
  white: '#ffffff',
  green: '#10b981',
}

const SOCIAL_PROOF_MESSAGES = [
  'Sarah just claimed her free leads account',
  'Marcus just registered for the next session',
  'Lisa just applied for the partnership offer',
  'Kevin just activated his outreach automations',
  'Angela just logged into her free leads account',
  'Derek just signed up and received 25 free leads',
  'Priya just started her first campaign',
  'Ryan just submitted a partnership application',
]

function FlipDigit({ value }: { value: string }) {
  return (
    <div
      className="w-16 h-20 md:w-24 md:h-28 rounded-lg flex items-center justify-center text-4xl md:text-6xl font-mono font-bold"
      style={{ background: 'rgba(9,39,76,0.8)', color: BRAND.gold, border: '1px solid rgba(212,168,75,0.3)' }}
    >
      {value}
    </div>
  )
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={<div style={{ background: '#050d1a' }} className="min-h-screen" />}>
      <WaitingRoomContent />
    </Suspense>
  )
}

function WaitingRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId')
  const sessionParam = searchParams.get('session')

  const [sessionTime] = useState<Date>(() => {
    if (sessionParam) return new Date(sessionParam)
    const now = new Date()
    const mins = now.getMinutes()
    const next = new Date(now)
    if (mins < 30) { next.setMinutes(30, 0, 0) } else { next.setMinutes(0, 0, 0); next.setHours(next.getHours() + 1) }
    return next
  })

  const [remaining, setRemaining] = useState(0)
  const [socialIndex, setSocialIndex] = useState(0)
  const [canEnter, setCanEnter] = useState(false)

  const updateCountdown = useCallback(() => {
    const secs = Math.max(0, Math.floor((sessionTime.getTime() - Date.now()) / 1000))
    setRemaining(secs)
    setCanEnter(secs <= 120)
    if (secs <= 0) {
      router.push(`/webcast/live?leadId=${leadId || ''}`)
    }
  }, [sessionTime, leadId, router])

  useEffect(() => {
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [updateCountdown])

  useEffect(() => {
    const interval = setInterval(() => {
      setSocialIndex((i) => (i + 1) % SOCIAL_PROOF_MESSAGES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const hours = String(Math.floor(remaining / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')

  const sessionLabel = sessionTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div
      style={{ background: BRAND.navyDark }}
      className="min-h-screen flex flex-col text-white relative overflow-hidden"
    >
      {/* Apply to be an Agent bar */}
      <div
        className="w-full px-4 py-3 shrink-0"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy}, #0d3668)`, borderBottom: `2px solid ${BRAND.gold}` }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">
              <Zap className="w-3 h-3" /> TODAY ONLY
            </span>
            <span className="font-bold text-sm sm:text-base">50/50 Partnership with Corey -- Become an Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-red-400 font-bold text-sm animate-pulse">Only 6 spots left</span>
            <a
              href="/webcast/live"
              className="px-5 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition hover:opacity-90"
              style={{ background: BRAND.gold, color: BRAND.navy }}
            >
              APPLY FOR PARTNERSHIP
            </a>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
      {/* Particle dots background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: BRAND.gold,
              opacity: Math.random() * 0.3 + 0.1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Welcome back</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-2">Your Seat Is Reserved</h1>
        <p className="text-white/50 mb-12">The webcast begins shortly</p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-6">
          <div className="text-center">
            <FlipDigit value={hours[0]} />
          </div>
          <div className="text-center">
            <FlipDigit value={hours[1]} />
          </div>
          <span className="text-4xl md:text-6xl font-bold" style={{ color: BRAND.gold }}>:</span>
          <div className="text-center">
            <FlipDigit value={minutes[0]} />
          </div>
          <div className="text-center">
            <FlipDigit value={minutes[1]} />
          </div>
          <span className="text-4xl md:text-6xl font-bold" style={{ color: BRAND.gold }}>:</span>
          <div className="text-center">
            <FlipDigit value={seconds[0]} />
          </div>
          <div className="text-center">
            <FlipDigit value={seconds[1]} />
          </div>
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-12"
          style={{ background: 'rgba(212,168,75,0.15)', color: BRAND.gold }}
        >
          You're registered for the <strong>{sessionLabel}</strong> Session
        </div>

        {/* Info */}
        <div className="space-y-3 text-sm text-white/60 mb-10">
          <p>Check your email -- your free leads account details were just sent</p>
          <p>Save this page -- we'll remind you 5 min before via text</p>
          <p style={{ color: BRAND.gold }}>50/50 Partnership spots are extremely limited -- this is your only chance today</p>
        </div>

        {/* Social proof ticker */}
        <div
          className="rounded-lg px-4 py-3 mb-10 transition-opacity duration-500"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p className="text-sm" style={{ color: BRAND.green }}>
            {SOCIAL_PROOF_MESSAGES[socialIndex]}
          </p>
        </div>

        {/* Enter button */}
        <button
          onClick={() => router.push(`/webcast/live?leadId=${leadId || ''}`)}
          disabled={!canEnter}
          className="px-10 py-4 rounded-xl text-lg font-bold transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
          style={{
            background: canEnter ? BRAND.gold : 'rgba(212,168,75,0.3)',
            color: canEnter ? BRAND.navy : 'rgba(255,255,255,0.3)',
          }}
        >
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          ENTER THE WEBCAST
        </button>
        {!canEnter && (
          <p className="text-xs text-white/30 mt-2">Button activates 2 minutes before the session</p>
        )}
      </div>
      </div>
    </div>
  )
}
