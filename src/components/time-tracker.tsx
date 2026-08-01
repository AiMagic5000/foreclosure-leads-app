"use client"

import { useEffect } from "react"

// Invisible logged-in-time tracker. Beats /api/user/heartbeat once a minute,
// but ONLY while the tab is actually visible — background tabs and closed
// laptops accrue nothing. Fire-and-forget; failures are silently ignored.
const BEAT_MS = 60_000

export function TimeTracker() {
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState !== "visible") return
      fetch("/api/user/heartbeat", { method: "POST", keepalive: true }).catch(() => {})
    }
    beat() // credit the first minute of the visit
    const id = setInterval(beat, BEAT_MS)
    document.addEventListener("visibilitychange", beat)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", beat)
    }
  }, [])
  return null
}
