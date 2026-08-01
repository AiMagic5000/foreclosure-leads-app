"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { Phone, MessageSquare, X } from "lucide-react"

// Enrollment no longer sends people to a checkout link. Every "become an agent /
// upgrade / enroll" CTA now opens this popup so a human closes the sale.
// Both numbers are tap-to-action: phones open the dialer / messaging app.
export const AGENT_MANAGER_PHONE = "(888) 545-8007"
export const AGENT_MANAGER_PHONE_TEL = "+18885458007"
export const AGENT_MANAGER_TEXT = "725-290-2778"
export const AGENT_MANAGER_TEXT_TEL = "+17252902778"

type Ctx = { openAgentManager: () => void }
const AgentManagerCtx = createContext<Ctx>({ openAgentManager: () => {} })

export function useAgentManager() {
  return useContext(AgentManagerCtx)
}

export function AgentManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-r from-[#09274c] to-[#123f77] px-6 py-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#8eb4d8]">Foreclosure Recovery Inc.</p>
          <h2 className="mt-1 text-xl font-bold text-white">Become an Asset Recovery Agent</h2>
        </div>

        <div className="px-6 py-6 text-center">
          <p className="text-[15px] leading-relaxed text-slate-700">
            Connect with your new agent manager to get started.
          </p>

          <a
            href={`tel:${AGENT_MANAGER_PHONE_TEL}`}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#d82221] px-5 py-4 text-lg font-bold text-white transition hover:opacity-90"
          >
            <Phone className="h-5 w-5" />
            {AGENT_MANAGER_PHONE}
          </a>
          <p className="mt-1.5 text-xs text-slate-500">Tap to call</p>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <a
            href={`sms:${AGENT_MANAGER_TEXT_TEL}`}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-[#09274c] bg-white px-5 py-4 text-lg font-bold text-[#09274c] transition hover:bg-slate-50"
          >
            <MessageSquare className="h-5 w-5" />
            Text {AGENT_MANAGER_TEXT}
          </a>
          <p className="mt-1.5 text-xs text-slate-500">Tap to text &mdash; we&apos;ll get you started</p>

          <p className="mt-5 text-xs text-slate-500">
            Questions about the program, pricing, or payment options? Your agent manager walks you through all of it.
          </p>
        </div>
      </div>
    </div>
  )
}

// Wrap a tree so any child can call openAgentManager() — used by the dashboard
// layout so every header/sidebar/settings CTA shares one modal instance.
export function AgentManagerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openAgentManager = useCallback(() => setOpen(true), [])
  return (
    <AgentManagerCtx.Provider value={{ openAgentManager }}>
      {children}
      <AgentManagerModal open={open} onClose={() => setOpen(false)} />
    </AgentManagerCtx.Provider>
  )
}
