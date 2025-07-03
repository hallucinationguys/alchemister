'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-provider'
import type { ConversationDetailResponse, PostMessageRequest, Message } from '../types/conversation'

interface ChatStreamEvent {
  content_delta: string
  tool_call?: unknown
  is_last: boolean
  error?: string
}

interface UseChatSessionOptions {
  conversationId: string | null
  autoFetch?: boolean
}

interface UseChatSessionResult {
  conversation: ConversationDetailResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  sendMessage: (data: PostMessageRequest) => Promise<void>
  streaming: boolean
  streamError: string | null
  streamingContent: string
  stopStreaming: () => void
}

export const useChatSession = (options: UseChatSessionOptions): UseChatSessionResult => {
  const { conversationId, autoFetch = true } = options
  const { token } = useAuth()

  // Base conversation state
  const [conversation, setConversation] = useState<ConversationDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Streaming state
  const [streaming, setStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')

  // References for managing streaming
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchConversation = useCallback(async () => {
    if (!token || !conversationId) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch conversation')
      }

      const data = await response.json()
      setConversation(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversation'
      setError(errorMessage)
      console.error('Error fetching conversation:', err)
    } finally {
      setLoading(false)
    }
  }, [token, conversationId])

  const refetch = useCallback(() => fetchConversation(), [fetchConversation])

  const sendMessage = useCallback(
    async (data: PostMessageRequest) => {
      if (!token || !conversationId) {
        setStreamError('No authentication token or conversation ID available')
        return
      }

      // Cancel any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      setStreaming(true)
      setStreamError(null)
      setStreamingContent('')

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(`/api/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to send message')
        }

        // Check if response is streaming
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('text/event-stream')) {
          // Handle Server-Sent Events
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('Failed to get response reader')
          }

          const decoder = new TextDecoder()
          let accumulatedContent = ''

          const handleStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read()

                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const eventData = JSON.parse(line.slice(6)) as ChatStreamEvent

                      console.log('SSE Event received:', eventData)

                      // Handle the ChatStreamEvent
                      if (eventData.error) {
                        throw new Error(eventData.error)
                      }

                      if (eventData.content_delta) {
                        accumulatedContent += eventData.content_delta
                        setStreamingContent(accumulatedContent)

                        console.log(
                          'Updating streaming content:',
                          accumulatedContent.length,
                          'characters'
                        )
                      }

                      if (eventData.is_last) {
                        console.log(
                          'Message ended. Final content length:',
                          accumulatedContent.length
                        )
                        // Clear streaming state
                        setStreamingContent('')

                        // Refetch conversation to get the final messages
                        await fetchConversation()
                        break
                      }
                    } catch (parseError) {
                      console.warn('Failed to parse SSE data:', line, parseError)
                    }
                  }
                }
              }
            } catch (streamErr) {
              if (streamErr instanceof Error && streamErr.name !== 'AbortError') {
                console.error('Stream error:', streamErr)
                setStreamError(streamErr.message)
              }
            }
          }

          await handleStream()
        } else {
          // Handle regular JSON response
          const result = await response.json()
          console.log('Message sent:', result)
          // Refetch conversation to get the updated messages
          await fetchConversation()
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          const errorMessage = err.message || 'Failed to send message'
          setStreamError(errorMessage)
          console.error('Error sending message:', err)
        }
      } finally {
        setStreaming(false)
        setStreamingContent('')
        abortControllerRef.current = null
      }
    },
    [token, conversationId, fetchConversation]
  )

  // Auto-fetch conversation on mount and when conversationId or token changes
  useEffect(() => {
    if (autoFetch && token && conversationId) {
      fetchConversation()
    }
  }, [autoFetch, token, conversationId, fetchConversation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setStreaming(false)
    setStreamError(null)
    setStreamingContent('')
  }

  return {
    conversation,
    loading,
    error,
    refetch,
    sendMessage,
    streaming,
    streamError,
    streamingContent,
    stopStreaming,
  }
}
