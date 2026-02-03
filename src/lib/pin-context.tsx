"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useUser } from "@clerk/nextjs"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

interface PinContextType {
  isVerified: boolean
  statesAccess: string[]
  isAdmin: boolean
  verifyPin: (email: string, pin: string) => Promise<{ valid: boolean; error?: string }>
  clearPin: () => void
  isLoading: boolean
}

const PinContext = createContext<PinContextType | null>(null)

export function PinProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser()
  const [isVerified, setIsVerified] = useState(false)
  const [statesAccess, setStatesAccess] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Auto-verify admin users on mount
  useEffect(() => {
    if (!isLoaded) return

    const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()

    if (userEmail === ADMIN_EMAIL.toLowerCase()) {
      setIsVerified(true)
      setStatesAccess(["ALL"])
      setIsAdmin(true)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }, [user, isLoaded])

  const verifyPin = useCallback(async (email: string, pin: string): Promise<{ valid: boolean; error?: string }> => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      })

      const data = await response.json()

      if (data.valid) {
        setIsVerified(true)
        setStatesAccess(data.states_access || [])
        setIsAdmin(data.isAdmin || false)
        return { valid: true }
      }

      return { valid: false, error: data.error || "Invalid PIN" }
    } catch {
      return { valid: false, error: "Failed to verify PIN. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearPin = useCallback(() => {
    setIsVerified(false)
    setStatesAccess([])
    setIsAdmin(false)
  }, [])

  return (
    <PinContext.Provider
      value={{
        isVerified,
        statesAccess,
        isAdmin,
        verifyPin,
        clearPin,
        isLoading,
      }}
    >
      {children}
    </PinContext.Provider>
  )
}

export function usePin() {
  const context = useContext(PinContext)

  if (!context) {
    throw new Error("usePin must be used within a PinProvider")
  }

  return context
}
