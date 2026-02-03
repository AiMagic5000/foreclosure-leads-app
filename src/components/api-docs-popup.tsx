"use client"

import { useState } from "react"
import { X, Mail, Shield } from "lucide-react"

export function ApiDocsPopup() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hover:text-[#1e3a5f] text-left"
      >
        API Docs
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8" />
                  <div>
                    <h2 className="text-xl font-bold">DNC Registry API</h2>
                    <p className="text-sm text-white/80">Available by Request</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Access our Do Not Call Registry API to integrate DNC scrubbing directly
                into your workflow. The API provides real-time lookups against both Federal
                and State Do Not Call lists.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">API Features:</h3>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold mt-0.5">-</span>
                    Real-time Federal DNC lookups
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold mt-0.5">-</span>
                    State-level DNC list scrubbing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold mt-0.5">-</span>
                    Batch processing (up to 10,000 numbers)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold mt-0.5">-</span>
                    TCPA compliance verification
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold mt-0.5">-</span>
                    JSON/REST endpoints with full documentation
                  </li>
                </ul>
              </div>

              <div className="bg-[#1e3a5f]/5 rounded-lg p-4 border border-[#1e3a5f]/20">
                <p className="text-sm text-gray-700 mb-3">
                  To request API access, contact our team:
                </p>
                <a
                  href="mailto:support@usforeclosurerecovery.com?subject=DNC%20Registry%20API%20Access%20Request"
                  className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2d4a6f] transition-colors w-full justify-center"
                >
                  <Mail className="h-4 w-4" />
                  support@usforeclosurerecovery.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
