"use client"

import { useState, useEffect } from 'react'

interface AdminState {
  isAdmin: boolean
  isPrimaryAdmin: boolean
  loading: boolean
}

export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    isPrimaryAdmin: false,
    loading: true,
  })

  useEffect(() => {
    fetch('/api/user/role')
      .then(res => res.json())
      .then(data => {
        setState({
          isAdmin: data.isAdmin ?? false,
          isPrimaryAdmin: data.isPrimaryAdmin ?? false,
          loading: false,
        })
      })
      .catch(() => {
        setState({ isAdmin: false, isPrimaryAdmin: false, loading: false })
      })
  }, [])

  return state
}
