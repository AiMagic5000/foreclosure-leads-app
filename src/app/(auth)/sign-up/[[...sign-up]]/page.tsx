import { SignUp } from "@clerk/nextjs"
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Create Your Account | Foreclosure Recovery Inc.",
  description: "Sign up for the US Foreclosure Leads platform. Access foreclosure surplus fund leads, skip tracing, and outreach tools.",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#1e3a5f] via-[#dc2626] to-[#1e3a5f]" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/us-foreclosure-leads-logo.png"
              alt="US Foreclosure Leads"
              width={180}
              height={76}
              className="w-[160px] lg:w-[180px] h-auto"
            />
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span className="font-semibold text-[#1e3a5f]">(888) 545-8007</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#0f1e36] via-[#1e3a5f] to-[#0f1e36] py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-full pl-3 pr-5 py-2 mb-4">
            <span className="relative flex h-6 w-6">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-6 w-6 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="text-white text-xs font-semibold tracking-wide uppercase">Currently Accepting New Recovery Agents</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Start With Our Free Preview Account
          </h1>
          <p className="mt-3 text-blue-200/70 max-w-2xl mx-auto text-sm lg:text-base leading-relaxed">
            No credit card. No commitment. Explore the dashboard, see real leads, watch the full training, and attend our live webcast -- all before you invest a dollar.
          </p>
        </div>
      </div>

      {/* As Seen On */}
      <div className="bg-slate-50 border-b border-slate-200 py-5">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-3">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">As Seen On</p>
          <Image
            src="/as-seen-on-media.png"
            alt="As Seen On ABC, FOX, NBC, CBS, CW, Telemundo"
            width={500}
            height={50}
            className="w-full max-w-[420px] lg:max-w-[500px] h-auto opacity-70"
          />
        </div>
      </div>

      {/* Main Content — signup-first layout */}
      <div className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
        {/* Explainer Video — above signup */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-200 bg-black">
          <video
            controls
            playsInline
            preload="metadata"
            poster="/us-foreclosure-leads-logo.png"
            className="w-full aspect-video"
          >
            <source src="/explainer.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Sign Up Card (centered hero) */}
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
          {/* Card header */}
          <div className="bg-gradient-to-r from-[#0f1e36] via-[#1e3a5f] to-[#0f1e36] px-6 py-5 text-center border-b border-white/10">
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-300 text-[10px] font-bold tracking-[0.14em] uppercase">
                $0 · No Card Required
              </span>
            </div>
            <h2 className="text-white font-extrabold text-2xl tracking-tight">
              Create Your Free Preview Account
            </h2>
            <p className="text-blue-200/70 text-sm mt-1">
              Instant dashboard access. Full training included.
            </p>
          </div>

          {/* Clerk form — centered */}
          <div className="px-6 sm:px-10 py-8 flex justify-center">
            <div className="w-full max-w-[420px] [&_.cl-rootBox]:w-full [&_.cl-rootBox]:mx-auto [&_.cl-card]:w-full [&_.cl-cardBox]:w-full [&_.cl-main]:w-full [&_.cl-form]:w-full [&_.cl-socialButtonsBlockButton]:w-full">
              <SignUp
                forceRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "w-full mx-auto flex justify-center",
                    cardBox: "w-full max-w-none mx-auto shadow-none",
                    card: "bg-transparent shadow-none p-0 border-0 w-full max-w-none mx-auto",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    main: "w-full",
                    form: "w-full",
                    formButtonPrimary:
                      "bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold shadow-sm w-full",
                    formFieldLabel: "text-slate-600 text-sm font-medium",
                    formFieldInput:
                      "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#1e3a5f] focus:ring-[#1e3a5f] w-full",
                    formFieldRow: "w-full",
                    footer: "mx-auto",
                    footerAction: "text-slate-500 justify-center",
                    footerActionLink:
                      "text-[#dc2626] hover:text-[#b91c1c] font-semibold",
                    identityPreview: "bg-slate-50 border-slate-300",
                    identityPreviewText: "text-slate-900",
                    identityPreviewEditButton: "text-[#1e3a5f]",
                    socialButtonsBlockButton:
                      "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm w-full",
                    socialButtonsBlockButtonText: "text-slate-700 font-medium",
                    dividerLine: "bg-slate-200",
                    dividerText: "text-slate-400",
                    otpCodeFieldInput:
                      "bg-slate-50 border-slate-300 text-slate-900",
                    formFieldErrorText: "text-red-600",
                    alert: "bg-red-50 border-red-200 text-red-700",
                  },
                }}
              />
            </div>
          </div>

          {/* Card footer — sign in link */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-[#1e3a5f] hover:text-[#dc2626] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* What You Get — feature strip */}
        <div className="mt-10">
          <div className="text-center mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f] mb-2">
              What You Get, Free
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Full access to the platform
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              No payment, no commitment. Upgrade anytime from your dashboard.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                title: "Live Dashboard Preview",
                desc: "Explore the leads system, filters, and outreach tools.",
              },
              {
                title: "Full Training Series",
                desc: "Every training video, unlocked from day one.",
              },
              {
                title: "50 States Surplus Fund Guide",
                desc: "Claim windows, fee caps, and statute references.",
              },
              {
                title: "Live Webcast Access",
                desc: "Sessions run every 30 minutes with the recovery team.",
              },
              {
                title: "Real Leads, Real Workflows",
                desc: "See the data and automation before you invest.",
              },
              {
                title: "Zero Commitment",
                desc: "No credit card. Keep the account as long as you like.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-[#1e3a5f]/30 hover:shadow-sm transition-all"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[#1e3a5f]/10 flex items-center justify-center mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#1e3a5f]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {f.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partnerships */}
        <div className="mt-12">
          <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-[#1e3a5f] font-bold text-sm tracking-wide uppercase">
                Strategic Partnerships
              </h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              We are selectively partnering with{" "}
              <strong className="text-[#1e3a5f]">attorneys</strong>,{" "}
              <strong className="text-[#1e3a5f]">title companies</strong>, and{" "}
              <strong className="text-[#1e3a5f]">real estate investors</strong>{" "}
              who maintain a reputable business presence and are interested in
              accessing our lead pipeline as a parallel revenue stream.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              For attorneys: leads provided to our firm for claim filing are
              separate from any leads allocated to your independent operation.
              There is no conflict of interest -- you manage your own book of
              business independently.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              If you believe your firm or practice qualifies, contact us
              directly. We are not actively soliciting partnerships -- we have
              more opportunities than capacity. Priority is given to established
              operations with verifiable track records.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="bg-[#1e3a5f] py-6">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            { num: "44,990", label: "Monthly Foreclosures" },
            { num: "$3.2B", label: "Unclaimed Surplus" },
            { num: "30+", label: "States Covered" },
            { num: "127+", label: "Active Agents" },
          ].map((s, i) => (
            <div key={i} className="text-center px-2">
              <div className="text-white font-extrabold text-xl lg:text-2xl">{s.num}</div>
              <div className="text-blue-200/60 text-xs font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-slate-400 text-xs">
            Foreclosure Recovery Inc. -- 30 N Gould St, Ste R, Sheridan, WY 82801 -- (888) 545-8007
          </p>
          <p className="text-slate-300 text-xs mt-1">
            A nationally registered asset recovery administration firm.
          </p>
        </div>
      </footer>
    </div>
  )
}
