'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionState } from 'react'
import { sendMagicLink, type FormState } from '@/app/auth/actions'

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

  if (state.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Magic Link Sent</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Magic Link Login</CardTitle>
          <CardDescription>
            Enter your email below to receive a magic link to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <p className="text-sm font-medium text-destructive">{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
