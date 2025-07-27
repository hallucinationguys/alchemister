'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useStreamingState } from '@/features/chat/hooks/use-streaming-state'
import {
  useConversation,
  useCreateConversation,
  useUpdateConversation,
} from '@/features/chat/queries/useConversation'
import { useSendMessage } from '@/features/chat/queries/useMessage'
import { useProviders } from '@/features/chat/hooks/use-providers'
import { type ApiError } from '@/lib/react-query/errorHandling'
import type {
  Message,
  StreamEvent,
  PostMessageRequest,
  ConversationDetailResponse,
  CreateConversationRequest,
} from '@/features/chat/types/conversation'

interface UseChatOptions {
  conversationId?: string
  autoFetch?: boolean
  fetchOnMount?: boolean
}

interface UseChatReturn {
  // Conversation data
  conversation: ConversationDetailResponse | null
  messages: Message[]

  // Loading states
  loading: boolean
  error: string | null

  // Streaming states
  streaming: {
    isStreaming: boolean
    streamingContent: string
    streamingMessageId: string | null
  }

  // Actions
  sendMessage: (content: string) => Promise<void>
  stopStreaming: () => void
  createConversation: (data: CreateConversationRequest) => Promise<string>
  updateConversation: (updates: Partial<CreateConversationRequest>) => Promise<void>

  // Stream event handler
  handleStreamEvent: (event: StreamEvent) => void
}

/**
 * A hook that provides chat functionality with streaming support
 *
 * This hook manages the entire chat experience including:
 * - Fetching and displaying conversations
 * - Sending and receiving messages
 * - Handling streaming responses
 * - Managing conversation state
 * - Creating new conversations
 * - Updating conversation details
 *
 * @example
 * ```tsx
 * // Using the hook in a component
 * const {
 *   conversation,
 *   messages,
 *   streaming,
 *   sendMessage,
 *   stopStreaming
 * } = useChat({
 *   conversationId: "123",
 *   autoFetch: true
 * });
 *
 * // Send a message
 * const handleSend = () => {
 *   sendMessage("Hello, AI!");
 * };
 *
 * // Stop streaming
 * const handleStop = () => {
 *   stopStreaming();
 * };
 * ```
 *
 * @param options Configuration options for the hook
 * @returns Chat state and actions
 */
