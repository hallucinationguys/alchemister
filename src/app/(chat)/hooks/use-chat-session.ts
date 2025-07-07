'use client'

import { useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/auth-provider'
import { useChatStore } from '../stores/chat-store'
import { useNotificationStore } from '../stores/notification-store'
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
  streamingContent: string
  stopStreaming: () => void
}

export const useChatSession = (options: UseChatSessionOptions): UseChatSessionResult => {
  const { conversationId, autoFetch = true } = options
  const { token } = useAuth()

  // Zustand stores
  const {
    getCurrentConversation,
    getConversation,
    setCurrentConversation,
    setConversation,
    addMessage,
    updateMessage,
    loading,
    error,
    setLoading,
    setError,
    streaming,
    startStreaming,
    updateStreamingContent,
    finalizeStreaming,
    stopStreaming: stopStreamingStore,
  } = useChatStore()

  const { showError, showStreamError } = useNotificationStore()

  // References for managing streaming and batching
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingBufferRef = useRef('')
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Constants for performance optimization
  const FLUSH_INTERVAL_MS = 50 // Batch updates every 50ms
  const CHUNK_SIZE_THRESHOLD = 5 // Or flush when we have 5+ characters

  // Set current conversation when conversationId changes
  useEffect(() => {
    setCurrentConversation(conversationId)
  }, [conversationId, setCurrentConversation])

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
      showError(errorMessage)
      console.error('Error fetching conversation:', err)
    } finally {
      setLoading(false)
    }
  }, [token, conversationId, setLoading, setError, setConversation, showError])

  const refetch = useCallback(() => fetchConversation(), [fetchConversation])

  // Optimized flush function for batched updates
  const flushStreamingBuffer = useCallback(() => {
    if (streamingBufferRef.current) {
      updateStreamingContent(streamingBufferRef.current)

      // Clear the flush timer
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
    }
  }, [updateStreamingContent])

  // Cleanup function for streaming
  const cleanupStreaming = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }

    if (abortControllerRef.current) {
      abortControllerRef.current = null
    }
  }, [])

  const sendMessage = useCallback(
    async (data: PostMessageRequest) => {
      if (!token || !conversationId) {
        showError('No authentication token or conversation ID available')
        return
      }

      // Cancel any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Reset streaming state
      cleanupStreaming()
      streamingBufferRef.current = ''

      const userMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        role: 'user',
        content: data.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        artifacts: [],
      }

      // Add user message immediately
      addMessage(conversationId, userMessage)

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
          const errorMessage = errorData.error || 'Failed to send message'
          showError(errorMessage)
          throw new Error(errorMessage)
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
          const assistantMessageId = uuidv4()

          // Start streaming state
          startStreaming(conversationId, assistantMessageId)

          // Add a placeholder for the assistant's message
          const assistantMessage: Message = {
            id: assistantMessageId,
            conversation_id: conversationId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          addMessage(conversationId, assistantMessage)

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

                      // Handle the ChatStreamEvent
                      if (eventData.error) {
                        showStreamError(eventData.error, () => {
                          // Retry by calling sendMessage again
                          sendMessage(data)
                        })
                        cleanupStreaming()
                        stopStreamingStore()
                        return
                      }

                      if (eventData.content_delta) {
                        streamingBufferRef.current += eventData.content_delta

                        // Batched update strategy for performance
                        if (
                          streamingBufferRef.current.length >= CHUNK_SIZE_THRESHOLD ||
                          !flushTimerRef.current
                        ) {
                          // Immediate flush if buffer is large enough
                          if (streamingBufferRef.current.length >= CHUNK_SIZE_THRESHOLD) {
                            flushStreamingBuffer()
                          } else {
                            // Schedule a batched update
                            if (flushTimerRef.current) {
                              clearTimeout(flushTimerRef.current)
                            }
                            flushTimerRef.current = setTimeout(
                              flushStreamingBuffer,
                              FLUSH_INTERVAL_MS
                            )
                          }
                        }
                      }

                      if (eventData.is_last) {
                        // Final flush and finalize streaming
                        flushStreamingBuffer()

                        finalizeStreaming(streamingBufferRef.current)

                        cleanupStreaming()
                        return
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
                showStreamError(streamErr.message, () => {
                  sendMessage(data)
                })
              }
              cleanupStreaming()
              stopStreamingStore()
            }
          }

          await handleStream()
        } else {
          // Handle regular JSON response
          await fetchConversation()
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          const errorMessage = err.message || 'Failed to send message'
          showError(errorMessage)
          console.error('Error sending message:', err)
        }
        cleanupStreaming()
        stopStreamingStore()
      }
    },
    [
      token,
      conversationId,
      addMessage,
      startStreaming,
      finalizeStreaming,
      stopStreamingStore,
      showError,
      showStreamError,
      cleanupStreaming,
      flushStreamingBuffer,
      fetchConversation,
    ]
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
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
      }
    }
  }, [])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    cleanupStreaming()
    stopStreamingStore()
  }, [cleanupStreaming, stopStreamingStore])

  return {
    conversation: getCurrentConversation(),
    loading,
    error,
    refetch,
    sendMessage,
    streaming: streaming.isStreaming,
    streamingContent: streaming.streamingContent,
    stopStreaming,
  }
}
