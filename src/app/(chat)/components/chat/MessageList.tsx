import { useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'
import type { Message } from '../../types/conversation'

interface MessageListProps {
  messages: Message[]
  streaming?: boolean
  streamingContent?: string
  streamError?: string | null
  loading?: boolean
  className?: string
}

const MessageList = ({
  messages,
  streaming = false,
  streamingContent = '',
  streamError,
  loading = false,
  className = '',
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }, [messages, streaming, streamingContent])

  if (loading && messages.length === 0) {
    return (
      <div className={`flex flex-1 items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full size-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className={`flex-1 ${className}`}>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                  <MessageCircle className="size-8" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Ready to help!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                I&apos;m your AI assistant. Ask me anything, and I&apos;ll do my best to help you
                with information, analysis, creative tasks, and more.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const isStreamingMessage =
                streaming && index === messages.length - 1 && message.role === 'assistant'

              return (
                <MessageItem key={message.id} message={message} isStreaming={isStreamingMessage} />
              )
            })}

            {/* Streaming indicator when AI is thinking/starting */}
            {streaming && !streamingContent && <TypingIndicator />}

            {/* Show streaming content while AI is responding */}
            {streaming && streamingContent && <TypingIndicator content={streamingContent} />}

            {/* Stream error */}
            {streamError && (
              <div className="mx-4 my-6">
                <div className="rounded-2xl bg-destructive/10 border border-destructive/50 p-4 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-destructive" />
                    <span className="text-sm text-destructive font-medium">Error</span>
                  </div>
                  <p className="text-sm text-destructive/80 mt-1">{streamError}</p>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

export default MessageList
