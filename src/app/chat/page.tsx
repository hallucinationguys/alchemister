'use client'

import { useRouter } from 'next/navigation'
import { MessageSquare, Sparkles, Zap, Bot } from 'lucide-react'
import ChatLayout from '@/features/chat/components/layout/ChatLayout'
import ChatHeader from '@/features/chat/components/chat/ChatHeader'
import MessageInput from '@/features/chat/components/chat/MessageInput'
import { SidebarInset } from '@/shared/ui/sidebar'
import { useChatHistory } from '@/features/chat/hooks/use-chat-history'
import { useProviders } from '@/features/chat/hooks/use-providers'

import type {
  CreateConversationRequest,
  ConversationSummaryResponse,
} from '@/features/chat/types/conversation'

const ChatPage = () => {
  const router = useRouter()
  const { selectedModel, loading: modelsLoading } = useProviders()

  const { conversations, loading, error, hasMore, startNewChat, loadMore, refetch } =
    useChatHistory()

  const handleConversationSelect = (conversation: ConversationSummaryResponse) => {
    router.push(`/chat/${conversation.id}`)
  }

  const handleNewConversation = async (initialMessage?: string) => {
    if (!selectedModel) return

    try {
      const newConversationData: CreateConversationRequest = {
        title: 'New Conversation',
        model_name: `${selectedModel.provider_name}/${selectedModel.name}`,
        temperature: 0.7,
      }

      const newConversation = await startNewChat(newConversationData)
      if (newConversation) {
        const url = initialMessage
          ? `/chat/${newConversation.id}?message=${encodeURIComponent(initialMessage)}`
          : `/chat/${newConversation.id}`
        router.push(url)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const handleEditConversation = (conversation: ConversationSummaryResponse) => {
    // Note: useChatHistory automatically updates conversation titles in state
  }

  const handleDeleteConversation = (conversation: ConversationSummaryResponse) => {
    // Note: useChatHistory automatically removes deleted conversations from state
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMore()
    }
  }

  const handleSendMessage = (content: string) => {
    if (content.trim() && selectedModel) {
      handleNewConversation(content.trim())
    }
  }

  // Suggested prompts
  const suggestedPrompts = [
    {
      icon: <MessageSquare className="size-5" />,
      title: 'Start a conversation',
      description: "Ask me anything you'd like to know",
      prompt: 'Hello! What can you help me with today?',
    },
    {
      icon: <Sparkles className="size-5" />,
      title: 'Creative writing',
      description: 'Help with stories, poems, or creative content',
      prompt: 'Help me write a creative story about a time traveler',
    },
    {
      icon: <Zap className="size-5" />,
      title: 'Problem solving',
      description: 'Get help with analysis and solutions',
      prompt: 'Help me analyze and solve a complex problem',
    },
  ]

  const welcomeContent = (
    <div className="flex flex-1 flex-col bg-surface">
      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-8">
          {/* AI Assistant Avatar and Greeting */}
          <div className="space-y-6">
            <div className="relative mb-8">
              <div className="flex size-20 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                <Bot className="size-10" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">Welcome to AI Assistant</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                I&apos;m here to help you with information, creative tasks, problem-solving, and
                more. What would you like to explore today?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!selectedModel || modelsLoading}
        placeholder={
          !selectedModel ? 'Please select a model first...' : 'Type your message here...'
        }
      />
    </div>
  )

  return (
    <ChatLayout
      conversations={conversations}
      sidebarLoading={loading}
      hasMore={hasMore}
      onConversationSelect={handleConversationSelect}
      onNewConversation={() => handleNewConversation()}
      onEditConversation={handleEditConversation}
      onDeleteConversation={handleDeleteConversation}
      onLoadMore={handleLoadMore}
      onSidebarRetry={refetch}
    >
      <SidebarInset className="flex flex-col">
        <ChatHeader title="AI Assistant" showModelSelector={true} disabled={modelsLoading} />
        {welcomeContent}
      </SidebarInset>
    </ChatLayout>
  )
}

export default ChatPage
