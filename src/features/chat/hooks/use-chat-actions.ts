'use client'

import { useActionState, useCallback } from 'react'
import { useAuth } from '@/shared/contexts/auth-provider'
import type { PostMessageRequest } from '@/features/chat/types/conversation'

interface ChatActionState {
  loading: boolean
  error: string | null
  success: boolean
}

const initialState: ChatActionState = {
  loading: false,
  error: null,
  success: false,
}

export const useChatActions = (conversationId: string | null) => {
  const { token } = useAuth()

  const sendMessageAction = useCallback(
    async (prevState: ChatActionState, formData: FormData): Promise<ChatActionState> => {
      if (!token || !conversationId) {
        return {
          loading: false,
          error: 'No authentication token or conversation ID available',
          success: false,
        }
      }

      const content = formData.get('content') as string
      if (!content?.trim()) {
        return {
          loading: false,
          error: 'Message content is required',
          success: false,
        }
      }

      try {
        const messageData: PostMessageRequest = { content: content.trim() }

        const response = await fetch(`/api/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to send message')
        }

        return {
          loading: false,
          error: null,
          success: true,
        }
      } catch (err) {
        return {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to send message',
          success: false,
        }
      }
    },
    [token, conversationId]
  )

  const [state, formAction, isPending] = useActionState(sendMessageAction, initialState)

  return {
    state,
    formAction,
    isPending,
  }
}
