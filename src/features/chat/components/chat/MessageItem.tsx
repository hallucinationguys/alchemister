'use client'

import { cn } from '@/shared/lib/utils'
import { formatMessageTime } from '@/features/chat/lib/chat-utils'
import React from 'react'
import { useMessageActions } from '@/features/chat/hooks'

import { EditableMessage } from '@/features/chat/components/chat'
import { MessageActions } from '@/features/chat/components/chat'
import MarkdownRenderer from './MarkdownRenderer'
import type { Message } from '@/features/chat/types/conversation'

/**
 * Props for the MessageItem component
 *
 * @property message - The message object to display
 * @property conversationId - The ID of the conversation this message belongs to
 * @property isStreaming - Whether this message is currently streaming
 * @property streamingContent - The content being streamed for this message
 * @property className - Additional CSS classes to apply
 */
interface MessageItemProps {
  message: Message
  conversationId: string
  isStreaming?: boolean
  streamingContent?: string
  className?: string
}

const MessageItem = ({
  message,
  conversationId,
  isStreaming = false,
  streamingContent = '',
  className = '',
}: MessageItemProps) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isEdited = message.is_edited

  // Use streaming content if this message is currently streaming, otherwise use message content
  const displayContent = isStreaming && streamingContent ? streamingContent : message.content

  // Use our message actions hook
  const { cancelEditing, isEditing, currentEditMessageId } = useMessageActions({ conversationId })

  // Handle saving edited message
  const handleSaveEdit = (content: string) => {
    // The actual saving is handled by the useMessageActions hook
    // This is just for any additional UI updates
  }

  // Handle canceling edit
  const handleCancelEdit = () => {
    cancelEditing()
  }

  // Determine if this message is currently being edited
  const isCurrentlyEditing = isEditing && currentEditMessageId === message.id

  // If the message is being edited, render the EditableMessage component
  if (isCurrentlyEditing) {
    return (
      <EditableMessage
        message={message}
        conversationId={conversationId}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        className={className}
      />
    )
  }

  // Otherwise, render the normal message view
  return (
    <div
      className={cn(
        'group flex w-full gap-6 px-8 py-5',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div className={cn('flex max-w-[80%] flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative px-4 py-3 transition-all duration-200',
            isUser
              ? 'bg-primary text-primary-foreground rounded-[0.65rem] rounded-br-sm shadow-sm'
              : 'bg-card text-foreground border border-border rounded-[0.65rem] rounded-bl-sm shadow-sm hover:shadow-md'
          )}
        >
          {/* Message content */}
          <div aria-live={isStreaming ? 'polite' : 'off'}>
            {/* Show typing indicator if streaming and no content yet */}
            {isStreaming && displayContent.length === 0 ? (
              <div className="flex items-center gap-1.5 py-1" aria-label="AI is thinking">
                <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                <span className="size-2 rounded-full bg-muted-foreground animate-bounce" />
              </div>
            ) : (
              <>
                {/* Display content with enhanced markdown rendering */}
                <MarkdownRenderer
                  content={displayContent}
                  isUserMessage={isUser}
                  className="leading-relaxed"
                />
              </>
            )}
            {/* Show blinking cursor only while streaming with content */}
            {isStreaming && displayContent.length > 0 && (
              <span
                className="inline-block w-0.5 h-4 bg-foreground/80 animate-pulse ml-1"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Timestamp */}
          <div
            className={cn(
              'flex items-center gap-1 mt-2 text-xs',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            <span>{formatMessageTime(message.created_at)}</span>
            {isEdited && <span className="italic ml-1">(edited)</span>}
          </div>
        </div>

        {/* Action toolbar for AI messages - positioned outside the bubble */}
        {isAssistant && displayContent && !isStreaming && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <MessageActions
              message={message}
              conversationId={conversationId}
              className="flex items-center gap-1"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageItem
