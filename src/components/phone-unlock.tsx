"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Input } from "@/components/ui/input"
import { Phone, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"

// Phone number for extension forwarding. The agent types their number and saves it — there
// is NO texted code (removed 2026-07-29: the code often never arrived on some carriers and
// left paid agents stuck). This number is what the phone system forwards their extension to.
// Training access is by paid tier and never depends on it. Flashes via ?flash=phone.
export function PhoneUnlock() {
  const { impersonating, isLoading, accountType, trainingUnlocked, isAdmin } = usePin()
  const pinId = impersonating?.pinId
  // Paid agents / admins / manually-unlocked accounts already have full training access —
  // a phone number is NOT required to watch it. Adding a number here is optional (SMS updates).
  const fullAccess = isAdmin || trainingUnlocked ||
    accountType === "partnership" || accountType === "owner_operator" || accountType === "junior_owner_operator"
  const q = pinId ? `?asPinId=${pinId}` : ""

  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("US")
  const [verified, setVerified] = useState(false)
  const [consent, setConsent] = useState(false)
  const [stage] = useState<"enter" | "code">("enter")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    // Wait until pin-context resolves who we're viewing as — otherwise the first
    // load fires without asPinId and leaks the real admin's phone into the view.
    if (isLoading) return
    try {
      const d = await (await fetch(`/api/user/profile-phone${q}`)).json()
      // Always set (clear when the target has none) so a stale value never sticks.
      setPhone(d.phone || "")
      setVerified(!!d.verified)
      setConsent(!!d.smsConsent)
    } catch { /* ignore */ }
  }, [q, isLoading])

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

  async function savePhone() {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch("/api/user/phone-verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", phone: phone.trim(), country, consent, asPinId: pinId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not save your number")
      setVerified(true)
      setMsg("Saved. Calls to your extension will now forward to this number.")
      setTimeout(() => window.location.reload(), 900)
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save your number") } finally { setBusy(false) }
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
        <label className="text-sm font-semibold">Phone Number <span className="font-normal text-muted-foreground">(optional)</span></label>
        {verified && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
          </span>
        )}
      </div>
      {fullAccess && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          Your Closing Training is fully unlocked. No phone number is required to watch it.
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {fullAccess
          ? "Adding a number here is optional — we only use it to send you calls, texts, and voicemail updates."
          : "Your free training modules are always available with no phone number needed. Adding a number is optional — we use it only to send you updates by call, text, and voicemail."}
      </p>

      {verified ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> {phone} <span className="text-emerald-700 font-medium">on file &mdash; your extension forwards here</span>
        </div>
      ) : stage === "enter" ? (
        <>
          <div className="mt-2 flex gap-2">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 text-sm"
              aria-label="Country"
            >
              <option value="US">🇺🇸 US +1</option>
              <option value="CA">🇨🇦 Canada +1</option>
              <option value="GB">🇬🇧 UK +44</option>
            </select>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={country === "GB" ? "7700 900000" : "(555) 123-4567"} className="flex-1 bg-white" />
          </div>
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
            onClick={savePhone}
            disabled={busy || !phone.trim() || !consent}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save my number
          </button>
        </>
      ) : null}
      {msg && <p className="mt-2 text-xs text-slate-600">{msg}</p>}
    </div>
  )
}
