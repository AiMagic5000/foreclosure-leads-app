"use client"

import { useEffect, useRef, useState } from "react"

// Embeds the full Asset Recovery Business page (self-contained HTML under /arb/)
// and auto-resizes to its content height. Same-origin, so we bridge hash-anchor
// menu links to the sections that live INSIDE the iframe: clicking "/#pricing" (or
// landing on "/#pricing" from another page) smooth-scrolls the parent window to
// that section inside the frame.
export function ArbEmbed() {
  const [height, setHeight] = useState(4000)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const h = (e.data && (e.data as { arbHeight?: number }).arbHeight) || 0
      if (typeof h === "number" && h > 300) setHeight((prev) => (Math.abs(h - prev) > 16 ? h : prev))
    }
    window.addEventListener("message", onMessage)

    function scrollToSection(id: string, smooth: boolean) {
      const frame = iframeRef.current
      const el = frame?.contentDocument?.getElementById(id)
      if (!frame || !el) return false
      const top = frame.offsetTop + el.offsetTop - 80 // header allowance
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
      document.removeEventListener("click", onClick)
      window.removeEventListener("hashchange", scrollToHash)
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      src="/arb-sections.html"
      title="The Complete Asset Recovery Agent Business"
      className="block w-full border-0"
      style={{ height }}
      scrolling="no"
    />
  )
}
