'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ChatLayout from '../../components/layout/chat-layout'
import ChatContainer from '../../components/layout/chat-container'
import { useChatHistory } from '../../hooks/use-chat-history'
import { useChatSession } from '../../hooks/use-chat-session'
import type {
  ConversationSummaryResponse,
  CreateConversationRequest,
} from '../../types/conversation'

const ConversationPage = () => {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

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
    streamError,
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
    // TODO: Implement edit conversation title functionality
    console.log('Edit conversation:', conversation.id)
    // This could open a dialog to edit the title
  }

  const handleDeleteConversation = (conversation: ConversationSummaryResponse) => {
    // TODO: Implement delete conversation functionality
    console.log('Delete conversation:', conversation.id)
    // If deleting the current conversation, redirect to main chat page
    if (conversation.id === conversationId) {
      router.push('/chat')
    }
  }

  const handleLoadMore = () => {
    if (!historyLoading && hasMore) {
      loadMore()
    }
  }

  const handleSendMessage = async (content: string, modelId?: string) => {
    if (!conversationId || streaming) return

    try {
      await sendMessage({ content, model_id: modelId })
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
        streamError={streamError}
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
