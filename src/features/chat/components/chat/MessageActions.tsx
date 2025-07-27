'use client'

import { useState } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown, Edit, Trash2, RefreshCw } from 'lucide-react'
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
 * @property onLike - Optional callback when the like action is triggered
 * @property onDislike - Optional callback when the dislike action is triggered
 * @property onDelete - Optional callback when the delete action is triggered
 * @property onRegenerate - Optional callback when the regenerate action is triggered
 */
interface MessageActionsProps {
  message: Message
  conversationId: string
  className?: string
  onEdit?: () => void
  onCopy?: () => void
  onLike?: () => void
  onDislike?: () => void
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
  onLike,
  onDislike,
  onDelete,
  onRegenerate,
}: MessageActionsProps) => {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const isAssistant = message.role === 'assistant'

  // Use our message actions hook
  const { copyMessage, startEditing, deleteMessage, regenerateMessage, isRegenerating } =
    useMessageActions({ conversationId })

  /**
   * Handle copying message to clipboard
   */
  function handleCopyMessage() {
    copyMessage(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Call the onCopy callback if provided
    if (onCopy) {
      onCopy()
    }
  }

  /**
   * Handle editing message
   */
  function handleEditMessage() {
    startEditing(message.id)

    // Call the onEdit callback if provided
    if (onEdit) {
      onEdit()
    }
  }

  /**
   * Handle deleting message
   */
  function handleDeleteMessage() {
    deleteMessage(message.id)

    // Call the onDelete callback if provided
    if (onDelete) {
      onDelete()
    }
  }

  /**
   * Handle regenerating message
   */
  function handleRegenerateMessage() {
    regenerateMessage(message.id)

    // Call the onRegenerate callback if provided
    if (onRegenerate) {
      onRegenerate()
    }
  }

  /**
   * Handle liking message
   */
  function handleLikeMessage() {
    setLiked(!liked)
    if (disliked) setDisliked(false) // Remove dislike if present

    // Call the onLike callback if provided
    if (onLike) {
      onLike()
    }
  }

  /**
   * Handle disliking message
   */
  function handleDislikeMessage() {
    setDisliked(!disliked)
    if (liked) setLiked(false) // Remove like if present

    // Call the onDislike callback if provided
    if (onDislike) {
      onDislike()
    }
  }

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
            aria-label={copied ? 'Message copied to clipboard' : 'Copy message to clipboard'}
            aria-pressed={copied}
            className={cn(
              'h-8 w-8 p-0 rounded-md transition-all duration-200',
              'text-muted-foreground hover:text-primary hover:bg-primary/10',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              copied && 'text-primary bg-primary/10'
            )}
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{copied ? 'Copied!' : 'Copy'}</TooltipContent>
      </Tooltip>

      {/* Like button - only for assistant messages */}
      {isAssistant && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeMessage}
              aria-label={liked ? 'Remove like from message' : 'Like this message'}
              aria-pressed={liked}
              className={cn(
                'h-8 w-8 p-0 rounded-md transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                liked
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              )}
            >
              <ThumbsUp className={cn('size-4', liked && 'fill-current')} aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Like</TooltipContent>
        </Tooltip>
      )}

      {/* Dislike button - only for assistant messages */}
      {isAssistant && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislikeMessage}
              aria-label={disliked ? 'Remove dislike from message' : 'Dislike this message'}
              aria-pressed={disliked}
              className={cn(
                'h-8 w-8 p-0 rounded-md transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                disliked
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              )}
            >
              <ThumbsDown className={cn('size-4', disliked && 'fill-current')} aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Dislike</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export default MessageActions
