'use client'

import { useState } from 'react'
import { Zap, ArrowRight, Phone, CheckCircle } from 'lucide-react'

const BRAND = {
  navy: '#09274c',
  navyDark: '#050d1a',
  gold: '#d4a84b',
  white: '#ffffff',
  green: '#10b981',
}

export default function ApplyPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [experience, setExperience] = useState('')
  const [why, setWhy] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/webcast/partnership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, state, experienceLevel: experience, whyInterested: why }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ background: BRAND.navyDark }} className="min-h-screen flex items-center justify-center text-white px-4">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${BRAND.green}20` }}>
            <CheckCircle className="w-10 h-10" style={{ color: BRAND.green }} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Application Received!</h1>
          <p className="text-white/60 mb-6">Corey will personally review your application and reach out within 24 hours. Keep an eye on your email and phone.</p>
          <a href="tel:+18885458007" className="inline-flex items-center gap-2 font-bold text-lg" style={{ color: BRAND.gold }}>
            <Phone className="w-5 h-5" /> (888) 545-8007
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: BRAND.navyDark }} className="min-h-screen text-white px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 bg-red-600/20 text-red-400">
            <Zap className="w-3 h-3" /> TODAY ONLY -- LIMITED SPOTS
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            50/50 Partnership Application
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Corey personally mentors you, splits all fees 50/50, provides leads, systems, and support. You bring the effort. He brings everything else.
          </p>
        </div>

        <div
          className="rounded-2xl p-8 border"
          style={{ background: 'rgba(9,39,76,0.6)', borderColor: 'rgba(212,168,75,0.3)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Full Name *</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g., Virginia" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b]" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Experience Level</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#d4a84b]">
                <option value="" className="text-black">Select your experience</option>
                <option value="none" className="text-black">No prior experience</option>
                <option value="some" className="text-black">Some real estate knowledge</option>
                <option value="experienced" className="text-black">Experienced in recovery or real estate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Why are you interested?</label>
              <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#d4a84b] resize-none" />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              style={{ background: BRAND.gold, color: BRAND.navy }}
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <>
                  SUBMIT APPLICATION <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-8">
          Foreclosure Recovery Inc. | (888) 545-8007 | support@usforeclosureleads.com
        </p>
      </div>
    </div>
  )
}
