"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ArrowRight, Phone, ShieldCheck, Radio } from "lucide-react"

const NAV_LINKS = [
  { href: "#features", label: "Platform" },
  { href: "#pricing", label: "Pricing" },
  { href: "/states-guide", label: "Coverage" },
  { href: "/blog", label: "Intelligence" },
  { href: "#faq", label: "FAQ" },
] as const

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ————— Utility bar ————— */}
      <div className="hidden md:block bg-[#0B1A2E] text-white/80 border-b border-white/5">
        <div className="container mx-auto flex h-8 items-center justify-between px-4 text-[11px] font-medium tracking-wide">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="uppercase tracking-[0.14em] text-[10px] text-emerald-300/90">
                Live Data Feed
              </span>
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5 text-white/70">
              <Radio className="h-3 w-3" />
              <span className="font-mono text-[10px]">UPDATED 24 HRS AGO</span>
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5 text-white/70">
              <ShieldCheck className="h-3 w-3 text-sky-300" />
              <span className="uppercase tracking-[0.12em] text-[10px]">
                TCPA · DNC Scrubbed
              </span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="tel:8885458007"
              className="group inline-flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
            >
              <Phone className="h-3 w-3 text-red-400 group-hover:text-red-300" />
              <span className="font-mono text-[11px] tracking-tight">
                (888) 545-8007
              </span>
            </a>
            <span className="h-3 w-px bg-white/15" />
            <Link
              href="/sign-in"
              className="uppercase tracking-[0.14em] text-[10px] text-white/70 hover:text-white transition-colors"
            >
              Agent Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* ————— Main bar ————— */}
      <div
        className={`w-full border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/85 backdrop-blur-xl border-gray-200/70 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]"
            : "bg-white border-gray-100"
        }`}
      >
        <div className="container mx-auto flex h-[68px] items-center justify-between px-4">
          {/* Logo with serial-number plate */}
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/us-foreclosure-leads-logo.png"
              alt="US Foreclosure Leads"
              width={170}
              height={72}
              className="w-[150px] h-auto"
              priority
            />
            <div className="hidden lg:flex flex-col border-l border-gray-200 pl-3 leading-none">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-400">
                Terminal
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#1e3a5f] font-semibold mt-0.5">
                v2026.1
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-600 hover:text-[#0B1A2E] transition-colors"
              >
                {link.label}
                <span className="absolute left-1/2 -bottom-[22px] h-[2px] w-0 -translate-x-1/2 bg-red-600 transition-all duration-300 group-hover:w-[calc(100%-2rem)]" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/webcast"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B1A2E] hover:text-red-600 transition-colors"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-600" />
              </span>
              Live Webcast
            </Link>
            <Link href="/sign-up">
              <button className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-md bg-gradient-to-b from-[#1e3a5f] to-[#0B1A2E] px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(15,23,42,0.2),0_8px_24px_-12px_rgba(30,58,95,0.5)] transition-all hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_4px_rgba(15,23,42,0.25),0_12px_32px_-10px_rgba(30,58,95,0.6)] hover:-translate-y-[1px] active:translate-y-0">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                Request Access
                <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
          </div>

          {/* Mobile trigger */}
          <button
            className="md:hidden relative flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-[#0B1A2E] hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ————— Mobile drawer ————— */}
      <div
        className={`md:hidden fixed inset-0 top-0 z-40 transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#0B1A2E]/80 backdrop-blur-md"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-[88%] max-w-sm bg-gradient-to-b from-[#0B1A2E] via-[#0B1A2E] to-[#071220] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between h-[68px] px-5 border-b border-white/10">
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                Terminal
              </span>
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-300 font-semibold mt-1">
                v2026.1 · LIVE
              </span>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav list */}
          <nav className="flex flex-col px-5 py-6">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center justify-between py-4 border-b border-white/5"
                style={{
                  animation: mobileMenuOpen
                    ? `slideInRight 0.4s ease-out ${i * 60}ms both`
                    : undefined,
                }}
              >
                <span className="text-xl font-bold text-white group-hover:text-red-400 transition-colors tracking-tight">
                  {link.label}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 group-hover:border-red-400/40 group-hover:text-red-400 transition-all">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </nav>

          {/* Drawer footer */}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-6 border-t border-white/10 bg-black/20 backdrop-blur space-y-4">
            <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
              <button className="group relative w-full inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-b from-red-600 to-red-700 px-5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_24px_-8px_rgba(220,38,38,0.5)]">
                Request Access
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 border border-white/10 rounded-md hover:bg-white/5 transition-colors"
            >
              Agent Sign In
            </Link>
            <a
              href="tel:8885458007"
              className="flex items-center justify-center gap-2 pt-2 text-white/80 hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4 text-red-400" />
              <span className="font-mono text-sm tracking-tight">
                (888) 545-8007
              </span>
            </a>
            <div className="flex items-center justify-center gap-3 pt-2 text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
              <ShieldCheck className="h-3 w-3" />
              <span>TCPA · DNC Scrubbed · 24hr Updates</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </header>
  )
}
