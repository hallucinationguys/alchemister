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

  // Model selector props
  showModelSelector?: boolean

  // Additional props
  className?: string
}

/**
 * Container component for the chat area, including header, message list, and input.
 * Optimized for ChatGPT-like scrolling experience with proper height management.
 */
const ChatContainer = ({
  conversationId,
  title = 'Chat',
  showBackButton = false,
  showModelSelector = false,
  className = '',
}: ChatContainerProps) => {
  // Use our chat hook to manage chat state and actions
  const { streaming, error, handleStreamEvent, stopStreaming } = useChat({
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
    <SidebarInset
      className={cn('flex flex-col h-full relative', className)}
      data-testid="chat-container"
    >
      {/* Header - Clean design without borders */}
      {title && (
        <div className="flex-shrink-0 z-20 bg-background">
          <ChatHeader
            title={title}
            showBackButton={showBackButton}
            showModelSelector={showModelSelector}
            disabled={streaming.isStreaming}
          />
        </div>
      )}

      {/* Scrollable Message Area - Takes remaining height */}
      <div className="flex-1 min-h-0">
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
        placeholder={streaming.isStreaming ? 'AI is responding...' : 'Ask anything'}
      />
    </SidebarInset>
  )
}

export default ChatContainer
