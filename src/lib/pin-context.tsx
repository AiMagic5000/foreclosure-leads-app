"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useUser } from "@clerk/nextjs"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

type AccountType = 'basic' | 'partnership' | 'junior_owner_operator' | 'owner_operator' | 'admin'

interface PinContextType {
  isVerified: boolean
  statesAccess: string[]
  isAdmin: boolean
  isOwnerOperator: boolean
  isFullOwnerOperator: boolean
  userRole: 'standard' | 'owner_operator' | 'admin'
  accountType: AccountType
  trainingUnlocked: boolean
  hasPhone: boolean
  pinEmail: string | null
  pinId: string | null
  isRealAdmin: boolean
  impersonating: { pinId: string; email: string; name: string } | null
  setImpersonation: (pinId: string) => void
  clearImpersonation: () => void
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
  const [isFullOwnerOperator, setIsFullOwnerOperator] = useState(false)
  const [userRole, setUserRole] = useState<'standard' | 'owner_operator' | 'admin'>('standard')
  const [accountType, setAccountType] = useState<AccountType>('basic')
  const [trainingUnlocked, setTrainingUnlocked] = useState(false)
  const [hasPhone, setHasPhone] = useState(false)
  const [pinEmail, setPinEmail] = useState<string | null>(null)
  const [pinId, setPinId] = useState<string | null>(null)
  const [impersonatePinId, setImpersonatePinId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("impersonate_pin_id") : null
  )
  const [isRealAdmin, setIsRealAdmin] = useState(false)
  const [impersonating, setImpersonating] = useState<{ pinId: string; email: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch account type from DB for all users on mount
  useEffect(() => {
    if (!isLoaded || !user) {
      if (isLoaded) setIsLoading(false)
      return
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()

    // Auto-verify admin by email
    if (userEmail === ADMIN_EMAIL.toLowerCase() && !impersonatePinId) {
      setIsVerified(true)
      setStatesAccess(["ALL"])
      setIsAdmin(true)
      setIsOwnerOperator(false)
      setIsFullOwnerOperator(true)
      setUserRole('admin')
      setAccountType('admin')
      setPinEmail(userEmail)
    }

    // Fetch account type from DB for ALL users (including admin)
    const url = "/api/user/role" + (impersonatePinId ? `?asPinId=${encodeURIComponent(impersonatePinId)}` : "")
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const acctType = (data.accountType || 'basic') as AccountType
        setIsRealAdmin(!!data.isRealAdmin)
        setImpersonating(data.impersonating || null)
        // Asked to impersonate but server denied (not admin / bad pin) -> drop it.
        if (impersonatePinId && !data.impersonating) {
          try { localStorage.removeItem("impersonate_pin_id") } catch {}
          setImpersonatePinId(null)
        }
        // Effective identity (self, or the impersonated user) drives every flag.
        setAccountType(acctType)
        setTrainingUnlocked(!!data.trainingUnlocked || !!data.isAdmin)
        setHasPhone(!!data.hasPhone)
        setIsAdmin(!!data.isAdmin)
        setIsOwnerOperator(acctType === 'owner_operator' || acctType === 'junior_owner_operator')
        setIsFullOwnerOperator(acctType === 'owner_operator' || acctType === 'admin' || !!data.isAdmin)
        setUserRole(data.isAdmin ? 'admin' : ((acctType === 'owner_operator' || acctType === 'junior_owner_operator') ? 'owner_operator' : 'standard'))
        if (data.pinId) {
          setPinId(data.pinId)
          setIsVerified(true)
          setPinEmail(data.email || userEmail || null)
        }
        if (data.statesAccess && data.statesAccess.length > 0) setStatesAccess(data.statesAccess)
        else if (acctType === 'admin') setStatesAccess(["ALL"])
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false)
      })
  }, [user, isLoaded, impersonatePinId])

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
        setIsFullOwnerOperator(role === 'owner_operator' || (data.isAdmin || false))
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
    setIsFullOwnerOperator(false)
    setUserRole('standard')
    setPinEmail(null)
    setPinId(null)
  }, [])

  const setImpersonation = useCallback((targetPinId: string) => {
    try { localStorage.setItem("impersonate_pin_id", targetPinId) } catch {}
    setImpersonatePinId(targetPinId)
  }, [])

  const clearImpersonation = useCallback(() => {
    try { localStorage.removeItem("impersonate_pin_id") } catch {}
    setImpersonatePinId(null)
  }, [])

  return (
    <PinContext.Provider
      value={{
        isVerified,
        statesAccess,
        isAdmin,
        isOwnerOperator,
        isFullOwnerOperator,
        userRole,
        accountType,
        trainingUnlocked,
        hasPhone,
        pinEmail,
        pinId,
        isRealAdmin,
        impersonating,
        setImpersonation,
        clearImpersonation,
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
