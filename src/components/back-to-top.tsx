"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

// Fixed back-to-top button, bottom-left. Appears after scrolling down a bit.
export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-5 left-5 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f] text-white shadow-xl transition hover:scale-105 hover:bg-[#2d4a6f]"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
