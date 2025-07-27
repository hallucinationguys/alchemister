'use client'

import { SidebarInset } from '@/shared/ui/sidebar'
import { cn } from '@/shared/lib/utils'
import { ChatHeader, MessageList, MessageInput } from '@/features/chat/components/chat'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useChat } from '@/features/chat/hooks'

interface ChatContainerProps {
  // Header props
  conversationId: string
  title?: string
  showBackButton?: boolean
  onBackClick?: () => void

  // Model selector props
  showModelSelector?: boolean

  // Additional props
  className?: string
}

/**
 * Container component for the chat area, including header, message list, and input.
 * Provides fixed positioning for header and input areas.
 */
const ChatContainer = ({
  conversationId,
  title = 'Chat',
  showBackButton = false,
  onBackClick,
  showModelSelector = false,
  className = '',
}: ChatContainerProps) => {
  // Use our chat hook to manage chat state and actions
  const { conversation, streaming, error, handleStreamEvent, stopStreaming } = useChat({
    conversationId,
    autoFetch: true,
    fetchOnMount: true,
  })

  // Display errors as toasts
  useEffect(() => {
    if (error) {
      toast.error(error || 'An error occurred during streaming')
    }
  }, [error])

  return (
    <SidebarInset className={cn('flex flex-col', className)} data-testid="chat-container">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm border-b border-border">
        <ChatHeader
          title={title}
          onBackClick={onBackClick}
          showBackButton={showBackButton}
          showModelSelector={showModelSelector}
          disabled={streaming.isStreaming}
        />
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          conversationId={conversationId}
          streaming={streaming.isStreaming}
          streamingContent={streaming.streamingContent}
        />
      </div>

      {/* Fixed Input Area */}
      <MessageInput
        conversationId={conversationId}
        onStreamEvent={handleStreamEvent}
        streaming={streaming.isStreaming}
        onStopStreaming={stopStreaming}
        placeholder={streaming.isStreaming ? 'AI is responding...' : 'Type your message...'}
      />
    </SidebarInset>
  )
}

export default ChatContainer
