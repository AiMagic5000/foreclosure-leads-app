"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Loader2 } from "lucide-react"

type Msg = { role: "user" | "assistant"; content: string }

const GREETING: Msg = {
  role: "assistant",
  content: "Hi! We're Foreclosure Recovery Inc. Ask us anything about surplus funds, your claim, or getting started — we're glad to help.",
}

function newSessionId() {
  // No Date.now()/random restrictions here (browser runtime) — fine to use.
  return "fri-" + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [emailError, setEmailError] = useState(false)
  const sessionRef = useRef<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentTranscriptForRef = useRef(0)

  useEffect(() => { if (!sessionRef.current) sessionRef.current = newSessionId() }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  const emailTranscript = useCallback(() => {
    const userMsgs = messages.filter((m) => m.role === "user").length
    if (userMsgs === 0 || sentTranscriptForRef.current === messages.length) return
    sentTranscriptForRef.current = messages.length
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transcript", messages, name, email, sessionId: sessionRef.current }),
      keepalive: true,
    }).catch(() => {})
  }, [messages, name, email])

  const closeChat = useCallback(() => {
    emailTranscript()
    setOpen(false)
  }, [emailTranscript])

  // ESC closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeChat() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, closeChat])

  // Send transcript if the tab is closed mid-chat
  useEffect(() => {
    const onHide = () => { if (open) emailTranscript() }
    window.addEventListener("pagehide", onHide)
    return () => window.removeEventListener("pagehide", onHide)
  }, [open, emailTranscript])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError(true); return }
    setEmailError(false)
    const next = [...messages, { role: "user" as const, content: text }]
    setMessages(next)
    setInput("")
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", messages: next, name, email, sessionId: sessionRef.current }),
      })
      const d = await res.json()
      setMessages((m) => [...m, { role: "assistant", content: d.reply || "How can we help?" }])
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry — please call us at (888) 545-8007." }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Launcher bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-5 right-5 z-[1000] flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl transition hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/fri-bird.png" alt="Chat with Foreclosure Recovery Inc." className="h-11 w-11 object-contain" />
        </button>
      )}

      {open && (
        <>
          {/* Overlay (mobile tap-to-close) */}
          <div className="fixed inset-0 z-[999] bg-black/30 sm:hidden" onClick={closeChat} />

          {/* Panel — full viewport on mobile (100dvh so the header never scrolls off),
              floating card on desktop. Header is flex-none and pinned, so the close
              button is ALWAYS visible regardless of message length. */}
          <div
            className="fixed z-[1000] flex flex-col overflow-hidden bg-white shadow-2xl
                       inset-0 h-[100dvh] w-full rounded-none
                       sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(620px,82vh)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200"
          >
            {/* Header — pinned, close always reachable */}
            <div
              className="flex flex-none items-center gap-3 bg-[#1E3A5F] px-4 py-3 text-white"
              style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/fri-bird.png" alt="" className="h-8 w-8 flex-none object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight">Foreclosure Recovery Inc.</p>
                <p className="truncate text-xs text-white/70">We typically reply right away</p>
              </div>
              <button
                onClick={closeChat}
                aria-label="Close chat"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 active:scale-95"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed " +
                      (m.role === "user"
                        ? "rounded-br-sm bg-[#2563eb] text-white"
                        : "rounded-bl-sm border border-slate-200 bg-white text-slate-800")
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Optional contact (so we can follow up + included in the emailed transcript) */}
            <div className="flex flex-none gap-2 border-t border-slate-100 bg-white px-3 pt-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#2563eb]"
              />
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(false) }}
                type="email"
                placeholder={emailError ? "Enter your email to chat" : "Email (required to chat)"}
                className={"min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:border-[#2563eb] " + (emailError ? "border-red-500 bg-red-50 placeholder-red-500" : "border-slate-200")}
              />
            </div>

            {/* Input */}
            <div
              className="flex flex-none items-end gap-2 border-t border-slate-100 bg-white p-3"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                rows={1}
                placeholder="Type your message…"
                className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                aria-label="Send"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#2563eb] text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
