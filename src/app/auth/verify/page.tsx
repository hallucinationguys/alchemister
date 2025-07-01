import { Suspense } from 'react'
import VerifyClientComponent from './VerifyClientComponent'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function VerificationFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Preparing the verification page.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <VerifyClientComponent />
    </Suspense>
  )
}
