"use client"

import { Check, Phone, FileText, Crown, Building2, Globe, ShieldCheck } from "lucide-react"

const BUILD_OUT = [
  "Registered Agent Service (first year included)",
  "Operating Agreement & Bylaws",
  "DUNS & Bradstreet Registration",
  "Business 800 Number (2 months included)",
  "Qualified Business Address (2 months included)",
  "Domain & Professional Email (12 months included)",
  "Custom 10-Page Business Website (you own it)",
  "6 Months FREE SEO & AI Optimization",
  "500+ Business Listing Submissions",
  "Press Release distribution (400+ outlets)",
  "Sub-agent recruitment system",
  "Full business dashboard",
]

const HEADLINE_INCLUDES = [
  { icon: Globe, label: "Full white-label website clone" },
  { icon: Building2, label: "Wyoming LLC formation" },
  { icon: FileText, label: "EIN procurement" },
  { icon: ShieldCheck, label: "Business bank account setup" },
]

export default function OwnerOperatorPage() {
  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2563eb 0%,#2563eb 50%,#D82221 50%,#D82221 100%)" }} />
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D82221]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D82221]">
              <Crown className="h-3.5 w-3.5" /> Owner Operator Program
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold text-[#0f172a] sm:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
              Your own brand, your own LLC, your own business.
            </h1>
            <p className="mt-3 text-slate-600">
              The complete business build-out. You keep <strong className="text-[#0f172a]">100%</strong> of the recovery
              fee &mdash; up to 30% (some states like Texas cap recovery agents at 20%).
            </p>
            <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <div className="text-3xl font-bold text-[#0f172a]">$5,200</div>
                <div className="text-sm text-slate-500">or 4 payments of $1,300</div>
              </div>
              <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                Keep 100% of your recovery fee
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="tel:+18885458007" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D82221] px-5 py-3 text-base font-bold text-white transition hover:opacity-90">
                <Phone className="h-5 w-5" /> Call to Upgrade &mdash; (888) 545-8007
              </a>
              <a href="https://www.usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-base font-semibold text-[#1E3A5F] transition hover:bg-slate-50">
                See the full program
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Everything in Partnership, plus</p>
              <ul className="mt-3 space-y-2.5">
                {HEADLINE_INCLUDES.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 text-sm font-medium text-[#0f172a]">
                    <it.icon className="h-4 w-4 flex-none text-[#2563eb]" /> {it.label}
                  </li>
                ))}
              </ul>
            </div>
            {/* Build-out is delivered by Start My Business Inc. */}
            <a
              href="https://www.startmybusiness.us/"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-auto block overflow-hidden rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md"
            >
              <img
                src="/images/build-your-exit-start-my-business.webp"
                alt="We build your exit — business build-out by Start My Business Inc"
                width={720}
                height={402}
                className="w-full"
              />
              <span className="block bg-white px-3 py-2 text-xs font-medium text-slate-500 group-hover:text-[#2563eb]">
                Build-out delivered by Start My Business Inc &middot; startmybusiness.us
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* 45-point build-out */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-[#0f172a]">The 45-Point Compliance Build-Out</h2>
        <p className="mt-1 text-sm text-slate-600">A complete, compliant asset-recovery business &mdash; built for you and owned by you.</p>
        <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {BUILD_OUT.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              </span>
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade paths + pricing compare */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-[#0f172a]">Already a Partner?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Upgrade to Owner Operator for just <strong className="text-[#0f172a]">$4,205</strong> (the difference).
            Payment plans must be completed first. <strong>Already have an LLC?</strong> Save $500.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Partnership</div>
              <div className="text-lg font-bold text-[#0f172a]">$995</div>
              <div className="text-xs text-slate-500">agent program</div>
            </div>
            <div className="rounded-lg border-2 border-[#D82221] p-3">
              <div className="text-xs font-semibold uppercase text-[#D82221]">Owner Operator</div>
              <div className="text-lg font-bold text-[#0f172a]">$5,200</div>
              <div className="text-xs text-slate-500">4 x $1,300</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-bold text-amber-900">Website Delivery Policy</h3>
          <p className="mt-1 text-sm text-amber-800/90">
            Your custom white-label website, domain, and branding deliverables are contingent upon completion of all
            scheduled program payments. Training, lead access, legal documents, automation, and support are activated
            immediately upon your first payment.
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="rounded-2xl bg-[#0f172a] p-6 text-center sm:p-8">
        <h2 className="text-2xl font-bold text-white">Ready to own the whole business?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
          Call our team and we&apos;ll walk you through the Owner Operator upgrade &mdash; your brand, your LLC, 100% of the commission.
        </p>
        <a href="tel:+18885458007" className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#D82221] px-6 py-3 text-lg font-bold text-white transition hover:opacity-90">
          <Phone className="h-5 w-5" /> (888) 545-8007
        </a>
      </div>
    </div>
  )
}
