'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionState } from 'react'
import { sendMagicLink, type FormState } from '@/app/(auth)/actions'
import AuthLayout from '@/auth/AuthLayout'
import { MailCheck } from 'lucide-react'

const initialState: FormState = {
  message: '',
  errors: null,
  success: false,
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full" aria-disabled={isPending}>
      {isPending ? 'Sending...' : 'Send Magic Link'}
    </Button>
  )
}

export default function AuthPage() {
  const [state, formAction, isPending] = useActionState(sendMagicLink, initialState)

  return (
    <AuthLayout>
      <div className="mx-auto grid w-[350px] gap-6">
        {state.success ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <MailCheck className="h-16 w-16 text-green-500" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Magic Link Sent</h1>
              <p className="text-muted-foreground">{state.message}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Login</h1>
              <p className="text-balance text-muted-foreground">Enter your email below</p>
            </div>
            <form action={formAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="m@example.com" required />
                {state.errors?.email && (
                  <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>
                )}
              </div>
              <SubmitButton isPending={isPending} />
              {state.message && !state.errors && !state.success && (
                <p className="text-sm font-medium text-destructive text-center">{state.message}</p>
              )}
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
