import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '@/chat/lib/chat-utils'
import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import type { Message } from '@/chat/types/conversation'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
  className?: string
}

const MessageItem = memo(
  ({ message, isStreaming = false, streamingContent = '', className = '' }: MessageItemProps) => {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'

    // Use streaming content if this message is currently streaming, otherwise use message content
    const displayContent = isStreaming && streamingContent ? streamingContent : message.content

    const copyToClipboard = async () => {
      if (!displayContent) return

      try {
        await navigator.clipboard.writeText(displayContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy message:', err)
      }
    }

    return (
      <div
        className={cn(
          'group flex w-full gap-3 px-4 py-3',
          isUser ? 'justify-end' : 'justify-start',
          className
        )}
      >
        <div className="flex max-w-[85%] flex-col gap-2">
          <div
            className={cn(
              'relative rounded-2xl px-4 py-3 max-w-[85%] shadow-sm transition-all duration-200',
              isUser
                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                : 'bg-card border border-border rounded-bl-md text-card-foreground'
            )}
          >
            {/* Message text */}
            <div className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words')}>
              {/* Show typing indicator if streaming and no content yet */}
              {isStreaming && displayContent.length === 0 ? (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce" />
                </div>
              ) : (
                displayContent
              )}
              {/* Show blinking cursor only while streaming with content */}
              {isStreaming && displayContent.length > 0 && (
                <span className="inline-block w-0.5 h-4 bg-foreground/80 animate-pulse ml-1" />
              )}
            </div>

            {/* Timestamp and actions */}
            <div
              className={cn(
                'flex items-center justify-between gap-2 mt-2 text-xs',
                isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              <span>{formatMessageTime(message.created_at)}</span>

              {/* Copy button for assistant messages, hidden during stream */}
              {isAssistant && displayContent && !isStreaming && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className={cn(
                    'h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity',
                    'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                  )}
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                </Button>
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
