"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"

// Consent toggle for using uploaded payout-check images in marketing. Records
// consent via /api/user/check-proof-consent (mirrors the AI-agent consent flow).
export function CheckProofConsent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [consented, setConsented] = useState(false)
  const [at, setAt] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/user/check-proof-consent")
      .then((r) => r.json())
      .then((d) => {
        setConsented(!!d?.consented)
        setAt(d?.at || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/user/check-proof-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreed: true }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(d?.error || "Could not record consent. Please try again.")
        return
      }
      setConsented(true)
      setAt(d?.at || new Date().toISOString())
    } catch {
      setError("Could not record consent. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading consent status...
      </div>
    )
  }

  if (consented) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Consent on file{at ? ` (recorded ${new Date(at).toLocaleDateString()})` : ""}. We may add
          privacy markers to your uploaded checks and feature them on social media &amp; marketing as
          proof of payout.
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-3">
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-muted-foreground">
          I consent to <strong>Foreclosure Recovery Inc.</strong> adding privacy markers
          (redacting names, account numbers, and other sensitive details) to the check images I
          upload above, and to featuring those marked images on social media and marketing as proof
          of a claimant disbursement payout.
        </span>
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!checked || saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save consent
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
