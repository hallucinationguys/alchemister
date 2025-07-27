'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ChatLayout, ChatContainer } from '@/features/chat/components/layout'
import { useEffect, useRef } from 'react'
import { useChat } from '@/features/chat/hooks'
import type { ConversationSummaryResponse } from '@/features/chat/types/conversation'

const ConversationPage = () => {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationId = params.id as string
  const initialMessageRef = useRef<string | null>(searchParams.get('message'))
  const initialMessageSentRef = useRef(false)

  // Use our new useChat hook to manage conversation state and actions
  const { conversation, loading, error, sendMessage } = useChat({ conversationId })

  const handleConversationSelect = (selectedConversation: ConversationSummaryResponse) => {
    router.push(`/chat/${selectedConversation.id}`)
  }

  const handleBackClick = () => {
    router.push('/chat')
  }

  // Handle initial message from URL if present
  useEffect(() => {
    const initialMessage = initialMessageRef.current

    if (initialMessage && !initialMessageSentRef.current && !loading && !error && conversationId) {
      // Send the initial message using our new hook
      sendMessage(initialMessage)

      // Clear the URL parameter
      const newUrl = `/chat/${conversationId}`
      router.replace(newUrl)

      // Mark as sent to prevent duplicate sends
      initialMessageSentRef.current = true
      initialMessageRef.current = null
    }
  }, [conversationId, loading, error, router, sendMessage])

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
      currentConversationId={conversationId}
      onConversationSelect={handleConversationSelect}
    >
      <ChatContainer
        conversationId={conversationId}
        title={conversation?.title || 'Loading...'}
        showBackButton={true}
        onBackClick={handleBackClick}
        showModelSelector={true}
      />
    </ChatLayout>
  )
}

export default ConversationPage
