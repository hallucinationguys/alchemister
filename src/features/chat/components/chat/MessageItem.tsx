'use client'

import { Code, Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { formatMessageTime } from '@/features/chat/lib/chat-utils'
import { useState, memo, useCallback, useMemo } from 'react'
import { Button } from '@/shared/ui/button'
import { useMessageActions } from '@/features/chat/hooks'

import { EditableMessage } from '@/features/chat/components/chat'
import { MessageActions } from '@/features/chat/components/chat'
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

const MessageItem = memo(
  ({
    message,
    conversationId,
    isStreaming = false,
    streamingContent = '',
    className = '',
  }: MessageItemProps) => {
    const [codeBlockIndex, setCodeBlockIndex] = useState<number | null>(null)
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'
    const isEdited = message.is_edited

    // Use streaming content if this message is currently streaming, otherwise use message content
    const displayContent = isStreaming && streamingContent ? streamingContent : message.content

    // Use our message actions hook
    const { copyCode, extractCodeBlocks, cancelEditing, isEditing, currentEditMessageId } =
      useMessageActions({ conversationId })

    // Extract code blocks from the message content
    const codeBlocks = useMemo(() => {
      if (!displayContent) return []
      return extractCodeBlocks(displayContent)
    }, [displayContent, extractCodeBlocks])

    // Handle copying code block to clipboard
    const handleCopyCode = useCallback(
      (code: string, index: number) => {
        copyCode(code)
        setCodeBlockIndex(index)
        setTimeout(() => setCodeBlockIndex(null), 2000)
      },
      [copyCode]
    )

    // Handle saving edited message
    const handleSaveEdit = useCallback((content: string) => {
      // The actual saving is handled by the useMessageActions hook
      // This is just for any additional UI updates
    }, [])

    // Handle canceling edit
    const handleCancelEdit = useCallback(() => {
      cancelEditing()
    }, [cancelEditing])

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
          'group flex w-full gap-3 px-4 py-3',
          isUser ? 'justify-end' : 'justify-start',
          className
        )}
      >
        <div
          className={cn('flex max-w-[85%] flex-col gap-2', isUser ? 'items-end' : 'items-start')}
        >
          <div
            className={cn(
              'relative rounded-2xl px-4 py-3 shadow-sm transition-all duration-200',
              isUser
                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                : 'bg-card border border-border rounded-bl-md text-card-foreground'
            )}
          >
            {/* Message text */}
            <div
              className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words')}
              aria-live={isStreaming ? 'polite' : 'off'}
            >
              {/* Show typing indicator if streaming and no content yet */}
              {isStreaming && displayContent.length === 0 ? (
                <div className="flex items-center gap-1.5 py-1" aria-label="AI is thinking">
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce" />
                </div>
              ) : (
                <>
                  {/* Display content with code blocks highlighted */}
                  {displayContent}

                  {/* Display code blocks with copy buttons */}
                  {codeBlocks.length > 0 && !isStreaming && (
                    <div className="mt-3 space-y-3">
                      {codeBlocks.map((block, index) => (
                        <div
                          key={index}
                          className="relative rounded-md bg-muted/50 p-3 overflow-x-auto"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-muted-foreground">
                              {block.language || 'code'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(block.code, index)}
                              aria-label={`Copy ${block.language || 'code'} code`}
                              className="h-6 px-2 text-muted-foreground hover:text-accent-foreground"
                              tabIndex={0}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleCopyCode(block.code, index)
                                }
                              }}
                            >
                              {codeBlockIndex === index ? (
                                <Check className="size-3" aria-hidden="true" />
                              ) : (
                                <Code className="size-3" aria-hidden="true" />
                              )}
                            </Button>
                          </div>
                          <pre className="text-xs font-mono overflow-x-auto p-1 rounded bg-muted/30">
                            {block.code}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
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

            {/* Timestamp and actions */}
            <div
              className={cn(
                'flex items-center justify-between gap-2 mt-2 text-xs',
                isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-1">
                <span>{formatMessageTime(message.created_at)}</span>
                {isEdited && <span className="text-xs italic ml-1">(edited)</span>}
              </div>

              {/* Action buttons, hidden during streaming */}
              {displayContent && !isStreaming && (
                <MessageActions
                  message={message}
                  conversationId={conversationId}
                  className="flex items-center gap-1"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

MessageItem.displayName = 'MessageItem'

export default MessageItem
