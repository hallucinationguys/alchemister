'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarInset } from '@/components/ui/sidebar'
import ChatHeader from '../chat/chat-header'
import MessageList from '../chat/message-list'
import MessageInput from '../chat/message-input'
import ApiKeyError from '../chat/api-key-error'
import { useAvailableModels } from '../../hooks/use-available-models'
import { useState, useEffect } from 'react'
import type { Message } from '../../types/conversation'
import type { AvailableModel } from '../../hooks/use-available-models'

interface ChatContainerProps {
  // Header props
  title?: string
  loading?: boolean
  showBackButton?: boolean
  onBackClick?: () => void

  // Messages props
  messages: Message[]
  streaming?: boolean
  streamingContent?: string
  streamError?: string | null

  // Input props
  onSendMessage: (content: string, modelId?: string) => void
  inputDisabled?: boolean
  showModelSelector?: boolean
  onStopStreaming?: () => void

  // Error handling
  error?: string | null
  onRetry?: () => void

  className?: string
}

const ChatContainer = ({
  title,
  loading = false,
  showBackButton = false,
  onBackClick,
  messages,
  streaming = false,
  streamingContent,
  streamError,
  onSendMessage,
  inputDisabled = false,
  showModelSelector = false,
  onStopStreaming,
  error,
  onRetry,
  className = '',
}: ChatContainerProps) => {
  const { models, loading: modelsLoading } = useAvailableModels()
  const [selectedModel, setSelectedModel] = useState<AvailableModel | null>(null)

  // Auto-select first available model
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0])
    }
  }, [models, selectedModel])

  const handleSendMessage = (content: string) => {
    onSendMessage(content, selectedModel?.id)
  }

  const handleModelChange = (model: AvailableModel) => {
    setSelectedModel(model)
  }

  if (error && messages.length === 0) {
    return (
      <SidebarInset className={`flex flex-col ${className}`}>
        <ChatHeader
          title={title}
          loading={loading}
          showBackButton={showBackButton}
          onBackClick={onBackClick}
          showModelSelector={showModelSelector}
          selectedModelId={selectedModel?.id}
          onModelChange={handleModelChange}
          disabled={modelsLoading || inputDisabled}
        />

        {/* Error state */}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <ApiKeyError error={error} onRetry={onRetry} className="mb-4" />
            {onBackClick && (
              <div className="text-center mt-4">
                <Button variant="ghost" size="sm" onClick={onBackClick}>
                  <ArrowLeft className="size-4 mr-2" />
                  Back to Chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className={`flex flex-col ${className}`}>
      <ChatHeader
        title={title}
        loading={loading}
        showBackButton={showBackButton}
        onBackClick={onBackClick}
        showModelSelector={showModelSelector}
        selectedModelId={selectedModel?.id}
        onModelChange={handleModelChange}
        disabled={modelsLoading || inputDisabled || streaming}
      />

      <div className="flex flex-1 flex-col">
        <MessageList
          messages={messages}
          streaming={streaming}
          streamingContent={streamingContent}
          streamError={streamError}
          loading={loading}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={inputDisabled || streaming || !selectedModel}
          streaming={streaming}
          onStopStreaming={onStopStreaming}
          placeholder={
            !selectedModel
              ? 'Please select a model first...'
              : streaming
                ? 'AI is responding...'
                : 'Type your message...'
          }
        />
      </div>
    </SidebarInset>
  )
}

export default ChatContainer
