"use client"

import { PaymentMethodsNote } from '@/components/payment-methods-note'
import { Check, Phone, FileText, Crown, Building2, Globe, ShieldCheck, ChevronDown, Play } from "lucide-react"

const AGENT_995_URL = "https://www.usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business"

// The standout features Corey walks through on the call — the reasons to upgrade.
const PRIMARY_FEATURES = [
  "Your own brand, LLC, EIN, and business bank account — set up for you",
  "A white-label website you own, fully refreshed with 6 months of SEO & AI optimization",
  "The complete built-in CRM wired into your site — you own the code, no $100+/mo rental",
  "Up to 50 skip-traced leads per week for 3 months — every lead has a phone and an email, guaranteed",
  "One-click outreach on every lead: ringless voicemail, SMS, and ready-to-send email",
  "Email drafts in English and Spanish with the contingency agreement pre-filled and attached",
  "Certified-letter button — prints and mails certified from our office, tracking sent back to you",
  "Voice cloning — your drip voicemails go out in your own voice",
  "AI inbound and outbound calling that sounds human, plus your own 800 number with extensions",
  "Claimant login portal — they verify their address, see funds owed, and a timed incentive countdown",
  "E-sign and remote online notary built in — claimants sign from their phone, fully court-valid",
  "Attorney contingency network and bidding portal through mytrustsoftware.com",
  "Sales Incentive Network — a complimentary Las Vegas trip plus grocery and restaurant savings to close claimants",
  "Automatic voicemail, SMS, and email drips for everyone who signs up on your site",
  "Mobile dashboard with live SMS — your whole company in your pocket",
  "Run on our own servers — no monthly third-party bills, and you can move it anytime",
]

// The rest of the build-out — everything else included, tucked into a dropdown.
const ADDITIONAL_FEATURES = [
  "Registered Agent Service (first year included)",
  "Operating Agreement & Bylaws",
  "DUNS & Bradstreet registration",
  "Business 800 number (2 months) and qualified business address (2 months)",
  "Domain and professional email (12 months included)",
  "Custom 10-page business website",
  "500+ business listing submissions",
  "Press release distribution to 400+ outlets",
  "Sub-agent recruitment system + white-label back end — sell the program, we run admin, you keep the difference",
  "The 2026 book of all 3,142 counties with full contact data — free to members",
  "Daily county FOIA pipeline plus skip tracing across multiple data repositories",
  "10% of every closed claim reinvested into lead enrichment (PI and local door-knock service)",
  "Tax Deeds and Pre-Foreclosure lead modules included",
  "State Rules cheat sheet and 50-state law guides",
  "Import and export your lead lists anytime, mapped straight into your automation",
  "Owner-operator discounts at startmybusiness.us (LLCs, trusts, 508s) and mytrustsoftware.com",
  "International ready — work claims in the UK, Mexico, and Canada",
  "Continuous dashboard updates shipped every week, included at no extra charge",
]

// Parts 1 & 2 render at the very top via the dashboard OVERVIEW tile (DashboardSectionVideo).
// Parts 3 & 4 sit lower, by the features.
const VIDEOS_FEATURES = [
  { src: "/videos/sign-serve-close-16x9.mp4", poster: "/videos/sign-serve-close-poster.jpg", tag: "Part 3", title: "Sign, Serve & Close", blurb: "Attorneys, signatures, certified mail, and the whole closing machine." },
  { src: "/videos/leads-that-convert-16x9.mp4", poster: "/videos/leads-that-convert-poster.jpg", tag: "Part 4", title: "Leads That Convert", blurb: "Lead quality, AI outreach, voice cloning, and 40 years of edge." },
]

