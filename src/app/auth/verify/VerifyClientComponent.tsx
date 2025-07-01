'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-provider'
import { CheckCircle2, AlertTriangle, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function VerifyClientComponent() {
  const searchParams = useSearchParams()
  const { login } = useAuth()
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
          setVerificationStatus('success')
          login(data.data.access_token)
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
  }, [token, login])

  return (
    <div className="mx-auto grid w-[350px] gap-6 text-center">
      {verificationStatus === 'verifying' && (
        <>
          <LoaderCircle className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Verifying...</h1>
            <p className="text-muted-foreground">Please wait while we verify your magic link.</p>
          </div>
        </>
      )}
      {verificationStatus === 'success' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Success!</h1>
            <p className="text-muted-foreground">
              You have been successfully signed in. Redirecting...
            </p>
          </div>
        </>
      )}
      {verificationStatus === 'error' && (
        <>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Verification Failed</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth">Go back to login</Link>
          </Button>
        </>
      )}
    </div>
  )
}
