"use client"

import { useEffect, useRef, useState } from "react"

// Embeds the full Asset Recovery Business page (self-contained HTML under /arb/)
// and sizes the iframe to its content. Because the frame is SAME-ORIGIN we read
// the content height directly (authoritative) instead of trusting postMessage —
// the old postMessage-only path could leave the height stuck at its initial
// value, producing thousands of pixels of dead space (or clipping) above the
// footer on some viewports. We still accept postMessage as a fallback, and we
// bridge hash-anchor menu links to the sections that live INSIDE the iframe.
export function ArbEmbed() {
  const [height, setHeight] = useState(4000)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = iframeRef.current

    function applyHeight(h: number) {
      if (typeof h === "number" && h > 300) {
        setHeight((prev) => (Math.abs(h - prev) > 4 ? h : prev))
      }
    }

    // Authoritative: read the same-origin content height directly.
    function measure() {
      try {
        const d = iframeRef.current?.contentDocument
        if (d) applyHeight(Math.max(d.body.scrollHeight, d.documentElement.scrollHeight))
      } catch {
        /* cross-origin or not ready — fall back to postMessage */
      }
    }

    // Fallback: the embed also posts its height.
    function onMessage(e: MessageEvent) {
      const h = (e.data && (e.data as { arbHeight?: number }).arbHeight) || 0
      applyHeight(h)
    }
    window.addEventListener("message", onMessage)

    // Re-measure on load, on every content resize, and on a slow safety poll.
    let ro: ResizeObserver | undefined
    function onLoad() {
      measure()
      try {
        const d = iframeRef.current?.contentDocument
        if (d && "ResizeObserver" in window) {
          ro = new ResizeObserver(() => measure())
          ro.observe(d.body)
        }
      } catch {
        /* ignore */
      }
    }
    frame?.addEventListener("load", onLoad)
    if (frame?.contentDocument?.readyState === "complete") onLoad()
    const poll = setInterval(measure, 1000)
    window.addEventListener("resize", measure)
    measure()

    function scrollToSection(id: string, smooth: boolean) {
      const f = iframeRef.current
      const el = f?.contentDocument?.getElementById(id)
      if (!f || !el) return false
      const top = f.offsetTop + el.offsetTop - 80 // header allowance
      window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" })
      return true
    }

    function onClick(e: MouseEvent) {
      if (window.location.pathname !== "/") return
      const a = (e.target as HTMLElement | null)?.closest("a")
      if (!a) return
      const href = a.getAttribute("href") || ""
      const m = href.match(/^\/?#(.+)$/)
      if (!m) return
      if (scrollToSection(m[1], true)) {
        e.preventDefault()
        history.replaceState(null, "", "/#" + m[1])
        setTimeout(() => scrollToSection(m[1], true), 130)
      }
    }
    document.addEventListener("click", onClick)

    function scrollToHash() {
      if (window.location.pathname !== "/") return
      const id = window.location.hash.slice(1)
      if (!id) return
      let tries = 0
      const tick = () => {
        if (scrollToSection(id, true)) return
        if (tries++ < 25) setTimeout(tick, 200)
      }
      tick()
    }
    scrollToHash()
    window.addEventListener("hashchange", scrollToHash)

    return () => {
      window.removeEventListener("message", onMessage)
      window.removeEventListener("resize", measure)
      document.removeEventListener("click", onClick)
      window.removeEventListener("hashchange", scrollToHash)
      frame?.removeEventListener("load", onLoad)
      clearInterval(poll)
      ro?.disconnect()
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      src="/arb-sections.html?v=20260609g"
      title="The Complete Asset Recovery Agent Business"
      className="block w-full border-0"
      style={{ height }}
      scrolling="no"
    />
  )
}
