'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Volume2, VolumeX, Maximize, MessageCircle, X, Send, Zap, Lock, Clock } from 'lucide-react'
import Hls from 'hls.js'
import { SCRIPTED_MESSAGES, getSessionOffset } from '@/data/webcast-scripted-chat'

const BRAND = {
  navy: '#09274c',
  navyDark: '#050d1a',
  gold: '#d4a84b',
  white: '#ffffff',
  green: '#10b981',
}

const HLS_URL = 'https://stream.usforeclosureleads.com/webcast.m3u8'
const SESSION_DURATION = 1800 // 30 minutes in seconds

interface ChatMsg {
  id: string
  sender_name: string
  sender_type: string
  message: string
}

// Scripted messages imported from @/data/webcast-scripted-chat
// Session offset imported from @/data/webcast-scripted-chat

// ---- ChatPanel (defined at module level to avoid React re-mount on parent re-render) ----

interface ChatPanelProps {
  mobile?: boolean
  messages: ChatMsg[]
  chatEndRef: React.RefObject<HTMLDivElement | null>
  chatInput: string
  onInputChange: (val: string) => void
  chatSending: boolean
  onSend: () => void
  chatUnlocked: boolean
  chatUnlocking?: boolean
  chatName: string
  onNameChange: (val: string) => void
  chatEmail: string
  onEmailChange: (val: string) => void
  onUnlock: (e: React.FormEvent) => void
  onClose?: () => void
  joinFormOpen: boolean
  onToggleJoinForm: () => void
  chatContainerRef?: React.RefObject<HTMLDivElement | null>
}

