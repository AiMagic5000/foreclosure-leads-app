"use client"

import { useState, useRef, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { LogOut, Settings } from "lucide-react"

// Custom account avatar + menu. Only two avatars ever render: the user's real
// Google photo, or our eagle (fri-bird.png). Never Clerk's purple default.
export function HeaderUserMenu() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const hasPhoto = !!user?.hasImage
  const src = hasPhoto ? user!.imageUrl : "/images/fri-bird.png"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-white ring-1 ring-black/5"
        aria-label="Account menu"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Account"
          className={hasPhoto ? "h-full w-full object-cover" : "h-full w-full object-contain p-1"}
        />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border bg-white py-1 text-sm shadow-lg">
          {user?.primaryEmailAddress?.emailAddress && (
            <div className="truncate border-b px-3 py-2 text-xs text-slate-500">
              {user.primaryEmailAddress.emailAddress}
            </div>
          )}
          <button
            onClick={() => { setOpen(false); openUserProfile() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100"
          >
            <Settings className="h-4 w-4" /> Manage account
          </button>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
