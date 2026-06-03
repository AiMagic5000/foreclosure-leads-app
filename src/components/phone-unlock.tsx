"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Input } from "@/components/ui/input"
import { Phone, CheckCircle2, Loader2 } from "lucide-react"

// Phone number + SMS consent. A phone on file unlocks the Closing Training videos
// and downloadable resources. Flashes when arrived at via ?flash=phone.
export function PhoneUnlock() {
  const { impersonating } = usePin()
  const pinId = impersonating?.pinId
  const q = pinId ? `?asPinId=${pinId}` : ""

  const [phone, setPhone] = useState("")
  const [hasPhone, setHasPhone] = useState(false)
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const d = await (await fetch(`/api/user/profile-phone${q}`)).json()
      if (d.phone) setPhone(d.phone)
      setHasPhone(!!d.hasPhone)
      setConsent(!!d.smsConsent)
    } catch { /* ignore */ }
  }, [q])

  useEffect(() => { load() }, [load])

  // Flash + scroll when redirected from the training gate.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (new URLSearchParams(window.location.search).get("flash") === "phone") {
      setFlash(true)
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200)
      const t = setTimeout(() => setFlash(false), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  async function save() {
    setSaving(true); setMsg(null)
    try {
      const res = await fetch("/api/user/profile-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), consent, asPinId: pinId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not save")
      setHasPhone(true)
      setMsg("Saved! Your training is unlocked.")
      // Re-fetch pin-context (hasPhone) so training unlocks immediately.
      setTimeout(() => window.location.reload(), 900)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={ref}
      id="phone-section"
      className={
        "scroll-mt-24 rounded-xl border p-4 transition-all " +
        (flash
          ? "border-amber-400 bg-amber-50 ring-4 ring-amber-300/60 animate-pulse"
          : hasPhone
          ? "border-emerald-300 bg-emerald-50/60"
          : "border-amber-300 bg-amber-50/60")
      }
    >
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-[#1E3A5F]" />
        <label className="text-sm font-semibold">Phone Number</label>
        {hasPhone && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Training unlocked
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Add your phone number to unlock the Closing Training videos and downloadable resources.
      </p>

      <Input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="(555) 123-4567"
        className="mt-2 bg-white"
      />

      <label className="mt-3 flex items-start gap-2 text-[11px] leading-snug text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 flex-none" />
        <span>
          By adding my phone number I agree to receive communications (calls, texts, and ringless voicemail) from
          Foreclosure Recovery Inc., and I agree to the website&apos;s communication policies and{" "}
          <a href="https://usforeclosureleads.com/terms" target="_blank" rel="noopener noreferrer" className="underline">terms</a>.
          Message and data rates may apply. Reply STOP to opt out.
        </span>
      </label>

      <button
        onClick={save}
        disabled={saving || !phone.trim() || !consent}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {hasPhone ? "Update phone number" : "Put in your phone number to unlock training"}
      </button>
      {msg && <p className="mt-2 text-xs text-slate-600">{msg}</p>}
    </div>
  )
}
