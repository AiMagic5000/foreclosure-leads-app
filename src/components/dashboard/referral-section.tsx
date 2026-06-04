"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Gift, DollarSign, UserPlus, Loader2, CheckCircle2 } from "lucide-react"
import { usePin } from "@/lib/pin-context"

interface Referral {
  id: string
  referred_name: string | null
  referred_email: string | null
  status: string
  bonus_signup: number
  bonus_paid: number
  created_at: string
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  invited: { text: "Invited", cls: "bg-gray-100 text-gray-600" },
  signed_up: { text: "Paid plan (+$100)", cls: "bg-emerald-100 text-emerald-700" },
  paid: { text: "Paid out (+$500)", cls: "bg-emerald-600 text-white" },
}

export function ReferralSection() {
  const [referralCode, setReferralCode] = useState("")
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [earned, setEarned] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const { impersonating } = usePin()
  const asPinId = impersonating?.pinId

  const load = useCallback(async () => {
    const r = await fetch("/api/referrals" + (asPinId ? `?asPinId=${asPinId}` : ""))
    if (!r.ok) return
    const j = await r.json()
    setReferralCode(j.referralCode || "")
    setReferrals(j.referrals || [])
    setEarned(j.totalEarned || 0)
  }, [asPinId])
  useEffect(() => { load() }, [load])

  async function add() {
    if (!name.trim() && !email.trim()) { setMsg("Enter a name or email."); return }
    setSaving(true); setMsg(null)
    const r = await fetch("/api/referrals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, asPinId }),
    })
    const j = await r.json(); setSaving(false)
    if (!r.ok) { setMsg(j.error || "Failed"); return }
    setName(""); setEmail(""); setMsg("Referral added. We'll attribute it to you when they sign up.")
    load()
  }

  return (
    <Card className="lg:col-span-2 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-emerald-600" />
          <CardTitle>Refer &amp; Earn</CardTitle>
        </div>
        <CardDescription>
          Refer other agents to Foreclosure Recovery Inc. and get paid when they join and when their claims pay out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two columns: video + bonus notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg overflow-hidden border bg-black">
            <video
              className="w-full h-full object-cover"
              controls
              poster="/referral-poster.jpg"
              preload="none"
            >
              <source src="/referral-promo.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="rounded-lg border bg-emerald-50/60 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-3">Your Referral Bonuses</p>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0"><DollarSign className="h-5 w-5" /></div>
              <div>
                <p className="font-bold text-emerald-800">$100 when they go paid</p>
                <p className="text-sm text-muted-foreground">As soon as someone you refer upgrades to a paid plan, $100 is credited to you.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0"><DollarSign className="h-5 w-5" /></div>
              <div>
                <p className="font-bold text-emerald-800">$500 when their claim pays out</p>
                <p className="text-sm text-muted-foreground">When a claim from someone you signed up is paid out by the state, you earn another $500.</p>
              </div>
            </div>
            {referralCode && (
              <p className="text-sm">Your referral code: <span className="font-mono font-semibold text-emerald-700">{referralCode}</span></p>
            )}
            {earned > 0 && (
              <p className="text-sm mt-1">Earned so far: <span className="font-bold text-emerald-700">${earned.toLocaleString()}</span></p>
            )}
          </div>
        </div>

        {/* Manual referral entry */}
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="h-4 w-4 text-emerald-600" />
            <p className="font-semibold">Add someone you referred</p>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Enter their name or email so we can tag the signup to your referral code and credit your bonus.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button onClick={add} disabled={saving} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add referral
            </button>
          </div>
          {msg && <p className="text-sm mt-2 text-emerald-700">{msg}</p>}

          {referrals.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <table className="w-full text-sm">
                <thead className="text-gray-500"><tr><th className="text-left p-1">Name</th><th className="text-left p-1">Email</th><th className="text-left p-1">Status</th><th className="text-left p-1">Added</th></tr></thead>
                <tbody>
                  {referrals.map((r) => {
                    const s = STATUS_LABEL[r.status] || STATUS_LABEL.invited
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="p-1">{r.referred_name || "—"}</td>
                        <td className="p-1">{r.referred_email || "—"}</td>
                        <td className="p-1"><span className={`px-2 py-0.5 rounded-full text-xs ${s.cls}`}>{s.text}</span></td>
                        <td className="p-1 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
