import { apiClient } from './api-client'
import { handleQueryError } from '@/lib/react-query/errorHandling'
import type {
  ConversationDetailResponse,
  ConversationSummaryResponse,
  CreateConversationRequest,
  Message,
  PostMessageRequest,
  StreamEvent,
} from '@/features/chat/types/conversation'

const API_BASE = '/api/chat/conversations'

/**
 * Interface for conversation filtering options
 */
export interface ConversationFilterOptions {
  limit?: number
  offset?: number
  isActive?: boolean
  sortBy?: 'created_at' | 'updated_at' | 'title'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Service for conversation-related API operations
 */
export const conversationService = {
  /**
   * Get a list of conversations with filtering options
   */
  async getConversations(
    options: ConversationFilterOptions = {}
  ): Promise<ConversationSummaryResponse[]> {
    const { limit = 20, offset = 0, isActive, sortBy = 'updated_at', sortOrder = 'desc' } = options

    try {
      const response = await apiClient.get<{
        data: ConversationSummaryResponse[]
        success: boolean
      }>(`${API_BASE}`, {
        params: {
          limit,
          offset,
          is_active: isActive,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      })

      if (!response || !response.data) {
        return []
      }

      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: string): Promise<ConversationDetailResponse> {
    try {
      const response = await apiClient.get<{ data: ConversationDetailResponse; success: boolean }>(
        `${API_BASE}/${id}`
      )

      if (!response || !response.data) {
        throw new Error('Invalid response format: missing conversation data')
      }

      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<ConversationSummaryResponse> {
    try {
      const response = await apiClient.post<{
        data: ConversationSummaryResponse
        success: boolean
      }>(`${API_BASE}`, data)

      if (!response || !response.data) {
        throw new Error('Invalid response format: missing conversation data')
      }

      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Update a conversation
   */
  async updateConversation(
    id: string,
    data: Partial<CreateConversationRequest>
  ): Promise<ConversationSummaryResponse> {
    try {
      const response = await apiClient.patch<{
        data: ConversationSummaryResponse
        success: boolean
      }>(`${API_BASE}/${id}`, data)
      if (!response || !response.data) {
        throw new Error('Invalid response format: missing conversation data')
      }
      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    try {
      await apiClient.delete<{ success: boolean }>(`${API_BASE}/${id}`)
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Archive a conversation (soft delete)
   */
  async archiveConversation(id: string): Promise<ConversationSummaryResponse> {
    try {
      const response = await apiClient.patch<{
        data: ConversationSummaryResponse
        success: boolean
      }>(`${API_BASE}/${id}/archive`, {})
      if (!response || !response.data) {
        throw new Error('Invalid response format: missing conversation data')
      }
      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Restore an archived conversation
   */
  async restoreConversation(id: string): Promise<ConversationSummaryResponse> {
    try {
      const response = await apiClient.patch<{
        data: ConversationSummaryResponse
        success: boolean
      }>(`${API_BASE}/${id}/restore`, {})
      if (!response || !response.data) {
        throw new Error('Invalid response format: missing conversation data')
      }
      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Get messages for a conversation
   * @deprecated Use messageService.getMessages instead
   */
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    console.warn(
      'conversationService.getMessages is deprecated. Use messageService.getMessages instead.'
    )
    try {
      const response = await apiClient.get<{ data: Message[]; success: boolean }>(
        `${API_BASE}/${conversationId}/messages`,
        {
          params: { limit, offset },
        }
      )

      if (!response || !response.data) {
        return []
      }

      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Send a message in a conversation
   * @deprecated Use messageService.sendMessage instead
   */
  async sendMessage(conversationId: string, data: PostMessageRequest): Promise<Message> {
    console.warn(
      'conversationService.sendMessage is deprecated. Use messageService.sendMessage instead.'
    )
    try {
      const response = await apiClient.post<{ data: Message; success: boolean }>(
        `${API_BASE}/${conversationId}/messages`,
        data
      )

      if (!response || !response.data) {
        throw new Error('Invalid response format: missing message data')
      }

      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },
}
