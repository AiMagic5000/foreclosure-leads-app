"use client"

import { useState, useCallback } from "react"
import { KeyRound, X, Loader2 } from "lucide-react"
import { usePin } from "@/lib/pin-context"

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
  dark?: boolean
}

export function PinModal({ isOpen, onClose, onVerified, dark = false }: PinModalProps) {
  const { verifyPin } = usePin()
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !pin.trim()) {
      setError("Please enter both email and PIN.")
      return
    }

    setLoading(true)

    try {
      const result = await verifyPin(email.trim(), pin.trim().toUpperCase())

      if (result.valid) {
        setEmail("")
        setPin("")
        setError("")
        onVerified()
        onClose()
      } else {
        setError(result.error || "Invalid PIN. Please try again.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [email, pin, verifyPin, onVerified, onClose])

  const handlePinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
    setPin(value)
  }, [])

  if (!isOpen) return null

  const bgOverlay = "bg-black/60 backdrop-blur-sm"
  const cardBg = dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
  const textPrimary = dark ? "text-white" : "text-gray-900"
  const textSecondary = dark ? "text-gray-400" : "text-gray-600"
  const inputBg = dark
    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#1e3a5f]"
  const btnPrimary = dark
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${bgOverlay}`}>
      <div className={`relative w-full max-w-md rounded-xl border shadow-2xl ${cardBg}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-md transition-colors ${
            dark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              dark ? "bg-blue-600/20" : "bg-[#1e3a5f]/10"
            }`}>
              <KeyRound className={`h-5 w-5 ${dark ? "text-blue-400" : "text-[#1e3a5f]"}`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Enter Access PIN</h2>
              <p className={`text-sm ${textSecondary}`}>Verify your purchase to access leads</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin-email" className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>
                Email Address
              </label>
              <input
                id="pin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="pin-code" className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>
                Access PIN
              </label>
              <input
                id="pin-code"
                type="text"
                value={pin}
                onChange={handlePinChange}
                placeholder="8-character PIN"
                maxLength={8}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm font-mono tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
                disabled={loading}
                autoComplete="off"
              />
              <p className={`mt-1 text-xs ${textSecondary}`}>
                {pin.length}/8 characters
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || pin.length < 8}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnPrimary}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Verify PIN
                </>
              )}
            </button>
          </form>

          {/* Purchase link */}
          <div className={`mt-5 pt-4 border-t text-center ${dark ? "border-gray-700" : "border-gray-200"}`}>
            <p className={`text-sm ${textSecondary}`}>
              Need access?{" "}
              <a
                href="https://usforeclosureleads.gumroad.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium underline underline-offset-2 transition-colors ${
                  dark ? "text-blue-400 hover:text-blue-300" : "text-[#1e3a5f] hover:text-[#2d4a6f]"
                }`}
              >
                Purchase on Gumroad
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
