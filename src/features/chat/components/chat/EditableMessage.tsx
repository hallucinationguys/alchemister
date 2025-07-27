'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/lib/utils'
import { useMessageActions } from '@/features/chat/hooks'
import { formatMessageTime } from '@/features/chat/lib/chat-utils'
import { Loader2 } from 'lucide-react'
import type { Message } from '@/features/chat/types/conversation'

/**
 * Props for the EditableMessage component
 *
 * @property message - The message object being edited
 * @property conversationId - The ID of the conversation this message belongs to
 * @property onSave - Callback function when the edit is saved
 * @property onCancel - Callback function when the edit is canceled
 * @property className - Additional CSS classes to apply
 */
interface EditableMessageProps {
  message: Message
  conversationId: string
  onSave: (content: string) => void
  onCancel: () => void
  className?: string
}

/**
 * A component that allows editing of AI messages for regeneration
 */
const EditableMessage = ({
  message,
  conversationId,
  onSave,
  onCancel,
  className = '',
}: EditableMessageProps) => {
  const [content, setContent] = useState(message.content)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Use our message actions hook
  const { saveEdit, updateEditContent } = useMessageActions({ conversationId })

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()

      // Set cursor at the end of the text
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)

      // Auto-resize the textarea
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  // Update the edit session content when the local content changes
  useEffect(() => {
    updateEditContent(content)
  }, [content, updateEditContent])

  /**
   * Handle content changes
   */
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newContent = e.target.value
    setContent(newContent)

    // Auto-resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  /**
   * Handle saving the edited message
   */
  async function handleSave() {
    if (content.trim() === message.content.trim()) {
      // No changes, just cancel
      onCancel()
      return
    }

    try {
      setIsSaving(true)

      // Save the edit
      saveEdit(content)

      // Call the onSave callback
      onSave(content)
    } catch (error) {
      console.error('Failed to save edit:', error)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(e: React.KeyboardEvent) {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }

    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className={cn('group flex w-full gap-3 px-4 py-3', className)}>
      <div className="flex max-w-[85%] flex-col gap-2">
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 shadow-sm transition-all duration-200',
            'bg-card border border-border rounded-bl-md text-card-foreground',
            'border-primary/50'
          )}
        >
          {/* Editable textarea */}
          <div className="text-sm leading-relaxed">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className={cn(
                'resize-none min-h-[100px] w-full',
                'border border-input bg-background',
                'focus-visible:ring-1 focus-visible:ring-ring',
                'text-sm leading-relaxed'
              )}
              placeholder="Edit message..."
              aria-label="Edit message content"
            />
          </div>

          {/* Timestamp and actions */}
          <div className="flex items-center justify-between gap-2 mt-3 text-xs text-muted-foreground">
            <span>{formatMessageTime(message.created_at)}</span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSaving}
                className="h-8 px-3"
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || content.trim() === message.content.trim()}
                className="h-8 px-3"
                aria-label="Save changes and regenerate"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3 mr-1 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  'Regenerate'
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="mt-2 text-xs text-muted-foreground">
            <span>
              Press <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Esc</kbd> to
              cancel,{' '}
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Ctrl+Enter</kbd> to
              save
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditableMessage
