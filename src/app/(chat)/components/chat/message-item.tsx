'use client'

import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '../../lib/chat-utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Message } from '../../types/conversation'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  error?: string
  className?: string
}

const MessageItem = ({ message, isStreaming = false, error, className = '' }: MessageItemProps) => {
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const copyToClipboard = async () => {
    if (!message.content) return

    try {
      await navigator.clipboard.writeText(message.content)
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
              : 'bg-card border border-border rounded-bl-md text-card-foreground',
            error && 'border-destructive/50 bg-destructive/10'
          )}
        >
          {/* Message text */}
          <div className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words')}>
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-5 ml-1 bg-current animate-pulse opacity-75" />
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

            {/* Copy button for assistant messages */}
            {isAssistant && message.content && (
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

          {/* Error message */}
          {error && <div className="mt-2 text-xs text-destructive">Error: {error}</div>}
        </div>
      </div>
    </div>
  )
}

export default MessageItem
