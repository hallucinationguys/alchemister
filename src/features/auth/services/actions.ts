'use server'

import { z } from 'zod'

const sendMagicLinkSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
})

export interface FormState {
  message: string
  errors?: {
    email?: string[]
  } | null
  success: boolean
}

export async function sendMagicLink(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = sendMagicLinkSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid email address.',
      success: false,
    }
  }

  const { email } = validatedFields.data

  try {
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const response = await fetch(`${api_url}/auth/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, purpose: 'login' }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        message: errorData.error?.message || 'Failed to send magic link.',
        errors: null,
        success: false,
      }
    }

    const data = await response.json()

    return {
      message: data.data.message || 'If this email is registered, a magic link has been sent.',
      errors: null,
      success: true,
    }
  } catch (_error) {
    return {
      message: 'Failed to send magic link. Please try again later.',
      success: false,
      errors: null,
    }
  }
}
