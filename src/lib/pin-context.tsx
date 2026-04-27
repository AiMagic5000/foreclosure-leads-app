"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useUser } from "@clerk/nextjs"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

type AccountType = 'basic' | 'partnership' | 'owner_operator' | 'admin'

interface PinContextType {
  isVerified: boolean
  statesAccess: string[]
  isAdmin: boolean
  isOwnerOperator: boolean
  userRole: 'standard' | 'owner_operator' | 'admin'
  accountType: AccountType
  pinEmail: string | null
  pinId: string | null
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
  const [isOwnerOperator, setIsOwnerOperator] = useState(false)
  const [userRole, setUserRole] = useState<'standard' | 'owner_operator' | 'admin'>('standard')
  const [accountType, setAccountType] = useState<AccountType>('basic')
  const [pinEmail, setPinEmail] = useState<string | null>(null)
  const [pinId, setPinId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch account type from DB for all users on mount
  useEffect(() => {
    if (!isLoaded || !user) {
      if (isLoaded) setIsLoading(false)
      return
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()

    // Auto-verify admin by email
    if (userEmail === ADMIN_EMAIL.toLowerCase()) {
      setIsVerified(true)
      setStatesAccess(["ALL"])
      setIsAdmin(true)
      setIsOwnerOperator(false)
      setUserRole('admin')
      setAccountType('admin')
      setPinEmail(userEmail)
    }

    // Fetch account type from DB for ALL users (including admin)
    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => {
        let acctType = (data.accountType || 'basic') as AccountType

        // If user is admin via DB role, override accountType to admin
        if (data.isAdmin) {
          acctType = 'admin'
          setIsAdmin(true)
          setIsVerified(true)
          setStatesAccess(["ALL"])
          setUserRole('admin')
          setPinEmail(userEmail || null)
        }

        setAccountType(acctType)

        // If account_type is owner_operator, reflect that
        if (acctType === 'owner_operator') {
          setIsOwnerOperator(true)
        }

        // Set pinId and statesAccess from user_pins lookup
        if (data.pinId) {
          setPinId(data.pinId)
          setIsVerified(true)
          setPinEmail(userEmail || null)
        }
        if (data.statesAccess && data.statesAccess.length > 0) {
          setStatesAccess(data.statesAccess)
        }
      })
      .catch(() => {
        // silently fail, defaults are fine
      })
      .finally(() => {
        setIsLoading(false)
      })
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
        const role = data.role || 'standard'
        setIsOwnerOperator(role === 'owner_operator')
        setUserRole(data.isAdmin ? 'admin' : role)
        setPinEmail(email)
        setPinId(data.pinId || null)
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
    setIsOwnerOperator(false)
    setUserRole('standard')
    setPinEmail(null)
    setPinId(null)
  }, [])

  return (
    <PinContext.Provider
      value={{
        isVerified,
        statesAccess,
        isAdmin,
        isOwnerOperator,
        userRole,
        accountType,
        pinEmail,
        pinId,
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
