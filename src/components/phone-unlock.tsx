"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Input } from "@/components/ui/input"
import { Phone, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"

// Phone number + SMS verification. A VERIFIED phone (via a texted code) unlocks the Closing
// Training videos + downloadable resources. Flashes when arrived at via ?flash=phone.
export function PhoneUnlock() {
  const { impersonating } = usePin()
  const pinId = impersonating?.pinId
  const q = pinId ? `?asPinId=${pinId}` : ""

  const [phone, setPhone] = useState("")
  const [verified, setVerified] = useState(false)
  const [consent, setConsent] = useState(false)
  const [stage, setStage] = useState<"enter" | "code">("enter")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const d = await (await fetch(`/api/user/profile-phone${q}`)).json()
      if (d.phone) setPhone(d.phone)
      setVerified(!!d.verified)
      setConsent(!!d.smsConsent)
    } catch { /* ignore */ }
  }, [q])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (new URLSearchParams(window.location.search).get("flash") === "phone") {
      setFlash(true)
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200)
      const t = setTimeout(() => setFlash(false), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  async function sendCode() {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch("/api/user/phone-verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: phone.trim(), consent, asPinId: pinId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not send code")
      setStage("code"); setMsg("We texted you a 6-digit code. Enter it below.")
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not send code") } finally { setBusy(false) }
  }

  async function confirm() {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch("/api/user/phone-verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", phone: phone.trim(), code: code.trim(), asPinId: pinId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Verification failed")
      setVerified(true); setMsg("Verified! Your training is unlocked.")
      setTimeout(() => window.location.reload(), 900)
    } catch (e) { setMsg(e instanceof Error ? e.message : "Verification failed") } finally { setBusy(false) }
  }

  return (
    <div
      ref={ref}
      id="phone-section"
      className={
        "scroll-mt-24 rounded-xl border p-4 transition-all " +
        (flash ? "border-amber-400 bg-amber-50 ring-4 ring-amber-300/60 animate-pulse"
          : verified ? "border-emerald-300 bg-emerald-50/60" : "border-amber-300 bg-amber-50/60")
      }
    >
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-[#1E3A5F]" />
        <label className="text-sm font-semibold">Phone Number</label>
        {verified && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified — training unlocked
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Verify your phone to unlock the Closing Training videos and downloadable resources. We text you a code to confirm it&apos;s really you.
      </p>

      {verified ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> {phone} <span className="text-emerald-700 font-medium">verified</span>
        </div>
      ) : stage === "enter" ? (
        <>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="mt-2 bg-white" />
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
            onClick={sendCode}
            disabled={busy || !phone.trim() || !consent}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send verification code
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-xs text-slate-500">Code sent to {phone}.</p>
          <Input
            inputMode="numeric" maxLength={6} value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit code"
            className="mt-2 bg-white tracking-[0.4em] text-center text-lg font-bold"
          />
          <button
            onClick={confirm}
            disabled={busy || code.length < 6}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Verify &amp; unlock training
          </button>
          <button onClick={() => { setStage("enter"); setCode(""); setMsg(null) }} className="mt-2 text-xs text-slate-500 hover:underline">
            Change number / resend
          </button>
        </>
      )}
      {msg && <p className="mt-2 text-xs text-slate-600">{msg}</p>}
    </div>
  )
}
