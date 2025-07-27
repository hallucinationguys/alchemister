'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip'
import { useMessageActions } from '@/features/chat/hooks'
import type { Message } from '@/features/chat/types/conversation'

/**
 * Props for the MessageActions component
 *
 * @property message - The message object to provide actions for
 * @property conversationId - The ID of the conversation this message belongs to
 * @property className - Additional CSS classes to apply
 * @property onEdit - Optional callback when the edit action is triggered
 * @property onCopy - Optional callback when the copy action is triggered
 * @property onDelete - Optional callback when the delete action is triggered
 * @property onRegenerate - Optional callback when the regenerate action is triggered
 */
interface MessageActionsProps {
  message: Message
  conversationId: string
  className?: string
  onEdit?: () => void
  onCopy?: () => void
  onDelete?: () => void
  onRegenerate?: () => void
}

/**
 * A component that provides actions for messages (copy, edit, delete, regenerate)
 */
const MessageActions = ({
  message,
  conversationId,
  className = '',
  onEdit,
  onCopy,
  onDelete,
  onRegenerate,
}: MessageActionsProps) => {
  const [copied, setCopied] = useState(false)
  const isAssistant = message.role === 'assistant'

  // Use our message actions hook
  const { copyMessage, startEditing, deleteMessage, regenerateMessage, isRegenerating } =
    useMessageActions({ conversationId })

  /**
   * Handle copying message to clipboard
   */
  const handleCopyMessage = useCallback(() => {
    copyMessage(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Call the onCopy callback if provided
    if (onCopy) {
      onCopy()
    }
  }, [copyMessage, message, onCopy])

  /**
   * Handle editing message
   */
  const handleEditMessage = useCallback(() => {
    startEditing(message.id)

    // Call the onEdit callback if provided
    if (onEdit) {
      onEdit()
    }
  }, [message.id, startEditing, onEdit])

  /**
   * Handle deleting message
   */
  const handleDeleteMessage = useCallback(() => {
    deleteMessage(message.id)

    // Call the onDelete callback if provided
    if (onDelete) {
      onDelete()
    }
  }, [deleteMessage, message.id, onDelete])

  /**
   * Handle regenerating message
   */
  const handleRegenerateMessage = useCallback(() => {
    regenerateMessage(message.id)

    // Call the onRegenerate callback if provided
    if (onRegenerate) {
      onRegenerate()
    }
  }, [message.id, regenerateMessage, onRegenerate])

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="toolbar"
      aria-label="Message actions"
    >
      {/* Copy button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyMessage}
            aria-label="Copy message"
            className={cn(
              'h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
            )}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCopyMessage()
              }
            }}
          >
            {copied ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <Copy className="size-3" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? 'Copied!' : 'Copy message'}</TooltipContent>
      </Tooltip>

      {/* Edit button - only for assistant messages */}
      {isAssistant && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditMessage}
              aria-label="Edit message"
              className={cn(
                'h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
              )}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleEditMessage()
                }
              }}
            >
              <Edit className="size-3" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit message</TooltipContent>
        </Tooltip>
      )}

      {/* Regenerate button - only for assistant messages */}
      {isAssistant && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerateMessage}
              aria-label="Regenerate response"
              disabled={isRegenerating}
              className={cn(
                'h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
              )}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRegenerateMessage()
                }
              }}
            >
              <RefreshCw
                className={cn('size-3', isRegenerating && 'animate-spin')}
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Regenerate response</TooltipContent>
        </Tooltip>
      )}

      {/* Delete button - for both user and assistant messages */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteMessage}
            aria-label="Delete message"
            className={cn(
              'h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-destructive hover:text-destructive-foreground text-muted-foreground'
            )}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleDeleteMessage()
              }
            }}
          >
            <Trash2 className="size-3" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete message</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default MessageActions
