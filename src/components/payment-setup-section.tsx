"use client"

import { useState } from "react"
import { Wallet, ChevronDown, Building2, User, HelpCircle } from "lucide-react"
import { FileFolder } from "@/components/file-folder"
import { DocumentUploader } from "@/components/document-uploader"

// Documents provided for download (the "visual folder" pattern used elsewhere).
const DOWNLOADS = [
  { label: "IRS Form W-9", href: "/payment-docs/IRS-Form-W-9.pdf" },
  { label: "Direct Deposit Form", href: "/payment-docs/Direct-Deposit-Authorization.pdf" },
]

// Q&A that sub-drops per question — how to fill out the payment documents.
const QA = [
  {
    q: "Should I get paid as an individual (1099) or as my LLC?",
    a: "Either works. If you want commissions paid to you personally, complete the W-9 with your name and Social Security Number. If you want them paid to your business, complete the W-9 with your LLC's legal name and its EIN. Use whichever matches how you file taxes.",
  },
  {
    q: "How do I fill out the W-9?",
    a: "Line 1: your full legal name (individuals) — or the LLC's legal name if paying the business. Line 2: business/DBA name if different. Line 3: check your federal tax classification (Individual/Sole proprietor, or LLC and its tax type). Part I: your SSN (individual) or EIN (LLC). Part II: sign and date. Leave anything that doesn't apply blank.",
  },
  {
    q: "What is the Direct Deposit Form for?",
    a: "It tells us where to send your money. Fill in the payee name (you or your LLC), your bank name, the 9-digit routing number, your account number, and the account type (checking or savings), then sign and date it. This lets us pay you by ACH instead of a mailed check.",
  },
  {
    q: "Where do I find my routing and account numbers?",
    a: "They're printed along the bottom of a check — routing number first (9 digits), then your account number. No checks? Your bank's app or website shows both under account details, and your bank can confirm them.",
  },
  {
    q: "Is my information secure?",
    a: "Yes. Your documents are stored privately under your account and are only visible to you and our payment team. We use them solely to set up and process your commission payments.",
  },
  {
    q: "What happens after I upload?",
    a: "You and our office both get an email confirming the upload. Our team reviews your W-9 and deposit details, sets up your payment profile, and reaches out if anything needs a second look. Nothing else is needed from you.",
  },
]

const ATTESTATION =
  "I confirm the information provided on this document is true and accurate to the best of my knowledge."

export function PaymentSetupSection() {
  const [qaOpen, setQaOpen] = useState(false)
  const [openQ, setOpenQ] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-[#1E3A5F]">Get Paid — Payment Setup</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set up how you receive your recovered commissions. Choose to be paid as an individual
          (1099) or have your business (LLC) paid. Download the forms below, complete them, and
          upload them back here.
        </p>
      </div>

      {/* Two ways to get paid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 font-semibold text-[#1E3A5F]">
            <User className="h-4 w-4 text-emerald-600" /> Paid as an individual (1099)
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Complete the W-9 with your name and Social Security Number. You&apos;ll receive a 1099 for
            your earnings.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 font-semibold text-[#1E3A5F]">
            <Building2 className="h-4 w-4 text-emerald-600" /> Paid to your LLC
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Complete the W-9 with your LLC&apos;s legal name and EIN. Payments go to your business
            account.
          </p>
        </div>
      </div>

      {/* Download the forms — green "visual folder" pattern */}
      <div>
        <h3 className="mb-5 text-sm font-semibold text-slate-700">1. Download &amp; complete your forms</h3>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-6 pt-3 sm:grid-cols-3">
          {DOWNLOADS.map((d) => (
            <FileFolder
              key={d.href}
              label={d.label}
              variant="green"
              onDownload={() => window.open(d.href, "_blank")}
            />
          ))}
        </div>
      </div>

      {/* Common Q&A — outer dropdown that sub-drops per question */}
      <div className="rounded-xl border border-slate-200">
        <button
          onClick={() => setQaOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 font-semibold text-[#1E3A5F]">
            <HelpCircle className="h-4 w-4 text-emerald-600" /> Common questions — filling out the documents
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${qaOpen ? "rotate-180" : ""}`} />
        </button>
        {qaOpen && (
          <div className="space-y-1 border-t border-slate-100 px-2 py-2">
            {QA.map((item, i) => (
              <div key={i} className="rounded-lg">
                <button
                  onClick={() => setOpenQ(openQ === i ? null : i)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`h-4 w-4 flex-none text-slate-400 transition-transform ${openQ === i ? "rotate-180" : ""}`} />
                </button>
                {openQ === i && (
                  <p className="px-3 pb-3 pt-0.5 text-sm leading-relaxed text-slate-600">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload completed forms — green folders, attestation gate, agent+admin notified */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-700">2. Upload your completed forms</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Upload your signed W-9 and Direct Deposit form (or LLC documents). You and our office both
          get an email confirmation on a successful upload.
        </p>
        <DocumentUploader folder="payment-1099" accept="application/pdf,image/*" variant="green" attestation={ATTESTATION} />
      </div>
    </div>
  )
}
