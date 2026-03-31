"use client"

import { useAdmin } from '@/lib/use-admin'
import { Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-blue-300/60 bg-gradient-to-br from-blue-50 via-blue-50 to-sky-50 shadow-[0_8px_30px_rgba(37,99,235,0.15)] backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 ring-4 ring-blue-200/50">
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-2">
              Senior Agent Access Only
            </h2>
            <p className="text-blue-800/70 text-sm leading-relaxed mb-4 sm:mb-6">
              This section is available to Senior Agents (Owner Operators) who have purchased the full business build package. Call us to get started.
            </p>
            <p className="text-blue-800/70 text-sm mb-5 sm:mb-6">
              <a href="tel:+18885458007" className="text-blue-700 font-bold hover:text-blue-900 underline underline-offset-2 decoration-blue-400/60 transition-colors">
                (888) 545-8007
              </a>
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 text-sm sm:text-base"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
