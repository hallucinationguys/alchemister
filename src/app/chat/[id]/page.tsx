'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { ArrowLeft } from 'lucide-react'
import ChatLayout from '@/features/chat/components/layout/ChatLayout'
import ChatContainer from '@/features/chat/components/layout/ChatContainer'
import { useChatHistory } from '@/features/chat/hooks/use-chat-history'
import { useChatSession } from '@/features/chat/hooks/use-chat-session'
import { useProviders } from '@/features/chat/hooks/use-providers'
import type {
  ConversationSummaryResponse,
  CreateConversationRequest,
} from '@/features/chat/types/conversation'

const ConversationPage = () => {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const { selectedModel } = useProviders()

  const {
    conversations,
    loading: historyLoading,
    error: historyError,
    hasMore,
    startNewChat,
    loadMore,
    refetch: refetchHistory,
  } = useChatHistory()

  const {
    conversation,
    loading: sessionLoading,
    error: sessionError,
    sendMessage,
    streaming,
    streamingContent,
    stopStreaming,
    refetch: refetchSession,
  } = useChatSession({
    conversationId,
  })

  const handleConversationSelect = (selectedConversation: ConversationSummaryResponse) => {
    router.push(`/chat/${selectedConversation.id}`)
  }

  const handleNewConversation = async () => {
    try {
      const newConversationData: CreateConversationRequest = {
        title: 'New Conversation',
        model_name: 'openai/gpt-4o-mini', // Use backend default model format
        temperature: 0.7,
      }

      const newConversation = await startNewChat(newConversationData)
      if (newConversation) {
        router.push(`/chat/${newConversation.id}`)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const handleEditConversation = (conversation: ConversationSummaryResponse) => {
    // Refresh conversation history to get updated titles
    refetchHistory()
  }

  const handleDeleteConversation = (conversation: ConversationSummaryResponse) => {
    // If deleting the current conversation, redirect to main chat page
    if (conversation.id === conversationId) {
      router.push('/chat')
    }
    // Note: useChatHistory automatically removes deleted conversations from state
  }

  const handleLoadMore = () => {
    if (!historyLoading && hasMore) {
      loadMore()
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!conversationId || streaming) return

    try {
      await sendMessage({
        content,
        model_id: selectedModel?.id,
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleBackClick = () => {
    router.push('/chat')
  }

  const handleRetry = () => {
    refetchSession()
  }

  if (!conversationId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Conversation</h1>
          <Button onClick={() => router.push('/chat')}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Chat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ChatLayout
      conversations={conversations}
      currentConversationId={conversationId}
      sidebarLoading={historyLoading}
      hasMore={hasMore}
      onConversationSelect={handleConversationSelect}
      onNewConversation={handleNewConversation}
      onEditConversation={handleEditConversation}
      onDeleteConversation={handleDeleteConversation}
      onLoadMore={handleLoadMore}
      onSidebarRetry={refetchHistory}
    >
      <ChatContainer
        title={conversation?.title || 'Loading...'}
        loading={sessionLoading}
        showBackButton={true}
        onBackClick={handleBackClick}
        messages={conversation?.messages || []}
        streaming={streaming}
        streamingContent={streamingContent}
        onSendMessage={handleSendMessage}
        inputDisabled={streaming}
        onStopStreaming={stopStreaming}
        showModelSelector={true}
        error={sessionError}
        onRetry={handleRetry}
      />
    </ChatLayout>
  )
}

export default ConversationPage
