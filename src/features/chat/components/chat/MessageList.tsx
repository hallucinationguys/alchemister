import { useEffect, useRef, memo } from 'react'
import { MessageCircle } from 'lucide-react'
import { ScrollArea } from '@/shared/ui/scroll-area'
import MessageItem from './MessageItem'
import type { Message } from '@/features/chat/types/conversation'

interface MessageListProps {
  messages: Message[]
  streaming?: boolean
  streamingContent?: string
  loading?: boolean
  className?: string
}

const MessageList = memo(
  ({
    messages,
    streaming = false,
    streamingContent = '',
    loading = false,
    className = '',
  }: MessageListProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive or streaming updates
    useEffect(() => {
      if (messagesEndRef.current && scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('div')
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }, [messages.length, streaming, streamingContent]) // Only depend on message count and streaming state

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
      <ScrollArea ref={scrollAreaRef} className={`flex-1 ${className}`}>
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
                  <MessageItem
                    key={message.id}
                    message={message}
                    isStreaming={isStreamingMessage}
                    streamingContent={isStreamingMessage ? streamingContent : undefined}
                  />
                )
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    )
  }
)

MessageList.displayName = 'MessageList'

export default MessageList
