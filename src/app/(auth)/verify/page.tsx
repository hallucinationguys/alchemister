import { Suspense } from 'react'
import VerifyClientComponent from './VerifyClientComponent'
import AuthLayout from '../AuthLayout'
import { LoaderCircle } from 'lucide-react'

function VerificationFallback() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <LoaderCircle className="h-12 w-12 animate-spin text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Loading...</h1>
        <p className="text-muted-foreground">Preparing the verification page.</p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<VerificationFallback />}>
        <VerifyClientComponent />
      </Suspense>
    </AuthLayout>
  )
}
