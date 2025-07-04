'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquare, Sparkles, Zap, Bot } from 'lucide-react'
import ChatLayout from '../components/layout/chat-layout'
import ChatHeader from '../components/chat/chat-header'
import MessageInput from '../components/chat/message-input'
import { SidebarInset } from '@/components/ui/sidebar'
import { useChatHistory } from '../hooks/use-chat-history'
import { useAvailableModels } from '../hooks/use-available-models'
import { useState, useEffect } from 'react'

import type { CreateConversationRequest, ConversationSummaryResponse } from '../types/conversation'
import type { AvailableModel } from '../hooks/use-available-models'

const ChatPage = () => {
  const router = useRouter()
  const { models, loading: modelsLoading } = useAvailableModels()
  const [selectedModel, setSelectedModel] = useState<AvailableModel | null>(null)

  const { conversations, loading, error, hasMore, startNewChat, loadMore, refetch } =
    useChatHistory()

  // Auto-select first available model
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0])
    }
  }, [models, selectedModel])

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
    // TODO: Implement edit conversation title functionality
    console.log('Edit conversation:', conversation.id)
  }

  const handleDeleteConversation = (conversation: ConversationSummaryResponse) => {
    // TODO: Implement delete conversation functionality
    console.log('Delete conversation:', conversation.id)
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

  const handleModelChange = (model: AvailableModel) => {
    setSelectedModel(model)
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
        <ChatHeader
          title="AI Assistant"
          showModelSelector={true}
          selectedModelId={selectedModel?.id}
          onModelChange={handleModelChange}
          disabled={modelsLoading}
        />
        {welcomeContent}
      </SidebarInset>
    </ChatLayout>
  )
}

export default ChatPage
