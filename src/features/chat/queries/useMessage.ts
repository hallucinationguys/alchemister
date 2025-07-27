'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { messageService } from '@/api/services/message-service'
import { handleQueryError, showQueryError } from '@/lib/react-query/errorHandling'
import { v4 as uuidv4 } from 'uuid'
import { useRef } from 'react'
import type { Message, PostMessageRequest, StreamEvent } from '@/features/chat/types/conversation'

/**
 * Query keys for message-related queries
 */
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (conversationId: string) => [...messageKeys.lists(), conversationId] as const,
  infinite: (conversationId: string) =>
    [...messageKeys.lists(), conversationId, 'infinite'] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
}

/**
 * Hook for fetching messages for a conversation
 */
export const useMessages = (
  conversationId: string,
  limit = 50,
  offset = 0,
  options?: UseQueryOptions<Message[]>
) => {
  return useQuery({
    queryKey: messageKeys.list(conversationId),
    queryFn: () => messageService.getMessages(conversationId, limit, offset),
    enabled: !!conversationId,
    ...options,
  })
}

/**
 * Hook for fetching messages with infinite scrolling
 */
export const useInfiniteMessages = (conversationId: string, limit = 50) => {
  return useInfiniteQuery({
    queryKey: messageKeys.infinite(conversationId),
    queryFn: ({ pageParam = 0 }) =>
      messageService.getMessages(conversationId, limit, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length * limit : undefined
    },
    enabled: !!conversationId,
  })
}

/**
 * Hook for sending a message
 */
export const useSendMessage = (
  conversationId: string,
  onStreamEvent?: (event: StreamEvent) => void
) => {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  return useMutation<Message, Error, PostMessageRequest>({
    mutationFn: async (data: PostMessageRequest) => {
      // If we have a stream event handler, use streaming
      if (onStreamEvent) {
        // Create a temporary message ID for optimistic updates
        const tempMessageId = `temp-${uuidv4()}`

        // Create a new abort controller for the stream
        abortControllerRef.current = new AbortController()

        // Create a wrapper for the stream event handler that adds retry capability
        const handleStreamEvent = (event: StreamEvent) => {
          // Pass the event to the original handler
          onStreamEvent(event)

          // Handle error events with retry capability
          if (event.type === 'error') {
            const apiError = {
              message: event.error || 'Stream error occurred',
              details: event.details,
              status: event.status,
              code: event.code,
            }

            // Show error with retry option
            showQueryError(apiError, () => {
              // Create a new abort controller for the retry
              abortControllerRef.current = new AbortController()

              // Retry the streaming request
              messageService.sendMessageStream(
                conversationId,
                data,
                handleStreamEvent,
                abortControllerRef.current.signal
              )
            })
          }
        }

        // Start streaming with the enhanced event handler
        messageService.sendMessageStream(
          conversationId,
          data,
          handleStreamEvent,
          abortControllerRef.current.signal
        )

        // Return a placeholder message that will be updated by the stream
        return {
          id: tempMessageId,
          conversation_id: conversationId,
          role: 'user',
          content: data.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      // Otherwise, use regular request
      return messageService.sendMessage(conversationId, data)
    },
    onMutate: async data => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: messageKeys.list(conversationId) })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(messageKeys.list(conversationId))

      // Optimistically add the user message
      const optimisticUserMessage: Message = {
        id: `temp-${uuidv4()}`,
        conversation_id: conversationId,
        role: 'user',
        content: data.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData(messageKeys.list(conversationId), (old: Message[] | undefined) =>
        old ? [...old, optimisticUserMessage] : [optimisticUserMessage]
      )

      return { previousMessages }
    },
    onError: (error: Error, data, context: unknown) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      const typedContext = context as { previousMessages?: Message[] }
      if (typedContext?.previousMessages) {
        queryClient.setQueryData(messageKeys.list(conversationId), typedContext.previousMessages)
      }

      const apiError = handleQueryError(error)

      // Show error with retry option
      showQueryError(apiError, () => {
        // Retry the mutation
        if (onStreamEvent) {
          // For streaming, we need to create a new abort controller
          abortControllerRef.current = new AbortController()
        }

        // Re-execute the mutation with the same data
        const mutationCache = queryClient.getMutationCache()
        const mutations = mutationCache.getAll()
        const targetMutation = mutations.find(m => {
          const key = m.options.mutationKey
          return (
            Array.isArray(key) &&
            key.length === 2 &&
            key[0] === 'sendMessage' &&
            key[1] === conversationId
          )
        })
        targetMutation?.execute(data)
      })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) })
    },
    // Add a mutation key for finding this mutation later
    mutationKey: ['sendMessage', conversationId],
  })
}