function ChatPanel({
  mobile = false,
  messages,
  chatEndRef,
  chatInput,
  onInputChange,
  chatSending,
  onSend,
  chatUnlocked,
  chatUnlocking,
  chatName,
  onNameChange,
  chatEmail,
  onEmailChange,
  onUnlock,
  onClose,
  joinFormOpen,
  onToggleJoinForm,
  chatContainerRef,
}: ChatPanelProps) {
  return (
    <div
      className={`flex flex-col ${mobile ? 'h-[60vh]' : 'h-full'}`}
      style={{ background: mobile ? BRAND.navyDark : 'rgba(5,13,26,0.95)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" style={{ color: BRAND.gold }} />
          <span className="font-semibold text-sm text-white">LIVE CHAT</span>
        </div>
        {mobile && onClose && (
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-2 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: msg.sender_type === 'moderator_ai' || msg.sender_type === 'typing' ? BRAND.green : msg.sender_type === 'user' ? BRAND.gold : 'rgba(255,255,255,0.15)',
                color: msg.sender_type === 'user' || msg.sender_type === 'moderator_ai' || msg.sender_type === 'typing' ? BRAND.navy : BRAND.white,
              }}
            >
              {msg.sender_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span
                className="font-semibold text-sm"
                style={{ color: msg.sender_type === 'moderator_ai' || msg.sender_type === 'typing' ? BRAND.green : msg.sender_type === 'user' ? BRAND.gold : 'rgba(255,255,255,0.7)' }}
              >
                {msg.sender_name}
              </span>
              {(msg.sender_type === 'moderator_ai' || msg.sender_type === 'typing') && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-green-900/40 text-green-400 ml-1.5">MOD</span>
              )}
              {msg.sender_type === 'typing' ? (
                <div className="flex items-center gap-1 mt-1.5 h-5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-[typingBounce_1.2s_ease-in-out_infinite]" />
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-[typingBounce_1.2s_ease-in-out_0.2s_infinite]" />
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-[typingBounce_1.2s_ease-in-out_0.4s_infinite]" />
                </div>
              ) : (
                <p className="text-sm text-white/80 mt-0.5">{msg.message}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-white/10 shrink-0">
        {chatUnlocked ? (
          <div className="flex gap-2 px-4 py-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#d4a84b]"
            />
            <button
              onClick={onSend}
              disabled={chatSending || !chatInput.trim()}
              className="px-3 py-2 rounded-lg transition disabled:opacity-30"
              style={{ background: BRAND.gold, color: BRAND.navy }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : joinFormOpen ? (
          <form onSubmit={onUnlock} className="px-4 py-3 space-y-2">
            <input
              type="text"
              value={chatName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="First name"
              required
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#d4a84b]"
            />
            <input
              type="email"
              value={chatEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#d4a84b]"
            />
            <button
              type="submit"
              disabled={chatUnlocking}
              className="w-full py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50"
              style={{ background: BRAND.gold, color: BRAND.navy }}
            >
              {chatUnlocking ? 'Setting up...' : 'JOIN CHAT'}
            </button>
          </form>
        ) : (
          <div className="px-3 py-2">
            <button
              onClick={onToggleJoinForm}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
              style={{ background: BRAND.gold, color: BRAND.navy }}
            >
              <MessageCircle className="w-4 h-4" />
              JOIN CHAT
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Countdown Timer ----

function SessionCountdown({ offsetSeconds }: { offsetSeconds: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, SESSION_DURATION - offsetSeconds))

  useEffect(() => {
    const startedAt = Date.now()
    const initialRemaining = Math.max(0, SESSION_DURATION - offsetSeconds)

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setRemaining(Math.max(0, initialRemaining - elapsed))
    }, 1000)

    return () => clearInterval(interval)
  }, [offsetSeconds])

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60

  return (
    <span className="flex items-center gap-1 text-white/50 text-sm">
      <Clock className="w-3.5 h-3.5" />
      <span className="font-mono tabular-nums">{String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}</span>
      <span className="hidden sm:inline">remaining</span>
    </span>
  )
}

// ---- Next Session Countdown (big timer until the next :00 or :30 slot) ----

function getSecondsUntilNextSlot(): number {
  const now = new Date()
  const min = now.getMinutes()
  const sec = now.getSeconds()
  // Next slot is the upcoming :00 or :30
  if (min < 30) {
    return (30 - min) * 60 - sec
  }
  return (60 - min) * 60 - sec
}

function NextSessionOverlay() {
  const [remaining, setRemaining] = useState(() => getSecondsUntilNextSlot())
  const prevRef = useRef(getSecondsUntilNextSlot())

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getSecondsUntilNextSlot()
      // Rollover detection: was near zero, jumped to ~1800 = boundary crossed
      if (prevRef.current <= 15 && r > 1700) {
        window.location.reload()
        return
      }
      prevRef.current = r
      setRemaining(r)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90">
      <p className="text-white/60 text-lg mb-4 uppercase tracking-widest">Next Live Session Starts In</p>
      <div className="font-mono font-extrabold text-7xl md:text-9xl tabular-nums" style={{ color: BRAND.gold }}>
        {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      </div>

      <p className="mt-6 text-lg md:text-xl font-bold text-white animate-pulse">
        Refresh your screen to start watching!
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-8 py-3 rounded-lg font-bold text-lg transition hover:opacity-90"
        style={{ background: BRAND.gold, color: BRAND.navy }}
      >
        REFRESH NOW
      </button>

      <p className="text-white/40 text-sm mt-6">Sessions run every 30 minutes, 24/7</p>
      <p className="text-white/50 text-sm mt-2">Your preview account is active -- explore the dashboard at usforeclosureleads.com</p>
    </div>
  )
}

// ---- Main Page ----

export default function WebcastLivePage() {
  return (
    <Suspense fallback={<div style={{ background: '#050d1a' }} className="min-h-screen" />}>
      <WebcastLiveContent />
    </Suspense>
  )
}

function WebcastLiveContent() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId') || ''
  const autoplay = searchParams.get('autoplay') === '1'

  // Track page view for email notifications
  useEffect(() => {
    fetch('/api/webcast/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: '/webcast/live', referrer: document.referrer }),
    }).catch(() => {})
  }, [])

  // Compute session offset from wall clock immediately -- no API dependency
  // Safety net: if offset is within 5 seconds of session end (1795-1800),
  // treat it as the very start of a session (offset=0). This handles the
  // edge case where the redirect from /webcast arrives a split-second
  // before the boundary.
  const rawOffset = getSessionOffset()
  const initialOffset = useRef(rawOffset >= SESSION_DURATION - 5 ? 0 : rawOffset).current

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [muted, setMuted] = useState(!autoplay)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(() => {
    // Pre-populate past messages instantly on mount
    return SCRIPTED_MESSAGES
      .filter((m) => m.trigger_second <= initialOffset)
      .map((m) => ({
        id: `scripted-${m.trigger_second}`,
        sender_name: m.sender_name,
        sender_type: m.sender_type || 'attendee',
        message: m.message,
      }))
  })
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [viewerCount, setViewerCount] = useState(34 + Math.floor(Math.random() * 15))
  const [showPartnershipBanner, setShowPartnershipBanner] = useState(initialOffset >= 1080)
  const [showPartnershipModal, setShowPartnershipModal] = useState(false)
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(!autoplay)
  const [sessionEnded, setSessionEnded] = useState(false)
  const videoOffsetRef = useRef(initialOffset)
  const videoStartedRef = useRef(false)

  // Chat gate state -- name + email required to post, triggers lead creation + account provisioning
  const [chatName, setChatName] = useState('')
  const [chatEmail, setChatEmail] = useState('')
  const [chatUnlocked, setChatUnlocked] = useState(false)
  const [chatUnlocking, setChatUnlocking] = useState(false)
  const [joinFormOpen, setJoinFormOpen] = useState(false)

  // Fetch session info (for viewer count + session ID only -- offset is computed locally)
  const [sessionId, setSessionId] = useState('')
  useEffect(() => {
    fetch(`/api/webcast/session?leadId=${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        const session = data.assignedSession || data.currentSession
        if (session) {
          setViewerCount(Math.round(session.attendeeCount) || 34)
          if (session.id) setSessionId(session.id)
        }
      })
      .catch(() => {})
  }, [leadId])

  // Initialize HLS player (runs once on mount)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function startPlayback() {
      if (videoStartedRef.current) return
      videoStartedRef.current = true
      video!.currentTime = videoOffsetRef.current

      if (autoplay) {
        // Try unmuted first; browsers may block it, fall back to muted
        video!.muted = false
        video!.play().catch(() => {
          video!.muted = true
          setMuted(true)
          setShowUnmutePrompt(true)
          video!.play().catch(() => {})
        })
      } else {
        video!.muted = true
        video!.play().catch(() => {})
      }
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })
      hlsRef.current = hls
      hls.loadSource(HLS_URL)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => setTimeout(startPlayback, 500))
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_URL
      video.addEventListener('loadedmetadata', () => setTimeout(startPlayback, 500), { once: true })
    } else {
      video.src = '/assets/webcast.mp4'
      video.addEventListener('loadedmetadata', () => setTimeout(startPlayback, 500), { once: true })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Block seeking (fake-live -- no rewinding)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let lastTime = initialOffset

    const handleTimeUpdate = () => {
      if (video.currentTime < lastTime - 2) video.currentTime = lastTime
      else lastTime = video.currentTime
    }
    const handleSeeking = () => {
      if (video.currentTime < lastTime - 2) video.currentTime = lastTime
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('seeking', handleSeeking)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('seeking', handleSeeking)
    }
  }, [initialOffset])

  // Detect video end / session end
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleEnded = () => setSessionEnded(true)
    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [])

  // Also check session end via countdown reaching 0
  useEffect(() => {
    const remaining = SESSION_DURATION - initialOffset
    if (remaining <= 0) {
      setSessionEnded(true)
      return
    }
    const timer = setTimeout(() => setSessionEnded(true), remaining * 1000)
    return () => clearTimeout(timer)
  }, [initialOffset])

  // Disable right-click on video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handler = (e: MouseEvent) => e.preventDefault()
    video.addEventListener('contextmenu', handler)
    return () => video.removeEventListener('contextmenu', handler)
  }, [])

  // Schedule future scripted messages (past ones are pre-populated in useState initializer)
  // Moderator messages show typing indicator first, then the actual message
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const TYPING_DURATION = 2500 // ms to show typing dots before moderator message

    SCRIPTED_MESSAGES.filter((m) => m.trigger_second > initialOffset).forEach((m) => {
      const jitter = m.sender_type === 'moderator_ai' ? (Math.random() * 3000 + 2000) : (Math.random() * 6000 - 3000)
      const delay = (m.trigger_second - initialOffset) * 1000 + jitter

      if (m.sender_type === 'moderator_ai') {
        // Show typing indicator first
        const typingTimer = setTimeout(() => {
          setChatMessages((prev) => [
            ...prev.filter((p) => p.id !== 'typing-indicator'),
            { id: 'typing-indicator', sender_name: 'Allie', sender_type: 'typing', message: '' },
          ])
        }, Math.max(0, delay - TYPING_DURATION))
        timers.push(typingTimer)

        // Then replace with actual message
        const msgTimer = setTimeout(() => {
          setChatMessages((prev) => [
            ...prev.filter((p) => p.id !== 'typing-indicator'),
            { id: `scripted-${m.trigger_second}`, sender_name: m.sender_name, sender_type: 'moderator_ai', message: m.message },
          ])
        }, Math.max(0, delay))
        timers.push(msgTimer)
      } else {
        // Regular attendee messages appear instantly
        const timer = setTimeout(() => {
          setChatMessages((prev) => [
            ...prev,
            { id: `scripted-${m.trigger_second}`, sender_name: m.sender_name, sender_type: 'attendee', message: m.message },
          ])
        }, Math.max(0, delay))
        timers.push(timer)
      }
    })

    // Schedule partnership banner if not already shown
    if (initialOffset < 1080) {
      const bannerTimer = setTimeout(() => setShowPartnershipBanner(true), (1080 - initialOffset) * 1000)
      timers.push(bannerTimer)
    }

    return () => timers.forEach(clearTimeout)
  }, [initialOffset])

  // Viewer count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((v) => Math.max(20, v + Math.floor(Math.random() * 7) - 3))
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll chat only if user is near the bottom (not reading earlier messages)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    // Only auto-scroll if within 120px of the bottom
    if (distanceFromBottom < 120) {
      container.scrollTop = container.scrollHeight
    }
  }, [chatMessages])

  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || chatSending) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatSending(true)

    const displayName = chatName || 'You'

    setChatMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender_name: displayName, sender_type: 'user', message: msg },
    ])

    // Show typing indicator while waiting for AI response
    setChatMessages((prev) => [
      ...prev,
      { id: 'typing-indicator', sender_name: 'Allie', sender_type: 'typing', message: '' },
    ])

    try {
      const res = await fetch('/api/webcast/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, sessionId, message: msg, senderName: displayName }),
      })
      const data = await res.json()
      setChatMessages((prev) => prev.filter((p) => p.id !== 'typing-indicator'))
      if (data.response) {
        setChatMessages((prev) => [
          ...prev,
          { id: `ai-${Date.now()}`, sender_name: data.response.sender_name, sender_type: 'moderator_ai', message: data.response.message },
        ])
      }
    } catch {
      setChatMessages((prev) => prev.filter((p) => p.id !== 'typing-indicator'))
    } finally {
      setChatSending(false)
    }
  }, [chatInput, chatSending, leadId, sessionId, chatName])

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) document.exitFullscreen()
    else video.requestFullscreen()
  }

  const handleUnlockChat = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatName.trim() || !chatEmail.trim() || chatUnlocking) return
    setChatUnlocking(true)
    try {
      const res = await fetch('/api/webcast/chat-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: chatName.trim(), email: chatEmail.trim() }),
      })
      const data = await res.json()
      if (data.leadId) {
        // Update leadId so subsequent chat messages are associated
        // (leadId from searchParams may be empty if they came directly)
      }
      setChatUnlocked(true)
    } catch {
      // Unlock anyway so the user can chat even if the API fails
      setChatUnlocked(true)
    } finally {
      setChatUnlocking(false)
    }
  }, [chatName, chatEmail, chatUnlocking])

  const chatPanelProps = {
    messages: chatMessages,
    chatEndRef,
    chatInput,
    onInputChange: setChatInput,
    chatSending,
    onSend: sendChat,
    chatUnlocked,
    chatUnlocking,
    chatName,
    onNameChange: setChatName,
    chatEmail,
    onEmailChange: setChatEmail,
    onUnlock: handleUnlockChat,
    joinFormOpen,
    onToggleJoinForm: () => setJoinFormOpen(true),
    chatContainerRef,
  }

  return (
    <div style={{ background: BRAND.navyDark }} className="h-screen flex flex-col text-white overflow-hidden">
      {/* Top Bar -- single bar with LIVE stats + partnership CTA + controls */}
      <div
        className="px-4 py-2.5 shrink-0"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy}, #0d3668)`, borderBottom: `2px solid ${BRAND.gold}` }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          {/* Left: LIVE + watching + remaining + partnership text */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-bold text-sm">LIVE</span>
            </span>
            <span className="text-white/60 text-sm">{Math.round(viewerCount)} watching</span>
            <SessionCountdown offsetSeconds={initialOffset} />
            <span className="text-white/20 hidden md:inline">|</span>
            <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">
              <Zap className="w-3 h-3" /> TODAY ONLY
            </span>
            <span className="hidden md:inline font-bold text-sm" style={{ color: BRAND.gold }}>Claim your 50/50 partner account TODAY ONLY — just complete the form below.</span>
          </div>
          {/* Right: spots + apply + mute + fullscreen */}
          <div className="flex items-center gap-3">
            <span className="text-red-400 font-bold text-sm animate-pulse hidden sm:inline">Only 6 spots left</span>
            <button
              onClick={() => setShowPartnershipModal(true)}
              className="px-4 py-1.5 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap transition hover:opacity-90"
              style={{ background: BRAND.gold, color: BRAND.navy }}
            >
              APPLY
            </button>
            <button onClick={() => { const next = !muted; setMuted(next); if (videoRef.current) videoRef.current.muted = next; if (!next) setShowUnmutePrompt(false) }} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Video Section -- 16:9 on mobile (shrink-0), flex-1 on desktop */}
        <div className="relative bg-black shrink-0 md:shrink md:flex-1 md:min-h-0 md:min-w-0" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted
            autoPlay
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
          />
          {!showUnmutePrompt && !sessionEnded && (
            <div
              onClick={() => {
                const next = !muted
                setMuted(next)
                if (videoRef.current) videoRef.current.muted = next
              }}
              className="absolute inset-0 z-10 cursor-pointer"
            />
          )}
          {sessionEnded && <NextSessionOverlay />}
          {showUnmutePrompt && !sessionEnded && (
            <button
              onClick={() => {
                const video = videoRef.current
                if (video) {
                  video.muted = false
                  if (video.paused) video.play().catch(() => {})
                }
                setMuted(false)
                setShowUnmutePrompt(false)
              }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 transition hover:bg-black/30 cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl max-w-md" style={{ background: 'rgba(9,39,76,0.9)', border: `1px solid ${BRAND.gold}44` }}>
                <Volume2 className="w-10 h-10" style={{ color: BRAND.gold }} />
                <span className="text-white font-bold text-lg">Tap to Enable Sound</span>
                <span className="text-white/50 text-sm">The webcast is playing -- tap anywhere to hear audio</span>
                <div className="text-xs text-white/40 space-y-1 text-left mt-2 w-full">
                  <p><span className="text-white/60 font-medium">Mac / Windows:</span> Check that your volume is up and your browser tab isn't muted.</p>
                  <p><span className="text-white/60 font-medium">iPhone / iPad:</span> Make sure your silent switch is off (orange = silent).</p>
                  <p><span className="text-white/60 font-medium">Android:</span> Check your device volume and "Do Not Disturb" settings.</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Chat -- below video on mobile, side panel on desktop */}
        <div className="flex-1 md:flex-none md:w-[350px] border-t md:border-t-0 md:border-l border-white/10 flex flex-col min-h-0">
          <ChatPanel {...chatPanelProps} />
        </div>
      </div>

      {/* Partnership Modal */}
      {showPartnershipModal && (
        <PartnershipModal leadId={leadId} onClose={() => setShowPartnershipModal(false)} />
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function PartnershipModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [experience, setExperience] = useState('')
  const [why, setWhy] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/webcast/partnership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: leadId || undefined, fullName, email, phone, state, experienceLevel: experience, whyInterested: why }),
      })
      if (res.ok) setSubmitted(true)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-lg rounded-2xl p-8 overflow-y-auto max-h-[90vh]" style={{ background: BRAND.navy, border: `1px solid ${BRAND.gold}33` }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${BRAND.green}20` }}>
              <Zap className="w-8 h-8" style={{ color: BRAND.green }} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Application Received!</h3>
            <p className="text-white/60">Corey will review your application and reach out within 24 hours.</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold mb-1" style={{ color: BRAND.gold }}>50/50 Partnership Application</h3>
            <p className="text-white/60 text-sm mb-6">Corey reviews applications daily. Limited spots available.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
              <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
              <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
              <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#d4a84b]">
                <option value="" className="text-black">Experience Level</option>
                <option value="none" className="text-black">No experience</option>
                <option value="some" className="text-black">Some real estate knowledge</option>
                <option value="experienced" className="text-black">Experienced in recovery/real estate</option>
              </select>
              <textarea placeholder="Why are you interested?" value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b] resize-none" />
              <button type="submit" disabled={loading} className="w-full py-4 rounded-lg font-bold text-lg transition disabled:opacity-50" style={{ background: BRAND.gold, color: BRAND.navy }}>
                {loading ? 'Submitting...' : 'SUBMIT APPLICATION'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
