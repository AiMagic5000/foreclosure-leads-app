"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Records a page view on every dashboard route change, plus one login event per session.
// Fire-and-forget; failures are silent so tracking never affects the UX.
export function ActivityTracker() {
  const pathname = usePathname()

  useEffect(() => {
    try {
      if (!sessionStorage.getItem("activity-login")) {
        sessionStorage.setItem("activity-login", "1")
        fetch("/api/activity/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "login", path: pathname }),
          keepalive: true,
        }).catch(() => {})
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!pathname) return
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
