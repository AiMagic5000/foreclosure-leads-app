"use client"

import { usePin } from "@/lib/pin-context"
import { Eye, X } from "lucide-react"

/**
 * Persistent banner shown while an admin is impersonating ("viewing as") another user.
 * Mounted once in the dashboard layout, so it appears on every page — current and future.
 */
export function ImpersonationBanner() {
  const { impersonating, isRealAdmin, clearImpersonation } = usePin()
  if (!impersonating || !isRealAdmin) return null
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-4 flex items-center justify-between gap-3 bg-[#D82221] px-4 py-2 text-white shadow-md lg:-mx-6 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 flex-none" />
        <span className="truncate text-sm font-medium">
          Viewing as <span className="font-bold">{impersonating.name}</span>
          <span className="ml-1 hidden text-white/80 sm:inline">({impersonating.email})</span>
        </span>
      </div>
      <button
        onClick={clearImpersonation}
        className="flex flex-none items-center gap-1 rounded-md bg-white/15 px-3 py-1 text-sm font-semibold transition hover:bg-white/25"
      >
        <X className="h-4 w-4" /> Exit
      </button>
    </div>
  )
}
