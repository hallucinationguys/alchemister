'use client'

import { useState } from 'react'

/**
 * Streaming state interface
 */
interface StreamingState {
  isStreaming: boolean
  streamingContent: string
  streamingMessageId: string | null
  conversationId: string | null
}

/**
 * Initial streaming state
 */
const initialStreamingState: StreamingState = {
  isStreaming: false,
  streamingContent: '',
  streamingMessageId: null,
  conversationId: null,
}

/**
 * Hook for managing streaming state
 * This replaces the streaming functionality from the ChatProvider
 */
export const useStreamingState = () => {
  const [streaming, setStreaming] = useState<StreamingState>(initialStreamingState)

  const startStreaming = (conversationId: string, messageId: string) => {
    setStreaming({
      isStreaming: true,
      streamingContent: '',
      streamingMessageId: messageId,
      conversationId,
    })
  }

  const updateStreamingContent = (content: string) => {
    setStreaming(prev => ({
      ...prev,
      streamingContent: content,
    }))
  }

  const finalizeStreaming = (finalContent: string) => {
    setStreaming(prev => ({
      ...prev,
      isStreaming: false,
      streamingContent: finalContent,
    }))
  }

  const stopStreaming = () => {
    setStreaming(initialStreamingState)
  }

  return {
    streaming,
    startStreaming,
    updateStreamingContent,
    finalizeStreaming,
    stopStreaming,
  }
}
