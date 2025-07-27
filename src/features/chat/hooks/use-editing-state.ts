'use client'

import { useState, useCallback } from 'react'

/**
 * Hook for managing message editing state
 * This replaces the editing functionality from the ChatProvider
 */
export const useEditingState = () => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

  const startEditing = useCallback((messageId: string) => {
    setEditingMessageId(messageId)
  }, [])

  const stopEditing = useCallback(() => {
    setEditingMessageId(null)
  }, [])

  return {
    editingMessageId,
    startEditing,
    stopEditing,
  }
}
