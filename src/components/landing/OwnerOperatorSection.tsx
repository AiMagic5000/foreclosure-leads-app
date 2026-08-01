"use client"

import { useAgentManager } from "@/components/agent-manager-modal"
import { Check, Phone, Crown, CalendarDays } from "lucide-react"
import { OwnerOpCountdown } from "@/components/owner-op-countdown"

const CALENDLY_URL = "https://calendly.com/coreypearson/30min"

const FEATURES = [
  "Your own brand, LLC, EIN, and business bank account — set up for you",
  "A white-label website you own, with 6 months of SEO and AI optimization",
  "The complete CRM built into your site — you own the code, no monthly rental",
  "Your first 2 months of leads FREE — skip-traced, DNC-screened, exclusive to you",
  "A dedicated VA for 2 months — runs your dashboard and trains you (or your VA) to take over",
  "2 live 2-hour screen-share sessions — we run the back office with you until it's second nature",
  "Our ad copy and ad training videos — the exact ads we use to generate agent leads",
  "Large-volume skip tracing + DNC scrubbing training — full independence",
  "One-click outreach: ringless voicemail, SMS, and ready-to-send email on every lead",
  "Your own 800 number, AI calling, e-sign and remote notary built in",
  "Attorney contingency network — sign, serve, and close without hiring a firm",
  "Keep 100% of your recovery fee on every claim",
]

/**
 * Home-page Owner Operator section: the full-business offer with the price-change
 * countdown, feature stack, Calendly consult, and enroll CTA.
 */
export function OwnerOperatorSection() {
  const { openAgentManager } = useAgentManager()
  return (
    <section id="owner-operator" className="bg-[#0f172a] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D82221]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300">
            <Crown className="h-3.5 w-3.5" /> Owner Operator Program
          </span>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black text-white sm:text-4xl">
            Stop renting your income. Own the whole recovery business.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            If you&apos;re the kind of person who was never going to work for someone else forever, this is the exit.
            Surplus recovery is a human-in-the-loop business by law &mdash; a court will not release a family&apos;s
            money to software &mdash; which makes it one of the few businesses AI makes stronger instead of obsolete.
            We hand you a working company: your brand, your LLC, your website, your CRM, your leads. You keep 100%
            of every recovery fee.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          {/* features */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Everything handed to you</p>
            <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                  <span className="text-sm text-slate-200">{f}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-400">
              This is not for someone collecting courses. It&apos;s for the person ready to run a firm &mdash; with us
              beside them until the wheels turn on their own.
            </p>
          </div>

          {/* pricing + countdown + CTAs */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white p-6">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-4xl font-black text-[#0f172a]">$7,495</div>
                  <div className="text-sm text-slate-500">or 4 payments of $1,874</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600 line-through decoration-2">$9,995 soon</div>
                  <div className="text-xs text-slate-500">4 payments of $2,498.75</div>
                </div>
              </div>
              <div className="mt-4">
                <OwnerOpCountdown />
              </div>
              <div className="mt-5 flex flex-col gap-2.5">
                <button type="button" onClick={openAgentManager} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-700">
                  Enroll &mdash; $1,874 Down (4 &times; $1,874)
                </button>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-base font-bold text-white transition hover:opacity-90"
                >
                  <CalendarDays className="h-5 w-5" /> Schedule a Consult
                </a>
                <a
                  href="tel:+18885458007"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-base font-semibold text-[#1E3A5F] transition hover:bg-slate-50"
                >
                  <Phone className="h-5 w-5" /> (888) 545-8007
                </a>
              </div>
            </div>
            <p className="text-center text-xs text-slate-400">
              Six months from now you&apos;re not an agent splitting fees &mdash; you&apos;re the firm keeping all of
              them. The only thing waiting changes is the price.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