type Vid = { src: string; poster: string; tag: string; title: string; blurb: string }
function VideoCard({ v }: { v: Vid }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-black">
        <video controls playsInline preload="metadata" poster={v.poster} className="absolute inset-0 h-full w-full">
          <source src={v.src} type="video/mp4" />
        </video>
      </div>
      <div className="p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#D82221]">{v.tag}</span>
        <h3 className="mt-0.5 font-bold text-[#0f172a]">{v.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{v.blurb}</p>
      </div>
    </div>
  )
}

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
              <a href="https://stan.store/alliepearson/p/owner-operator--complete-business-buildout" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-700">
                Enroll &mdash; $1,300 Down (4 &times; $1,300)
              </a>
              <a href="tel:+18885458007" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D82221] px-5 py-3 text-base font-bold text-white transition hover:opacity-90">
                <Phone className="h-5 w-5" /> Call to Upgrade &mdash; (888) 545-8007
              </a>
              <a href="https://www.usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-base font-semibold text-[#1E3A5F] transition hover:bg-slate-50">
                See the full program
              </a>
            </div>
            <div className="mt-4 max-w-lg">
              <PaymentMethodsNote compact />
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

      {/* What you get — primary features + Additional Features dropdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-[#0f172a]">Everything the Owner Operator program gives you</h2>
        <p className="mt-1 text-sm text-slate-600">A complete, compliant asset-recovery business &mdash; built for you and owned by you.</p>
        <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {PRIMARY_FEATURES.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              </span>
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>
        <details className="group mt-5 overflow-hidden rounded-xl border border-emerald-600 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-emerald-600 p-4 text-sm font-bold text-white transition hover:bg-emerald-700">
            <span>Additional features included <span className="font-normal text-emerald-100">({ADDITIONAL_FEATURES.length} more)</span></span>
            <ChevronDown className="h-4 w-4 flex-none text-white transition group-open:rotate-180" />
          </summary>
          <div className="grid gap-x-8 gap-y-3 p-4 sm:grid-cols-2">
            {ADDITIONAL_FEATURES.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-200">
                  <Check className="h-3.5 w-3.5 text-slate-600" />
                </span>
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Built-in CRM + Skip Trace Module */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-[#0f172a]">More Than a Website &mdash; Your Own Built-In CRM</h2>
        <p className="mt-1 text-sm text-slate-600">
          You don&apos;t just get a beautiful white-label website. The same <strong className="text-[#0f172a]">CRM</strong>{" "}
          <span className="text-slate-500">[Customer Relationship Management]</span> system you are using right now gets
          integrated directly into your own branded website &mdash; the command center you run your entire recovery business from.
        </p>
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>You own the CRM &mdash; you don&apos;t rent it.</strong> Most agents pay $100+ a month ($1,200+ a year) to
          third-party CRMs. Yours is your own code, included with your build-out and backed by ongoing support &mdash;
          saving you thousands over the life of your business.
        </div>
        <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            ["Lead Management", "Every lead organized, tracked, and worked from one dashboard."],
            ["Virtual Assistant Management", "Add your VAs, assign work, and keep your team moving."],
            ["Claimant Management", "Follow each claimant from first contact to funded recovery."],
            ["Built-In Communications", "Ringless voicemail, SMS, and ready-to-send email on each lead."],
            ["Skip Trace & Data Integrations", "Skip tracing, Do Not Call scrubbing, and property data, built in."],
            ["Import / Export Anytime", "Bring your own lists in, take your finished data out."],
          ].map(([t, d]) => (
            <div key={t} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              </span>
              <span className="text-sm text-slate-700"><strong className="text-[#0f172a]">{t}</strong> &mdash; {d}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">
            <strong>Add-On: One-Click Skip Tracing.</strong> After your 3 months of included leads, upload your own lists and
            skip trace + Do Not Call scrub them in one click &mdash; a month-to-month module you start or pause anytime.
          </p>
          <a
            href="https://seafile.alwaysencrypted.com/f/e68d39e251294d84abf1/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Read the Skip Trace Module breakdown (PDF)
          </a>
        </div>
      </div>

      {/* VSL series — Parts 3 & 4, by the features */}
      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">How you sign, serve, and get paid</h2>
            <p className="text-sm text-slate-600">Parts 3 &amp; 4 &mdash; the closing machine and the leads that feed it.</p>
          </div>
          <span className="hidden flex-none items-center gap-1.5 rounded-full bg-[#D82221]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D82221] sm:inline-flex">
            <Play className="h-3 w-3" /> Parts 3&ndash;4
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {VIDEOS_FEATURES.map((v) => <VideoCard key={v.src} v={v} />)}
        </div>
      </div>

      {/* Upgrade paths + pricing compare */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-[#0f172a]">Already a Partner?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Your $995 Agent Partnership credits toward Owner Operator — you only pay the difference.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="font-semibold text-[#0f172a]">Already a Partner</p>
              <p className="text-slate-600">$5,200 &minus; $995 (already paid) = <strong className="text-[#0f172a]">$4,205</strong> to upgrade</p>
              <p className="text-slate-500 text-xs">Or 4 payments of <strong className="text-[#0f172a]">$1,051</strong> — first payment is your down payment.</p>
              <a href="https://stan.store/alliepearson/p/owner-operator-upgrade" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700">Upgrade &mdash; $1,051 Down (4 &times; $1,051)</a>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <p className="font-semibold text-[#0f172a]">Partner + already own an LLC</p>
              <p className="text-slate-600">$5,200 &minus; $995 &minus; $500 (LLC) = <strong className="text-[#0f172a]">$3,705</strong> to upgrade</p>
              <p className="text-slate-500 text-xs">Or 4 payments of <strong className="text-[#0f172a]">$926</strong> — first payment is your down payment.</p>
              <a href="https://stan.store/alliepearson/p/owner-operator-upgrade--partner--you-own-your-l" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700">Upgrade &mdash; $926 Down (4 &times; $926)</a>
            </div>
            <p className="text-xs text-slate-500">Payment plans must be completed before website/build-out delivery.</p>
            <PaymentMethodsNote compact />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <a href={AGENT_995_URL} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-slate-200 p-3 transition hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer">
              <div className="text-xs font-semibold uppercase text-slate-500">Partnership</div>
              <div className="text-lg font-bold text-[#0f172a]">$995</div>
              <div className="text-xs text-slate-500">agent program</div>
            </a>
            <a href="https://stan.store/alliepearson/p/owner-operator--complete-business-buildout" target="_blank" rel="noopener noreferrer"
              className="rounded-lg border-2 border-[#D82221] p-3 text-center transition hover:bg-red-50 cursor-pointer">
              <div className="text-xs font-semibold uppercase text-[#D82221]">Owner Operator</div>
              <div className="text-lg font-bold text-[#0f172a]">$5,200</div>
              <div className="text-xs text-slate-500">4 x $1,300 &mdash; enroll</div>
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-bold text-amber-900">Website Delivery Policy</h3>
          <p className="mt-1 text-sm text-amber-800/90">
            Your custom white-label website, domain, and branding deliverables are contingent upon completion of all
            scheduled program payments. Training, lead access, legal documents, automation, and support are activated
            immediately upon your first payment.
          </p>
          <img
            src="/owner-operator-white-label-website-example.jpg"
            alt="Example white-label foreclosure recovery website built for Owner Operators"
            className="mt-4 w-full rounded-lg border border-amber-200 shadow-sm"
            loading="lazy"
          />
          <p className="mt-2 text-xs text-amber-800/70 text-center">Example of your custom white-label website</p>
          <a
            href="https://www.usforeclosurerecovery.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            See it live: usforeclosurerecovery.com
          </a>
          <p className="mt-2 text-xs text-amber-800/70 text-center">
            This is our claimant-facing site &mdash; the same site we point homeowners to during outreach.
          </p>
        </div>
      </div>

      {/* Next step: finish the Communications setup */}
      <div className="rounded-2xl border border-[#1a7a3a]/30 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1a7a3a]">Next step</p>
        <h2 className="mt-1 text-xl font-bold text-[#0f172a]">Finish setting up your Communications</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect your outreach so ringless voicemails and texts send under your own name. Record your voice for drips
          and add your SlyBroadcast + TextBee logins on My Account.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/dashboard/ringless-drips" className="inline-flex items-center gap-2 rounded-xl bg-[#1a7a3a] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
            <Phone className="h-4 w-4" /> Set up Ringless Drips
          </a>
          <a href="/dashboard/sms-messages" className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
            Set up SMS Messages
          </a>
          <a href="/dashboard/settings#slybroadcast" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:bg-slate-50">
            Add my logins in My Account
          </a>
        </div>
      </div>

      {/* Final CTA */}
      <div className="rounded-2xl bg-[#0f172a] p-6 text-center sm:p-8">
        <h2 className="text-2xl font-bold text-white">Ready to own the whole business?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
          Call our team and we&apos;ll walk you through the Owner Operator upgrade &mdash; your brand, your LLC, 100% of the commission.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href="https://stan.store/alliepearson/p/owner-operator--complete-business-buildout" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-lg font-bold text-white transition hover:bg-emerald-700">
            Enroll &mdash; $1,300 Down
          </a>
          <a href="tel:+18885458007" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D82221] px-6 py-3 text-lg font-bold text-white transition hover:opacity-90">
            <Phone className="h-5 w-5" /> (888) 545-8007
          </a>
        </div>
        <div className="mx-auto mt-4 max-w-lg">
          <PaymentMethodsNote compact />
        </div>
      </div>
    </div>
  )
}