/**
 * Hook for deleting a message
 */
export const useDeleteMessage = (conversationId: string) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (messageId: string) => messageService.deleteMessage(conversationId, messageId),
    onSuccess: (_, messageId) => {
      // Update the messages list by removing the deleted message
      queryClient.setQueryData(messageKeys.list(conversationId), (old: Message[] | undefined) => {
        if (!old) return []
        return old.filter(message => message.id !== messageId)
      })
    },
    onError: (error: Error) => {
      const apiError = handleQueryError(error)
      showQueryError(apiError)
    },
  })
}

/**
 * Hook for regenerating a message
 */
export const useRegenerateMessage = (
  conversationId: string,
  onStreamEvent?: (event: StreamEvent) => void
) => {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  return useMutation<Message, Error, { messageId: string; data?: Partial<PostMessageRequest> }>({
    mutationFn: async ({ messageId, data = {} }) => {
      // If we have a stream event handler, use streaming
      if (onStreamEvent) {
        // Create a new abort controller for the stream
        abortControllerRef.current = new AbortController()

        // Create a wrapper for the stream event handler that adds retry capability
        const handleStreamEvent = (event: StreamEvent) => {
          // Pass the event to the original handler
          onStreamEvent(event)

          // Handle error events with retry capability
          if (event.type === 'error') {
            const apiError = {
              message: event.error || 'Stream error occurred',
              details: event.details,
              status: event.status,
              code: event.code,
            }

            // Show error with retry option
            showQueryError(apiError, () => {
              // Create a new abort controller for the retry
              abortControllerRef.current = new AbortController()

              // Retry the streaming request
              messageService.regenerateMessageStream(
                conversationId,
                messageId,
                data,
                handleStreamEvent,
                abortControllerRef.current.signal
              )
            })
          }
        }

        // Start streaming with the enhanced event handler
        messageService.regenerateMessageStream(
          conversationId,
          messageId,
          data,
          handleStreamEvent,
          abortControllerRef.current.signal
        )

        // Return a placeholder message that will be updated by the stream
        return {
          id: messageId,
          conversation_id: conversationId,
          role: 'assistant',
          content: 'Regenerating...',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      // Otherwise, use regular request
      return messageService.regenerateMessage(conversationId, messageId, data)
    },
    onMutate: async ({ messageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: messageKeys.list(conversationId) })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(messageKeys.list(conversationId))

      // Find the message to regenerate
      const messages = queryClient.getQueryData<Message[]>(messageKeys.list(conversationId)) || []
      const messageIndex = messages.findIndex(msg => msg.id === messageId)

      if (messageIndex !== -1) {
        // Create a copy of the messages array
        const updatedMessages = [...messages]

        // Update the message with a loading state
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: 'Regenerating...',
          is_edited: true,
        }

        // Remove all subsequent messages (if any)
        if (messageIndex < updatedMessages.length - 1) {
          updatedMessages.splice(messageIndex + 1)
        }

        // Update the query data
        queryClient.setQueryData(messageKeys.list(conversationId), updatedMessages)
      }

      return { previousMessages }
    },
    onError: (error: Error, variables, context: unknown) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      const typedContext = context as { previousMessages?: Message[] }
      if (typedContext?.previousMessages) {
        queryClient.setQueryData(messageKeys.list(conversationId), typedContext.previousMessages)
      }

      const apiError = handleQueryError(error)

      // Show error with retry option
      showQueryError(apiError, () => {
        // Retry the mutation
        if (onStreamEvent) {
          // For streaming, we need to create a new abort controller
          abortControllerRef.current = new AbortController()
        }

        // Re-execute the mutation with the same data
        const mutationCache = queryClient.getMutationCache()
        const mutations = mutationCache.getAll()
        const targetMutation = mutations.find(m => {
          const key = m.options.mutationKey
          return (
            Array.isArray(key) &&
            key.length === 2 &&
            key[0] === 'regenerateMessage' &&
            key[1] === conversationId
          )
        })
        if (targetMutation) {
          targetMutation.execute(variables)
        }
      })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) })
    },
    // Add a mutation key for finding this mutation later
    mutationKey: ['regenerateMessage', conversationId],
  })
}
