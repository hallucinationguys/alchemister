'use client'

import { useRouter } from 'next/navigation'
import { ChatLayout } from '@/features/chat/components/layout'
import { ChatHeader, ChatOnboarding, MessageInput } from '@/features/chat/components/chat'
import { SidebarInset } from '@/shared/ui/sidebar'
import { useProviders } from '@/features/chat/hooks'
import { useChat } from '@/features/chat/hooks'
import { useState } from 'react'
import { toast } from 'sonner'

import type {
  CreateConversationRequest,
  ConversationSummaryResponse,
} from '@/features/chat/types/conversation'

const ChatPage = () => {
  const router = useRouter()
  const { selectedModel, loading: modelsLoading } = useProviders()
  const [isCreating, setIsCreating] = useState(false)

  // Use our new useChat hook without a conversationId for creating new conversations
  const { createConversation: createNewConversation } = useChat()

  const handleConversationSelect = (conversation: ConversationSummaryResponse) => {
    router.push(`/chat/${conversation.id}`)
  }

  const handleNewConversation = async (initialMessage?: string) => {
    if (!selectedModel || isCreating) return

    setIsCreating(true)

    try {
      const newConversationData: CreateConversationRequest = {
        title: 'New Conversation',
        model_name: selectedModel.name
          ? `${selectedModel.provider_name || ''}/${selectedModel.name}`
          : undefined,
      }

      // Use our new hook to create the conversation
      const newConversationId = await createNewConversation(newConversationData)

      if (newConversationId) {
        const url = initialMessage
          ? `/chat/${newConversationId}?message=${encodeURIComponent(initialMessage)}`
          : `/chat/${newConversationId}`
        router.push(url)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
      toast.error('Failed to create conversation', {
        description: 'Please try again later.',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleSendMessage = (content: string) => {
    if (content.trim() && selectedModel) {
      handleNewConversation(content.trim())
    }
  }

  // Removed unused suggestedPrompts variable

  const welcomeContent = (
    <div className="flex flex-1 flex-col bg-surface">
      {/* Main Content */}
      <ChatOnboarding />

      {/* Message Input */}
      <MessageInput
        conversationId="new"
        disabled={!selectedModel || modelsLoading || isCreating}
        placeholder={
          !selectedModel ? 'Please select a model first...' : 'Type your message here...'
        }
        onStreamEvent={(event: import('@/features/chat/types/conversation').StreamEvent) => {
          if (event.type === 'content_delta' && typeof event.data === 'string') {
            handleSendMessage(event.data)
          }
        }}
      />
    </div>
  )

  return (
    <ChatLayout currentConversationId={undefined} onConversationSelect={handleConversationSelect}>
      <SidebarInset className="flex flex-col">
        <ChatHeader title="AI Assistant" showModelSelector={true} disabled={modelsLoading} />
        {welcomeContent}
      </SidebarInset>
    </ChatLayout>
  )
}

export default ChatPage
