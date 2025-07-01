'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function VerifyClientComponent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [verificationStatus, setVerificationStatus] = useState('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error')
      setErrorMessage('No verification token found in the URL.')
      return
    }

    async function verifyToken() {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed.')
        }

        if (data.data.access_token) {
          localStorage.setItem('access_token', data.data.access_token)
          setVerificationStatus('success')
          router.push('/dashboard')
        } else {
          throw new Error('No access token received.')
        }
      } catch (error: unknown) {
        setVerificationStatus('error')
        if (error instanceof Error) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('An unexpected error occurred.')
        }
      }
    }

    verifyToken()
  }, [token, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          {verificationStatus === 'verifying' && (
            <>
              <CardTitle>Verifying...</CardTitle>
              <CardDescription>Please wait while we verify your magic link.</CardDescription>
            </>
          )}
          {verificationStatus === 'success' && (
            <>
              <CardTitle className="text-green-600">Success!</CardTitle>
              <CardDescription>
                You have been successfully signed in. Redirecting you to the dashboard...
              </CardDescription>
            </>
          )}
          {verificationStatus === 'error' && (
            <>
              <CardTitle className="text-destructive">Verification Failed</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
      </Card>
    </div>
  )
}
