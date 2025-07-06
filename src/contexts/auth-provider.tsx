'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

const publicPaths = ['/login']

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    if (storedToken) {
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
    router.push('/login')
  }, [router])

  useEffect(() => {
    if (loading) return

    const isPublic = publicPaths.some(path => pathname.startsWith(path))

    if (!token && !isPublic) {
      logout()
    }
  }, [pathname, token, loading, logout])

  const login = (newToken: string) => {
    localStorage.setItem('access_token', newToken)
    setToken(newToken)
    router.push('/')
  }

  const value = {
    isAuthenticated: !!token,
    token,
    loading,
    login,
    logout,
  }

  if (loading) {
    return null // Or a global spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
