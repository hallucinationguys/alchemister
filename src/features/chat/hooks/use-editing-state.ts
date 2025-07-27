'use client'

import { useState } from 'react'

/**
 * Hook for managing message editing state
 * This replaces the editing functionality from the ChatProvider
 */
export const useEditingState = () => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

  function startEditing(messageId: string) {
    setEditingMessageId(messageId)
  }

  function stopEditing() {
    setEditingMessageId(null)
  }

  return {
    editingMessageId,
    startEditing,
    stopEditing,
  }
}
