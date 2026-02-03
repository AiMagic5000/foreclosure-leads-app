"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface DashboardWrapperProps {
  children: React.ReactNode
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasSelectedCounties, setHasSelectedCounties] = useState(false)

  useEffect(() => {
    // Check if user has selected counties
    const selectedCounties = localStorage.getItem('selectedCounties')

    if (!selectedCounties || JSON.parse(selectedCounties).length === 0) {
      // Redirect to county selection page
      router.push('/dashboard/select-counties')
    } else {
      setHasSelectedCounties(true)
      setIsLoading(false)
    }
  }, [router])

  if (isLoading && !hasSelectedCounties) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
