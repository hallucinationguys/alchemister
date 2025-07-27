import { apiClient } from './api-client'
import type { Message, PostMessageRequest, StreamEvent } from '@/features/chat/types/conversation'
import { getAuthHeader, StreamingError } from '@/lib/react-query/errorHandling'

const API_BASE = '/api/chat/conversations'

/**
 * Maximum number of retries for streaming requests
 */
const MAX_STREAM_RETRIES = 2

/**
 * Service for message-related API operations
 */
export const messageService = {
  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      // First check if the conversation exists
      if (!conversationId || conversationId === 'undefined') {
        console.error('Invalid conversation ID:', conversationId)
        return []
      }

      try {
        const response = await apiClient.get<{ data: { messages: Message[] }; success: boolean }>(
          `${API_BASE}/${conversationId}`
        )

        if (!response || !response.data) {
          console.error('Invalid response format:', response)
          return []
        }

        if (!response.data.messages) {
          console.error('No messages in response:', response.data)
          return []
        }

        return response.data.messages
      } catch (error) {
        console.error('Error fetching messages:', error)
        return []
      }
    } catch (error) {
      console.error('Error in getMessages:', error)
      return []
    }
  },

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, data: PostMessageRequest): Promise<Message> {
    try {
      // First check if the conversation exists
      if (!conversationId || conversationId === 'undefined') {
        throw new Error('Invalid conversation ID')
      }

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
        console.error('Error sending message:', error)
        throw new Error(
          `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    }
  },

  /**
   * Send a message and get a streaming response with retry capability
   */
  async sendMessageStream(
    conversationId: string,
    data: PostMessageRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal,
    retryCount = 0
  ): Promise<void> {
    try {
      // Notify that we're starting the request
      if (retryCount === 0) {
        onEvent({ type: 'message_start' })
      } else {
        onEvent({
          type: 'info',
          message: `Retrying connection (attempt ${retryCount}/${MAX_STREAM_RETRIES})...`,
        })
      }

      const authHeader = getAuthHeader()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(authHeader as Record<string, string>),
      }

      const response = await fetch(`${API_BASE}/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal,
      })

      if (!response.ok) {
        let errorMessage = 'Failed to send message'
        const status = response.status
        let details = ''

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          details = errorData.details || ''
        } catch (e) {
          // Ignore parse errors
        }

        // Determine if we should retry based on status code
        const isRetryable = [408, 429, 500, 502, 503, 504].includes(status)

        if (isRetryable && retryCount < MAX_STREAM_RETRIES) {
          // Wait before retrying (exponential backoff)
          const retryDelay = Math.min(1000 * 2 ** retryCount, 10000)

          onEvent({
            type: 'info',
            message: `Connection error. Retrying in ${retryDelay / 1000} seconds...`,
          })

          await new Promise(resolve => setTimeout(resolve, retryDelay))

          // Retry the request
          return this.sendMessageStream(conversationId, data, onEvent, signal, retryCount + 1)
        }

        // If we've exhausted retries or the error isn't retryable, report it
        onEvent({
          type: 'error',
          error: errorMessage,
          details,
          status,
        })
        return
      }

      if (!response.body) {
        throw new StreamingError('Response has no body', {
          isRetryable: false,
        })
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let lastActivity = Date.now()
      let messageStarted = false

      // Set up a heartbeat to detect stalled connections
      const heartbeatInterval = setInterval(() => {
        const inactiveTime = Date.now() - lastActivity

        // If no activity for 30 seconds and we've started receiving a message,
        // consider the connection stalled
        if (inactiveTime > 30000 && messageStarted) {
          clearInterval(heartbeatInterval)
          reader.cancel('Connection timeout')

          if (retryCount < MAX_STREAM_RETRIES) {
            onEvent({
              type: 'info',
              message: 'Connection stalled. Reconnecting...',
            })

            // Retry the request
            this.sendMessageStream(conversationId, data, onEvent, signal, retryCount + 1)
          } else {
            onEvent({
              type: 'error',
              error: 'Connection timed out after multiple attempts',
              code: 'STREAM_TIMEOUT',
            })
          }
        }
      }, 5000)

      try {
        while (true) {
          if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError')
          }

          const { done, value } = await reader.read()

          // Update last activity timestamp
          lastActivity = Date.now()

          if (done) break

          // If this is the first chunk, mark that we've started receiving the message
          if (!messageStarted) {
            messageStarted = true
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim() === '') continue

            try {
              let event: StreamEvent

              if (line.startsWith('data: ')) {
                event = JSON.parse(line.slice(6)) as StreamEvent
              } else {
                event = JSON.parse(line) as StreamEvent
              }

              onEvent(event)
            } catch (e) {
              console.error('Error parsing SSE event:', e)
            }
          }
        }

        // Process any remaining data
        if (buffer.trim() !== '') {
          try {
            let event: StreamEvent

            if (buffer.startsWith('data: ')) {
              event = JSON.parse(buffer.slice(6)) as StreamEvent
            } else {
              event = JSON.parse(buffer) as StreamEvent
            }

            onEvent(event)
          } catch (e) {
            console.error('Error parsing final SSE event:', e)
          }
        }

        // Clean up the heartbeat
        clearInterval(heartbeatInterval)

        // Signal that the message is complete
        onEvent({ type: 'message_end' })
      } catch (error) {
        // Clean up the heartbeat
        clearInterval(heartbeatInterval)

        if (error instanceof DOMException && error.name === 'AbortError') {
          // Aborted by user, don't send error event
          onEvent({ type: 'message_cancelled' })
          return
        }

        // For other errors, check if we should retry
        if (retryCount < MAX_STREAM_RETRIES) {
          const retryDelay = Math.min(1000 * 2 ** retryCount, 10000)

          onEvent({
            type: 'info',
            message: `Connection interrupted. Retrying in ${retryDelay / 1000} seconds...`,
          })

          await new Promise(resolve => setTimeout(resolve, retryDelay))

          // Retry the request
          return this.sendMessageStream(conversationId, data, onEvent, signal, retryCount + 1)
        }

        // If we've exhausted retries, report the error
        onEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error during streaming',
          code: 'STREAM_INTERRUPTED',
        })
      }
    } catch (error) {
      // Handle any errors that occur outside the streaming process
      if (error instanceof DOMException && error.name === 'AbortError') {
        onEvent({ type: 'message_cancelled' })
        return
      }

      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to establish streaming connection',
        code: 'STREAM_CONNECTION_ERROR',
      })
    }
  },

  /**
   * Delete a message
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    try {
      return await apiClient.delete<void>(`${API_BASE}/${conversationId}/messages/${messageId}`)
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  },

  /**
   * Regenerate a message
   */
  async regenerateMessage(
    conversationId: string,
    messageId: string,
    data?: Partial<PostMessageRequest>
  ): Promise<Message> {
    try {
      const response = await apiClient.post<{ data: Message; success: boolean }>(
        `${API_BASE}/${conversationId}/messages/${messageId}/regenerate`,
        data || {}
      )

      if (!response || !response.data) {
        throw new Error('Invalid response format: missing message data')
      }

      return response.data
    } catch (error) {
      console.error('Error regenerating message:', error)
      throw new Error(
        `Failed to regenerate message: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },

  /**
   * Regenerate a message with streaming
   */
  async regenerateMessageStream(
    conversationId: string,
    messageId: string,
    data: Partial<PostMessageRequest> = {},
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal,
    retryCount = 0
  ): Promise<void> {
    try {
      // Notify that we're starting the request
      if (retryCount === 0) {
        onEvent({ type: 'message_start' })
      } else {
        onEvent({
          type: 'info',
          message: `Retrying connection (attempt ${retryCount}/${MAX_STREAM_RETRIES})...`,
        })
      }

      const authHeader = getAuthHeader()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(authHeader as Record<string, string>),
      }

      const response = await fetch(
        `${API_BASE}/${conversationId}/messages/${messageId}/regenerate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          signal,
        }
      )

      if (!response.ok) {
        let errorMessage = 'Failed to regenerate message'
        const status = response.status
        let details = ''

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          details = errorData.details || ''
        } catch (e) {
          // Ignore parse errors
        }

        // Determine if we should retry based on status code
        const isRetryable = [408, 429, 500, 502, 503, 504].includes(status)

        if (isRetryable && retryCount < MAX_STREAM_RETRIES) {
          // Wait before retrying (exponential backoff)
          const retryDelay = Math.min(1000 * 2 ** retryCount, 10000)

          onEvent({
            type: 'info',
            message: `Connection error. Retrying in ${retryDelay / 1000} seconds...`,
          })

          await new Promise(resolve => setTimeout(resolve, retryDelay))

          // Retry the request
          return this.regenerateMessageStream(
            conversationId,
            messageId,
            data,
            onEvent,
            signal,
            retryCount + 1
          )
        }

        // If we've exhausted retries or the error isn't retryable, report it
        onEvent({
          type: 'error',
          error: errorMessage,
          details,
          status,
        })
        return
      }

      // Use the same streaming logic as sendMessageStream
      if (!response.body) {
        throw new StreamingError('Response has no body', {
          isRetryable: false,
        })
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let lastActivity = Date.now()
      let messageStarted = false

      // Set up a heartbeat to detect stalled connections
      const heartbeatInterval = setInterval(() => {
        const inactiveTime = Date.now() - lastActivity

        // If no activity for 30 seconds and we've started receiving a message,
        // consider the connection stalled
        if (inactiveTime > 30000 && messageStarted) {
          clearInterval(heartbeatInterval)
          reader.cancel('Connection timeout')

          if (retryCount < MAX_STREAM_RETRIES) {
            onEvent({
              type: 'info',
              message: 'Connection stalled. Reconnecting...',
            })

            // Retry the request
            this.regenerateMessageStream(
              conversationId,
              messageId,
              data,
              onEvent,
              signal,
              retryCount + 1
            )
          } else {
            onEvent({
              type: 'error',
              error: 'Connection timed out after multiple attempts',
              code: 'STREAM_TIMEOUT',
            })
          }
        }
      }, 5000)

      try {
        while (true) {
          if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError')
          }

          const { done, value } = await reader.read()

          // Update last activity timestamp
          lastActivity = Date.now()

          if (done) break

          // If this is the first chunk, mark that we've started receiving the message
          if (!messageStarted) {
            messageStarted = true
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim() === '') continue

            try {
              let event: StreamEvent

              if (line.startsWith('data: ')) {
                event = JSON.parse(line.slice(6)) as StreamEvent
              } else {
                event = JSON.parse(line) as StreamEvent
              }

              onEvent(event)
            } catch (e) {
              console.error('Error parsing SSE event:', e)
            }
          }
        }

        // Process any remaining data
        if (buffer.trim() !== '') {
          try {
            let event: StreamEvent

            if (buffer.startsWith('data: ')) {
              event = JSON.parse(buffer.slice(6)) as StreamEvent
            } else {
              event = JSON.parse(buffer) as StreamEvent
            }

            onEvent(event)
          } catch (e) {
            console.error('Error parsing final SSE event:', e)
          }
        }

        // Clean up the heartbeat
        clearInterval(heartbeatInterval)

        // Signal that the message is complete
        onEvent({ type: 'message_end' })
      } catch (error) {
        // Clean up the heartbeat
        clearInterval(heartbeatInterval)

        if (error instanceof DOMException && error.name === 'AbortError') {
          // Aborted by user, don't send error event
          onEvent({ type: 'message_cancelled' })
          return
        }

        // For other errors, check if we should retry
        if (retryCount < MAX_STREAM_RETRIES) {
          const retryDelay = Math.min(1000 * 2 ** retryCount, 10000)

          onEvent({
            type: 'info',
            message: `Connection interrupted. Retrying in ${retryDelay / 1000} seconds...`,
          })

          await new Promise(resolve => setTimeout(resolve, retryDelay))

          // Retry the request
          return this.regenerateMessageStream(
            conversationId,
            messageId,
            data,
            onEvent,
            signal,
            retryCount + 1
          )
        }

        // If we've exhausted retries, report the error
        onEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error during streaming',
          code: 'STREAM_INTERRUPTED',
        })
      }
    } catch (error) {
      // Handle any errors that occur outside the streaming process
      if (error instanceof DOMException && error.name === 'AbortError') {
        onEvent({ type: 'message_cancelled' })
        return
      }

      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to establish streaming connection',
        code: 'STREAM_CONNECTION_ERROR',
      })
    }
  },
}