export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { conversationId } = options

  // Local state
  const [error, setError] = useState<string | null>(null)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const prevDataRef = useRef<ConversationDetailResponse | null>(null)
  const prevErrorRef = useRef<ApiError | null>(null)
  const processedDataRef = useRef(false)

  // Get providers and models
  const { selectedModel } = useProviders()

  // Get streaming state
  const {
    streaming,
    startStreaming,
    updateStreamingContent,
    finalizeStreaming,
    stopStreaming: stopStreamingState,
  } = useStreamingState()

  // React Query hooks
  const conversationQuery = useConversation(conversationId || '')
  const createConversationMutation = useCreateConversation()
  const updateConversationMutation = useUpdateConversation()

  // Get conversation data directly from the query result
  const conversation = conversationQuery.data || null

  // Memoize the data comparison to prevent unnecessary re-renders
  const dataChanged = useCallback(() => {
    if (!conversationQuery.data || !prevDataRef.current) return true

    // Compare only essential fields
    const prev = prevDataRef.current
    const curr = conversationQuery.data

    if (prev.id !== curr.id || prev.title !== curr.title) return true
    if (prev.messages.length !== curr.messages.length) return true

    // For messages, just check the last message if it exists
    if (prev.messages.length > 0 && curr.messages.length > 0) {
      const prevLastMsg = prev.messages[prev.messages.length - 1]
      const currLastMsg = curr.messages[curr.messages.length - 1]
      return prevLastMsg.id !== currLastMsg.id || prevLastMsg.content !== currLastMsg.content
    }

    return false
  }, [conversationQuery.data])

  // Use a separate effect for data updates to minimize re-renders
  useEffect(() => {
    // Only process if we have successful data and it has changed
    if (
      conversationQuery.isSuccess &&
      conversationQuery.data &&
      dataChanged() &&
      !processedDataRef.current
    ) {
      prevDataRef.current = conversationQuery.data
      // Mark as processed to prevent multiple updates in the same render cycle
      processedDataRef.current = true

      // Use setTimeout to break the potential render cycle and avoid infinite loops
      setTimeout(() => {
        // Reset the processed flag after the update
        processedDataRef.current = false
      }, 0)
    }
  }, [conversationQuery.isSuccess, conversationQuery.data, dataChanged])

  // Use a separate effect for error updates to minimize re-renders
  useEffect(() => {
    if (
      conversationQuery.isError &&
      conversationQuery.error &&
      prevErrorRef.current !== conversationQuery.error
    ) {
      prevErrorRef.current = conversationQuery.error
      setError(conversationQuery.error.message || 'Failed to fetch conversation')
    }
  }, [conversationQuery.isError, conversationQuery.error])

  // Get messages from conversation and convert to Message type - memoize to prevent unnecessary re-renders
  const messages = useMemo(() => {
    if (!conversation || !conversation.messages) return []

    return conversation.messages.map(
      msg =>
        ({
          ...msg,
          conversation_id: conversationId || '',
          updated_at: msg.created_at, // Use created_at as updated_at since it's not provided
          tools: [], // Initialize empty tools array
        }) as Message
    )
  }, [conversation, conversationId])

  // Send message mutation with streaming support
  const sendMessageMutation = useSendMessage(conversationId || '', handleStreamEvent)

  /**
   * Handle stream events from the API
   */
  function handleStreamEvent(event: StreamEvent): void {
    switch (event.type) {
      case 'message_start':
        // A new message is starting
        break

      case 'content_delta':
        // Update streaming content with new delta
        if (typeof event.data === 'string') {
          updateStreamingContent(event.data)
        }
        break

      case 'message_end':
        // Message is complete, finalize it
        finalizeStreaming(streaming.streamingContent)
        break

      case 'message_cancelled':
        // Message was cancelled
        stopStreamingState()
        break

      case 'info':
        // Informational message
        console.info('Stream info:', event.message)
        break

      case 'error':
        // Error occurred
        setError(event.error || 'An error occurred during streaming')
        stopStreamingState()
        break

      default:
        console.warn('Unknown stream event type:', event)
    }
  }

  /**
   * Send a message in the current conversation
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) {
        setError('No active conversation')
        return
      }

      try {
        // Create message request
        const messageRequest: PostMessageRequest = {
          content,
          model_id: selectedModel?.id,
        }

        // Generate a temporary ID for the assistant message
        const tempAssistantId = `temp-${uuidv4()}`

        // Start streaming for the assistant message
        startStreaming(conversationId, tempAssistantId)

        // Send the message
        await sendMessageMutation.mutateAsync(messageRequest)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
        stopStreamingState()
      }
    },
    [conversationId, selectedModel?.id, startStreaming, sendMessageMutation, stopStreamingState]
  )

  /**
   * Stop the current streaming response
   */
  const stopStreaming = useCallback(() => {
    // Cancel the fetch request if it's in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Stop streaming
    stopStreamingState()
  }, [stopStreamingState])

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(
    async (data: CreateConversationRequest): Promise<string> => {
      try {
        const newConversation = await createConversationMutation.mutateAsync(data)
        return newConversation.id
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create conversation')
        throw err
      }
    },
    [createConversationMutation]
  )

  /**
   * Update the current conversation
   */
  const updateConversationData = useCallback(
    async (updates: Partial<CreateConversationRequest>) => {
      if (!conversationId) {
        setError('No active conversation')
        return
      }

      try {
        await updateConversationMutation.mutateAsync({
          id: conversationId,
          data: updates,
        })

        // Update the conversation in the store
        if (conversation) {
          // Just log the update for now
          console.log('Conversation updated:', {
            ...conversation,
            ...updates,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update conversation')
      }
    },
    [conversationId, conversation, updateConversationMutation]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // Data
    conversation,
    messages,

    // Loading states
    loading: conversationQuery.isLoading || sendMessageMutation.isPending,
    error,

    // Streaming state
    streaming,

    // Actions
    sendMessage,
    stopStreaming,
    createConversation,
    updateConversation: updateConversationData,

    // Stream event handler
    handleStreamEvent,
  }
}
