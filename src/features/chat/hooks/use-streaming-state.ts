'use client'

import { useState, useCallback } from 'react'

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

  const startStreaming = useCallback((conversationId: string, messageId: string) => {
    setStreaming({
      isStreaming: true,
      streamingContent: '',
      streamingMessageId: messageId,
      conversationId,
    })
  }, [])

  const updateStreamingContent = useCallback((content: string) => {
    setStreaming(prev => ({
      ...prev,
      streamingContent: content,
    }))
  }, [])

  const finalizeStreaming = useCallback((finalContent: string) => {
    setStreaming(prev => ({
      ...prev,
      isStreaming: false,
      streamingContent: finalContent,
    }))
  }, [])

  const stopStreaming = useCallback(() => {
    setStreaming(initialStreamingState)
  }, [])

  return {
    streaming,
    startStreaming,
    updateStreamingContent,
    finalizeStreaming,
    stopStreaming,
  }
}
