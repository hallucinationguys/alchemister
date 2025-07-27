'use client'

import { useEffect, useRef, memo } from 'react'
import { AlertCircle } from 'lucide-react'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import MessageItem from './MessageItem'
import ChatOnboarding from './ChatOnboarding'
import ChatLoadingState from './ChatLoadingState'
import { useMessages } from '@/features/chat/queries/useMessage'
import type { Message } from '@/features/chat/types/conversation'

/**
 * Props for the MessageList component
 *
 * @property conversationId - The ID of the conversation to display messages for
 * @property streaming - Whether a message is currently streaming
 * @property streamingContent - The content being streamed for the current message
 * @property className - Additional CSS classes to apply
 */
interface MessageListWithQueryProps {
  conversationId: string
  streaming?: boolean
  streamingContent?: string
  className?: string
}

const MessageListWithQuery = memo(
  ({
    conversationId,
    streaming = false,
    streamingContent = '',
    className = '',
  }: MessageListWithQueryProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Fetch messages using React Query
    const { data: messages = [], isLoading, isError, refetch } = useMessages(conversationId)

    // Auto-scroll to bottom when new messages arrive or streaming updates
    useEffect(() => {
      if (messagesEndRef.current && scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('div')
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }, [messages.length, streaming, streamingContent]) // Only depend on message count and streaming state

    if (isLoading && messages.length === 0) {
      return <ChatLoadingState className={className} />
    }

    if (isError) {
      return (
        <div className={`flex flex-1 items-center justify-center ${className}`}>
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load messages</span>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return (
      <ScrollArea ref={scrollAreaRef} className={`h-full ${className}`}>
        <div className="mx-auto max-w-4xl px-6 py-6 pb-32">
          {messages.length === 0 ? (
            <ChatOnboarding />
          ) : (
            <div className="space-y-2">
              {messages.map((message: Message, index: number) => {
                const isStreamingMessage =
                  streaming && index === messages.length - 1 && message.role === 'assistant'

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    conversationId={conversationId}
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

MessageListWithQuery.displayName = 'MessageListWithQuery'

export default MessageListWithQuery
