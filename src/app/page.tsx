'use client'

import { useAuth } from '@/shared/contexts/auth-provider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/chat')
      } else {
        router.push('/auth')
      }
    }
  }, [isAuthenticated, loading, router])

  return null
}
