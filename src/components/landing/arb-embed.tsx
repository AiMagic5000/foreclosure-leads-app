"use client"

import { useEffect, useState } from "react"

// Embeds the full Asset Recovery Business page (self-contained HTML + its own CSS
// + the real ARB images/videos under /arb/) and auto-resizes to its content height
// so it renders seamlessly inline — no inner scrollbar, exact ARB visuals, and zero
// CSS collision with the rest of the site.
export function ArbEmbed() {
  const [height, setHeight] = useState(4000)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const h = (e.data && (e.data as { arbHeight?: number }).arbHeight) || 0
      if (typeof h === "number" && h > 300) setHeight(h)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return (
    <iframe
      src="/arb-sections.html"
      title="The Complete Asset Recovery Agent Business"
      className="block w-full border-0"
      style={{ height }}
      scrolling="no"
      loading="lazy"
    />
  )
}
