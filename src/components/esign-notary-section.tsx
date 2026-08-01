"use client"

import { useState } from "react"
import { usePin } from "@/lib/pin-context"
import { ChevronDown, ShieldCheck, PenLine, Video, MapPin } from "lucide-react"

// FAQ entries about the online e-sign (DocuSeal) + notary verification process.
const FAQ: { q: string; a: string }[] = [
  {
    q: "How does online signing work?",
    a: "When you create a claimant email from your leads, it now includes a green \"Review & Sign Online\" button. The claimant opens their agreement on their phone — already filled in with their name, property, and surplus — and signs with a finger in about two minutes. You get an instant SIGNED badge on that lead the moment they finish.",
  },
  {
    q: "Can they still sign a paper copy instead?",
    a: "Yes. The same email still has the agreement attached as a document. A claimant can print it, sign it, and send a clear photo back — that works exactly like before. Online signing is just the faster option.",
  },
  {
    q: "What happens right after a claimant signs?",
    a: "Signing (online or on paper) starts the claim. To make it airtight, we then verify the signature with a notary — we send a notary to the claimant's home or a public meeting place, or run a secure online video-notary session. That notarized signature is what lets us file with confidence.",
  },
  {
    q: "Do I have to arrange the notary myself?",
    a: "No. Once your claimant has signed, use the \"Request a Notary\" form above to tell us they're ready. Our team handles scheduling the in-person notary or sending the online video-notary link — and keeps you updated.",
  },
  {
    q: "In-person notary vs. online notary — which do I pick?",
    a: "Pick whichever the claimant prefers. In-person: we dispatch a notary to their home or a nearby public place. Online: we email the claimant a secure video-notary link they complete from their phone or computer. Both are valid; online is usually faster.",
  },
]

export function EsignNotarySection() {
  const { pinId } = usePin()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const [claimantName, setClaimantName] = useState("")
  const [claimantPhone, setClaimantPhone] = useState("")
  const [claimantAddress, setClaimantAddress] = useState("")
  const [notaryType, setNotaryType] = useState<"in_person" | "online">("in_person")
  const [signedVia, setSignedVia] = useState<"docuseal" | "physical" | "">("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimantName.trim()) {
      setResult({ ok: false, msg: "Please enter the claimant's name." })
      return
    }
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/notary-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorPinId: pinId,
          claimantName: claimantName.trim(),
          claimantPhone: claimantPhone.trim(),
          claimantAddress: claimantAddress.trim(),
          notaryType,
          signedVia,
          notes: notes.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: data.message || "Request sent." })
        setClaimantName(""); setClaimantPhone(""); setClaimantAddress(""); setNotes(""); setSignedVia("")
      } else {
        setResult({ ok: false, msg: data.error || "Could not submit. Please try again." })
      }
    } catch {
      setResult({ ok: false, msg: "Network error. Please try again." })
    }
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* FAQ — rendered below the Request a Notary box via flex order */}
      <div className="order-2">
        <div className="mb-3 flex items-center gap-2">
          <PenLine className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Online signing &amp; notary — how it works</h3>
        </div>
        <div className="space-y-2">
          {FAQ.map((f, i) => {
            const open = openFaq === i
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-slate-800"
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`h-4 w-4 flex-none text-slate-400 transition ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p className="px-4 pb-4 text-[14px] leading-6 text-slate-600">{f.a}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Notary request form */}
      <div className="order-1 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-5">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-semibold text-emerald-900">Request a Notary</h3>
        </div>
        <p className="mb-4 text-[13px] leading-5 text-emerald-900/80">
          Your claimant signed (online or on paper)? Tell us they&apos;re ready and we&apos;ll verify the signature —
          an in-person notary at their location, or a secure online video-notary session.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={claimantName} onChange={(e) => setClaimantName(e.target.value)}
              placeholder="Claimant name *"
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              value={claimantPhone} onChange={(e) => setClaimantPhone(e.target.value)}
              placeholder="Claimant phone"
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <input
            value={claimantAddress} onChange={(e) => setClaimantAddress(e.target.value)}
            placeholder="Claimant home address or public meeting place (for in-person)"
            className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNotaryType("in_person")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${notaryType === "in_person" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <MapPin className="h-4 w-4" /> In-person notary
            </button>
            <button
              type="button"
              onClick={() => setNotaryType("online")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${notaryType === "online" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <Video className="h-4 w-4" /> Online notary
            </button>
          </div>

          <select
            value={signedVia}
            onChange={(e) => setSignedVia(e.target.value as "docuseal" | "physical" | "")}
            className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">How did they sign? (optional)</option>
            <option value="docuseal">Signed online (DocuSeal)</option>
            <option value="physical">Signed a physical copy</option>
          </select>

          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything we should know — best time, gate code, second signer, etc. (optional)"
            rows={2}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            {submitting ? "Sending…" : "Request Notary"}
          </button>

          {result && (
            <p className={`text-sm font-medium ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.msg}</p>
          )}
        </form>
      </div>
    </div>
  )
}
