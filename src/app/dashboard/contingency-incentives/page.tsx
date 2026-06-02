"use client"

import { Gift, MessageSquare, Mail, Phone, Ticket, ArrowUpRight, Check } from "lucide-react"

const USE_CASES = [
  { icon: MessageSquare, title: "In your SMS", body: "Drop your incentive link in a text. A free Vegas getaway as a thank-you gives the homeowner a reason to reply and sign now." },
  { icon: Mail, title: "In your email draft", body: "Add the incentive link to your outreach email. It turns a cold claim notice into a warm, can't-lose offer." },
  { icon: Phone, title: "In your voice drop", body: "Mention the complimentary travel certificate in your ringless voicemail. It boosts callbacks and closes." },
]

const WHY = [
  "High perceived value — a Las Vegas hotel-casino getaway, free to the homeowner",
  "Costs you nothing per certificate — start with free credits",
  "Gives the claimant a reason to sign your agreement today, not later",
  "Works on every channel: SMS, email, and voice drop",
]

export default function ContingencyIncentivesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2563eb 0%,#2563eb 50%,#D82221 50%,#D82221 100%)" }} />
        <div className="p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2563eb]">
            <Gift className="h-3.5 w-3.5" /> Contingency Incentives
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold text-[#0f172a] sm:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
            Close more deals with a free incentive to offer.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Sign up free with <strong className="text-[#0f172a]">Sales Incentive Network</strong> and get
            <strong className="text-[#0f172a]"> free certificate credits</strong>. Hand homeowners a complimentary
            travel certificate when you reach out &mdash; it gives them a reason to sign your contingency agreement now,
            and pushes the needle on more closed deals.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://salesincentivenetwork.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-base font-bold text-white transition hover:opacity-90">
              Sign Up Free &amp; Get Certificate Credits <ArrowUpRight className="h-5 w-5" />
            </a>
            <a href="https://salesincentivenetwork.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-base font-semibold text-[#1E3A5F] transition hover:bg-slate-50">
              Become an Affiliate
            </a>
          </div>
        </div>
      </div>

      {/* How agents use it */}
      <div>
        <h2 className="text-xl font-bold text-[#0f172a]">How to use it in your outreach</h2>
        <p className="mt-1 text-sm text-slate-600">Sign up as an affiliate, get your incentive links, and drop them anywhere you reach a homeowner.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {USE_CASES.map((u) => (
            <div key={u.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb]/10">
                <u.icon className="h-5 w-5 text-[#2563eb]" />
              </div>
              <h3 className="mt-3 font-semibold text-[#0f172a]">{u.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{u.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The certificate */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[#D82221]">
            <Ticket className="h-5 w-5" />
            <h3 className="font-bold text-[#0f172a]">What the homeowner gets</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            A vacation certificate &mdash; <strong className="text-[#0f172a]">3 days / 2 nights at a major Las Vegas
            hotel-casino</strong> on or near the Strip. Delivered by email, transferable for 12 months. Hotels offer
            these to fill rooms, so the perceived value is high while your cost stays low.
          </p>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Gold Ticket</div>
              <div className="mt-1 text-xs text-amber-800/80">Premium Strip stay</div>
            </div>
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Silver Ticket</div>
              <div className="mt-1 text-xs text-slate-500">Near-Strip stay</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-[#0f172a]">Why incentives close deals</h3>
          <ul className="mt-3 space-y-2.5">
            {WHY.map((w) => (
              <li key={w} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-[#0f172a] p-6 text-center sm:p-8">
        <h2 className="text-2xl font-bold text-white">Get your free certificate credits</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
          Sign up with Sales Incentive Network, grab your affiliate incentive links, and start handing homeowners
          a reason to say yes. No inventory, no experience needed.
        </p>
        <a href="https://salesincentivenetwork.com/" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 py-3 text-lg font-bold text-white transition hover:opacity-90">
          Go to Sales Incentive Network <ArrowUpRight className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
