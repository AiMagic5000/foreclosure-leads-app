'use client'

import { CheckCircle, Zap, ExternalLink, Phone } from 'lucide-react'
import Link from 'next/link'

const BRAND = {
  navy: '#09274c',
  navyDark: '#050d1a',
  gold: '#d4a84b',
  white: '#ffffff',
  green: '#10b981',
}

export default function ThankYouPage() {
  return (
    <div style={{ background: BRAND.navyDark }} className="min-h-screen text-white px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
            You Just Learned the Most Valuable Skill Online Today
          </h1>
          <p className="text-white/60 text-lg">Here is everything waiting for you right now.</p>
        </div>

        {/* Offer Recap */}
        <div className="space-y-6">
          {/* Free Account */}
          <div
            className="rounded-xl p-6 border"
            style={{ background: 'rgba(9,39,76,0.6)', borderColor: 'rgba(16,185,129,0.3)' }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: BRAND.green }} />
              <div>
                <h3 className="text-lg font-bold mb-1">Your free usforeclosureleads.com account is ACTIVE</h3>
                <p className="text-white/60 text-sm mb-3">Login details sent to your email</p>
                <a
                  href="https://usforeclosureleads.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition hover:opacity-90"
                  style={{ background: BRAND.green, color: BRAND.white }}
                >
                  LOG IN NOW <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Leads */}
          <div
            className="rounded-xl p-6 border"
            style={{ background: 'rgba(9,39,76,0.6)', borderColor: 'rgba(16,185,129,0.3)' }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: BRAND.green }} />
              <div>
                <h3 className="text-lg font-bold mb-1">25 pre-loaded surplus fund leads are in your account NOW</h3>
                <p className="text-white/60 text-sm">Your outreach automations are pre-configured. First campaign launches automatically.</p>
              </div>
            </div>
          </div>

          {/* Automations */}
          <div
            className="rounded-xl p-6 border"
            style={{ background: 'rgba(9,39,76,0.6)', borderColor: 'rgba(16,185,129,0.3)' }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: BRAND.green }} />
              <div>
                <h3 className="text-lg font-bold mb-1">Your outreach automations are pre-configured</h3>
                <p className="text-white/60 text-sm">First follow-up campaign launches automatically tomorrow.</p>
              </div>
            </div>
          </div>

          {/* Partnership CTA */}
          <div
            className="rounded-xl p-6 border"
            style={{ background: 'rgba(212,168,75,0.1)', borderColor: 'rgba(212,168,75,0.4)' }}
          >
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 shrink-0 mt-0.5" style={{ color: BRAND.gold }} />
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: BRAND.gold }}>
                  50/50 Partnership -- TODAY ONLY
                </h3>
                <p className="text-white/60 text-sm mb-4">Corey personally mentors you, splits all fees 50/50, provides leads, systems, and support. You bring the effort. He brings everything else.</p>
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition hover:opacity-90"
                  style={{ background: BRAND.gold, color: BRAND.navy }}
                >
                  APPLY NOW
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm mb-2">Questions? Reach out directly.</p>
          <a
            href="tel:+18885458007"
            className="inline-flex items-center gap-2 text-lg font-bold"
            style={{ color: BRAND.gold }}
          >
            <Phone className="w-5 h-5" />
            (888) 545-8007
          </a>
          <p className="text-white/30 text-sm mt-6">
            Foreclosure Recovery Inc. | support@usforeclosureleads.com
          </p>
        </div>
      </div>
    </div>
  )
}
