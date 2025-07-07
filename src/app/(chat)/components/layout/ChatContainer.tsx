import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarInset } from '@/components/ui/sidebar'
import ChatHeader from '@/chat/components/chat/ChatHeader'
import MessageList from '@/chat/components/chat/MessageList'
import MessageInput from '@/chat/components/chat/MessageInput'
import { toast } from 'sonner'
import { useEffect } from 'react'
import type { Message } from '@/chat/types/conversation'

interface ChatContainerProps {
  // Header props
  title?: string
  loading?: boolean
  showBackButton?: boolean
  onBackClick?: () => void

  // Messages props
  messages?: Message[]
  streaming?: boolean
  streamingContent?: string

  // Input props
  onSendMessage?: (content: string) => void
  inputDisabled?: boolean
  onStopStreaming?: () => void

  // Model selector props
  showModelSelector?: boolean

  // Error handling
  error?: string | null
  onRetry?: () => void

  className?: string
}

const ChatContainer = ({
  title = 'Chat',
  loading = false,
  showBackButton = false,
  onBackClick,
  messages = [],
  streaming = false,
  streamingContent = '',
  onSendMessage,
  inputDisabled = false,
  onStopStreaming,
  showModelSelector = false,
  error,
  onRetry,
  className = '',
}: ChatContainerProps) => {
  // Show error notification when error prop changes
  useEffect(() => {
    if (error) {
      toast.error(error, {
        description: 'Please try again or check your connection.',
      })
    }
  }, [error])

  const handleSendMessage = (content: string) => {
    if (onSendMessage && !inputDisabled) {
      onSendMessage(content)
    }
  }

  return (
    <SidebarInset className={`flex flex-col ${className}`}>
      <ChatHeader
        title={title}
        loading={loading}
        onBackClick={onBackClick}
        showBackButton={showBackButton}
        showModelSelector={showModelSelector}
        disabled={loading || streaming}
      />

      {error && messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="size-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="mt-4">
                <RotateCcw className="size-4 mr-2" />
                Try again
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <MessageList
            messages={messages}
            streaming={streaming}
            streamingContent={streamingContent}
            loading={loading}
          />

          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={inputDisabled}
            streaming={streaming}
            onStopStreaming={onStopStreaming}
            placeholder={
              streaming
                ? 'AI is responding...'
                : inputDisabled
                  ? 'Unable to send messages'
                  : 'Type your message...'
            }
          />
        </>
      )}
    </SidebarInset>
  )
}

export default ChatContainer
