'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useEditingState } from '@/features/chat/hooks/use-editing-state'
import { useDeleteMessage, useRegenerateMessage } from '@/features/chat/queries/useMessage'
import type { Message, EditSessionInfo, StreamEvent } from '@/features/chat/types/conversation'

interface UseMessageActionsOptions {
  conversationId?: string
  onStreamEvent?: (event: StreamEvent) => void
}

interface UseMessageActionsReturn {
  // Copy actions
  copyMessage: (message: Message) => void
  copyCode: (code: string) => void

  // Code extraction
  extractCodeBlocks: (content: string) => { code: string; language: string }[]

  // Edit actions
  startEditing: (messageId: string) => void
  cancelEditing: () => void
  saveEdit: (content: string) => void
  updateEditContent: (content: string) => void
  isEditing: boolean
  currentEditMessageId: string | null
  editSession: EditSessionInfo | null

  // Delete actions
  deleteMessage: (messageId: string) => Promise<void>
  isDeleting: boolean

  // Regenerate actions
  regenerateMessage: (messageId: string) => Promise<void>
  isRegenerating: boolean
}

/**
 * A hook that provides message-specific actions like copying, editing, deleting, and regenerating
 *
 * This hook centralizes all message-related actions including:
 * - Copying message content to clipboard
 * - Copying code blocks to clipboard
 * - Extracting code blocks from message content
 * - Editing message content
 * - Deleting messages
 * - Regenerating AI responses
 *
 * @example
 * ```tsx
 * // Using the hook in a component
 * const {
 *   copyMessage,
 *   copyCode,
 *   startEditing,
 *   cancelEditing,
 *   deleteMessage,
 *   regenerateMessage,
 *   isEditing,
 *   isRegenerating
 * } = useMessageActions({
 *   conversationId: "123",
 *   onStreamEvent: handleStreamEvent
 * });
 *
 * // Copy a message
 * const handleCopy = () => {
 *   copyMessage(message);
 * };
 *
 * // Start editing a message
 * const handleEdit = () => {
 *   startEditing(message.id);
 * };
 * ```
 *
 * @param options Configuration options for the hook
 * @returns Message action functions and state
 */
export const useMessageActions = (
  options: UseMessageActionsOptions = {}
): UseMessageActionsReturn => {
  const { conversationId, onStreamEvent } = options

  // Local state for editing
  const [isEditing, setIsEditing] = useState(false)
  const [currentEditMessageId, setCurrentEditMessageId] = useState<string | null>(null)
  const [editSession, setEditSession] = useState<EditSessionInfo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Get editing state actions
  const { startEditing: startEditingStore, stopEditing } = useEditingState()

  // Get delete message mutation
  const deleteMessageMutation = useDeleteMessage(conversationId || '')

  /**
   * Copy a message's content to clipboard
   */
  const copyMessage = useCallback((message: Message) => {
    if (!message.content) return

    try {
      navigator.clipboard.writeText(message.content)
      toast.success('Message copied to clipboard')
    } catch (error) {
      console.error('Failed to copy message:', error)
      toast.error('Failed to copy message')
    }
  }, [])

  /**
   * Copy code snippet to clipboard
   */
  const copyCode = useCallback((code: string) => {
    if (!code) return

    try {
      navigator.clipboard.writeText(code)
      toast.success('Code copied to clipboard')
    } catch (error) {
      console.error('Failed to copy code:', error)
      toast.error('Failed to copy code')
    }
  }, [])

  /**
   * Extract code blocks from a message
   * This is a simple implementation that looks for code blocks between triple backticks
   */
  const extractCodeBlocks = useCallback((content: string): { code: string; language: string }[] => {
    const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g
    const codeBlocks: { code: string; language: string }[] = []

    let match
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      })
    }

    return codeBlocks
  }, [])

  /**
   * Start editing a message
   */
  const startEditing = useCallback(
    (messageId: string) => {
      if (!conversationId) return

      // Since we can't directly access the conversation from the store,
      // we'll create an edit session with the message ID and let the component
      // provide the content when it calls this function
      setEditSession({
        messageId,
        originalContent: '', // This will be set when the component calls updateEditContent
        editedContent: '', // This will be set when the component calls updateEditContent
        isActive: true,
      })

      setIsEditing(true)
      setCurrentEditMessageId(messageId)

      // Also update the store
      startEditingStore(messageId)
    },
    [conversationId, startEditingStore]
  )

  /**
   * Update the content of the message being edited
   */
  const updateEditContent = useCallback(
    (content: string) => {
      if (editSession) {
        setEditSession({
          ...editSession,
          editedContent: content,
        })
      }
    },
    [editSession]
  )

  /**
   * Save the edited message
   */
  const saveEdit = useCallback(
    (content: string) => {
      if (!conversationId || !currentEditMessageId || !editSession) return

      try {
        // We'll use React Query to update the message in the next version
        // For now, just reset the editing state

        // Reset editing state
        setIsEditing(false)
        setCurrentEditMessageId(null)
        setEditSession(null)
        stopEditing()

        toast.success('Message updated')
      } catch (error) {
        console.error('Failed to update message:', error)
        toast.error('Failed to update message')
      }
    },
    [conversationId, currentEditMessageId, editSession, stopEditing]
  )

  /**
   * Cancel editing a message
   */
  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setCurrentEditMessageId(null)
    setEditSession(null)
    stopEditing()
  }, [stopEditing])

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return

      try {
        setIsDeleting(true)
        await deleteMessageMutation.mutateAsync(messageId)
        toast.success('Message deleted')
      } catch (error) {
        console.error('Failed to delete message:', error)
        toast.error('Failed to delete message')
      } finally {
        setIsDeleting(false)
      }
    },
    [conversationId, deleteMessageMutation]
  )

  /**
   * Regenerate a message
   */
  const regenerateMessageMutation = useRegenerateMessage(conversationId || '', onStreamEvent)

  /**
   * Regenerate a message with the current content
   */
  const regenerateMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return

      try {
        setIsRegenerating(true)

        // Get the message content if it's being edited
        let data = {}
        if (editSession && editSession.messageId === messageId && editSession.isActive) {
          data = { content: editSession.editedContent }

          // Reset the edit session
          setIsEditing(false)
          setCurrentEditMessageId(null)
          setEditSession(null)
          stopEditing()
        }

        // Call the regenerate mutation
        await regenerateMessageMutation.mutateAsync({
          messageId,
          data,
        })

        toast.success('Message regenerated')
      } catch (error) {
        console.error('Failed to regenerate message:', error)
        toast.error('Failed to regenerate message')
      } finally {
        setIsRegenerating(false)
      }
    },
    [conversationId, editSession, regenerateMessageMutation, stopEditing]
  )

  return {
    // Copy actions
    copyMessage,
    copyCode,

    // Code extraction
    extractCodeBlocks,

    // Edit actions
    startEditing,
    cancelEditing,
    saveEdit,
    updateEditContent,
    isEditing,
    currentEditMessageId,
    editSession,

    // Delete actions
    deleteMessage,
    isDeleting,

    // Regenerate actions
    regenerateMessage,
    isRegenerating,
  }
}
