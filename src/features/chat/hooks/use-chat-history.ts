'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/shared/contexts/auth-provider'
import type {
  ConversationSummaryResponse,
  CreateConversationRequest,
} from '@/features/chat/types/conversation'

interface UseChatHistoryOptions {
  limit?: number
  offset?: number
  autoFetch?: boolean
}

interface UseChatHistoryResult {
  conversations: ConversationSummaryResponse[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  startNewChat: (data: CreateConversationRequest) => Promise<ConversationSummaryResponse | null>
  updateConversationTitle: (id: string, title: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  hasMore: boolean
  loadMore: () => Promise<void>
}

export const useChatHistory = (options: UseChatHistoryOptions = {}): UseChatHistoryResult => {
  const { limit = 20, offset = 0, autoFetch = true } = options
  const { token } = useAuth()

  const [conversations, setConversations] = useState<ConversationSummaryResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentOffset, setCurrentOffset] = useState(offset)
  const [hasMore, setHasMore] = useState(true)

  const fetchConversations = useCallback(
    async (isLoadMore = false) => {
      if (!token) return

      setLoading(true)
      setError(null)

      try {
        const currentOffsetValue = isLoadMore ? currentOffset : 0
        const response = await fetch(`/chat/api?limit=${limit}&offset=${currentOffsetValue}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch conversations')
        }

        const data = await response.json()
        const newConversations = data.data || []

        if (isLoadMore) {
          setConversations(prev => [...prev, ...newConversations])
        } else {
          setConversations(newConversations)
          setCurrentOffset(0)
        }

        // Check if there are more conversations to load
        setHasMore(newConversations.length === limit)

        if (isLoadMore) {
          setCurrentOffset(prev => prev + limit)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations'
        setError(errorMessage)
        console.error('Error fetching conversations:', err)
      } finally {
        setLoading(false)
      }
    },
    [token, limit, currentOffset]
  )

  const refetch = useCallback(() => fetchConversations(false), [fetchConversations])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return fetchConversations(true)
    }
    return Promise.resolve()
  }, [fetchConversations, loading, hasMore])

  const startNewChat = useCallback(
    async (data: CreateConversationRequest): Promise<ConversationSummaryResponse | null> => {
      if (!token) {
        setError('No authentication token available')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/chat/api', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create conversation')
        }

        const result = await response.json()
        const newConversation = result.data

        // Add the new conversation to the beginning of the list
        setConversations(prev => [newConversation, ...prev])

        return newConversation
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation'
        setError(errorMessage)
        console.error('Error creating conversation:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  const updateConversationTitle = useCallback(
    async (id: string, title: string) => {
      if (!token) {
        setError('No authentication token available')
        return
      }

      try {
        const response = await fetch(`/chat/api/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update conversation title')
        }

        // Update the conversation title in local state
        setConversations(prev => prev.map(conv => (conv.id === id ? { ...conv, title } : conv)))
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update conversation title'
        setError(errorMessage)
        console.error('Error updating conversation title:', err)
        throw err
      }
    },
    [token]
  )

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!token) {
        setError('No authentication token available')
        return
      }

      try {
        const response = await fetch(`/chat/api/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete conversation')
        }

        // Remove the conversation from local state
        setConversations(prev => prev.filter(conv => conv.id !== id))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation'
        setError(errorMessage)
        console.error('Error deleting conversation:', err)
        throw err
      }
    },
    [token]
  )

  // Auto-fetch conversations on mount and when token changes
  useEffect(() => {
    if (autoFetch && token) {
      fetchConversations(false)
    }
  }, [autoFetch, token, fetchConversations])

  return {
    conversations,
    loading,
    error,
    refetch,
    startNewChat,
    updateConversationTitle,
    deleteConversation,
    hasMore,
    loadMore,
  }
}
