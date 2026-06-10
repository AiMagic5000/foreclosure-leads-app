"use client"

import { useEffect, useState } from "react"

// Cycling headline word — "Add [Freedom/Income/Time/...] to Your Retirement".
// Mirrors the rotating-word animation on assetrecoverybusiness.com. Every word
// reads naturally in the sentence. Fades + slides on each swap.
const WORDS = ["Freedom", "Income", "Time", "Security", "Purpose", "Peace", "Hope"]

export function RotatingWord() {
  const [i, setI] = useState(0)
  const [show, setShow] = useState(true)
  useEffect(() => {
    const id = setInterval(() => {
      setShow(false)
      setTimeout(() => {
        setI((p) => (p + 1) % WORDS.length)
        setShow(true)
      }, 300)
    }, 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <span
      className="text-[#dc2626] transition-all duration-300 ease-out"
      style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)" }}
    >
      {WORDS[i]}
    </span>
  )
}
