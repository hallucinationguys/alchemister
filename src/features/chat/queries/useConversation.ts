'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
} from '@tanstack/react-query'
import {
  conversationService,
  type ConversationFilterOptions,
} from '@/api/services/conversation-service'
import {
  handleQueryError,
  showQueryError,
  type ApiError,
} from '@/shared/lib/react-query/errorHandling'
import type {
  ConversationSummaryResponse,
  ConversationDetailResponse,
  CreateConversationRequest,
} from '@/features/chat/types/conversation'

/**
 * Query keys for conversation-related queries
 */
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filters: ConversationFilterOptions) => [...conversationKeys.lists(), filters] as const,
  infinite: (filters?: Partial<ConversationFilterOptions>) =>
    [...conversationKeys.lists(), 'infinite', filters] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  archived: () => [...conversationKeys.all, 'archived'] as const,
}

/**
 * Hook for fetching a list of conversations with filtering options
 */
export const useConversations = (
  options: ConversationFilterOptions = {},
  queryOptions?: UseQueryOptions<ConversationSummaryResponse[]>
) => {
  return useQuery({
    queryKey: conversationKeys.list(options),
    queryFn: () => conversationService.getConversations(options),
    ...queryOptions,
  })
}

/**
 * Hook for fetching conversations with infinite scrolling
 */
export const useInfiniteConversations = (options: ConversationFilterOptions = {}) => {
  const { limit = 20, sortBy = 'updated_at', sortOrder = 'desc', isActive } = options

  return useInfiniteQuery({
    queryKey: conversationKeys.infinite({ sortBy, sortOrder, isActive }),
    queryFn: ({ pageParam = 0 }) =>
      conversationService.getConversations({
        ...options,
        limit,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length * limit : undefined
    },
  })
}

/**
 * Hook for fetching a single conversation by ID
 */
export const useConversation = (
  id: string,
  options?: UseQueryOptions<
    ConversationDetailResponse,
    ApiError,
    ConversationDetailResponse,
    readonly unknown[]
  >
) => {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => conversationService.getConversation(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Hook for creating a new conversation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient()

  return useMutation<ConversationSummaryResponse, ApiError, CreateConversationRequest>({
    mutationFn: (data: CreateConversationRequest) => conversationService.createConversation(data),
    onSuccess: newConversation => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })

      // Optimistically update the conversations list
      queryClient.setQueryData(
        conversationKeys.list({ limit: 20, offset: 0 }),
        (old: ConversationSummaryResponse[] | undefined) =>
          old ? [newConversation, ...old] : [newConversation]
      )
    },
    onError: error => {
      showQueryError(error)
    },
  })
}

/**
 * Hook for updating a conversation
 */
export const useUpdateConversation = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ConversationSummaryResponse,
    ApiError,
    { id: string; data: Partial<CreateConversationRequest> }
  >({
    mutationFn: ({ id, data }) => conversationService.updateConversation(id, data),
    onSuccess: (updatedConversation, { id }) => {
      // Invalidate and refetch the specific conversation
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) })

      // Update the conversation in the list
      queryClient.setQueryData(
        conversationKeys.list({ limit: 20, offset: 0 }),
        (old: ConversationSummaryResponse[] | undefined) => {
          if (!old) return [updatedConversation]
          return old.map(conv => (conv.id === id ? { ...conv, ...updatedConversation } : conv))
        }
      )
    },
    onError: error => {
      showQueryError(error)
    },
  })
}

/**
 * Hook for updating a conversation title (convenience wrapper)
 */
export const useUpdateConversationTitle = () => {
  const updateConversation = useUpdateConversation()

  return useMutation<ConversationSummaryResponse, ApiError, { id: string; title: string }>({
    mutationFn: ({ id, title }) => updateConversation.mutateAsync({ id, data: { title } }),
    onError: error => {
      showQueryError(error)
    },
  })
}

/**
 * Hook for deleting a conversation
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => conversationService.deleteConversation(id),
    onSuccess: (_, id) => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })

      // Remove the conversation from the cache
      queryClient.setQueryData(
        conversationKeys.list({ limit: 20, offset: 0 }),
        (old: ConversationSummaryResponse[] | undefined) => {
          if (!old) return []
          return old.filter(conv => conv.id !== id)
        }
      )

      // Remove the conversation detail from the cache
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) })
    },
    onError: error => {
      showQueryError(error)
    },
  })
}

/**
 * Hook for archiving a conversation (soft delete)
 */
export const useArchiveConversation = () => {
  const queryClient = useQueryClient()

  return useMutation<ConversationSummaryResponse, ApiError, string>({
    mutationFn: (id: string) => conversationService.archiveConversation(id),
    onSuccess: (archivedConversation, id) => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })

      // Remove the conversation from the active list
      queryClient.setQueryData(
        conversationKeys.list({ limit: 20, offset: 0, isActive: true }),
        (old: ConversationSummaryResponse[] | undefined) => {
          if (!old) return []
          return old.filter(conv => conv.id !== id)
        }
      )

      // Add to archived list if it exists in cache
      queryClient.setQueryData(
        conversationKeys.list({ limit: 20, offset: 0, isActive: false }),
        (old: ConversationSummaryResponse[] | undefined) => {
          if (!old) return [archivedConversation]
          return [archivedConversation, ...old]
        }
      )
    },
    onError: error => {
      showQueryError(error)
    },
  })
}

/**
 * Hook for restoring an archived conversation
 */
export const useRestoreConversation = () => {
  const queryClient = useQueryClient()

  return useMutation<ConversationSummaryResponse, ApiError, string>({
    mutationFn: (id: string) => conversationService.restoreConversation(id),
    onSuccess: (restoredConversation, id) => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })

      // Remove from archived list if it exists in cache
      queryClient.setQueryData(
        conversationKeys.list({ limit: 20, offset: 0, isActive: false }),
        (old: ConversationSummaryResponse[] | undefined) => {
          if (!old) return []
          return old.filter(conv => conv.id !== id)
        }
      )

      // Add to active list
      queryClient.setQueryData(
        conversationKeys.list({ limit: 20, offset: 0, isActive: true }),
        (old: ConversationSummaryResponse[] | undefined) => {
          if (!old) return [restoredConversation]
          return [restoredConversation, ...old]
        }
      )
    },
    onError: error => {
      showQueryError(error)
    },
  })
}
