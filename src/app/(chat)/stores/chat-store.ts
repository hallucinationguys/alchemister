import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ConversationDetailResponse, Message } from '../types/conversation'

interface StreamingState {
  isStreaming: boolean
  streamingContent: string
  streamingMessageId: string | null
}

interface ChatState {
  // Conversation state
  conversations: Map<string, ConversationDetailResponse>
  currentConversationId: string | null

  // Loading states
  loading: boolean
  error: string | null

  // Streaming state
  streaming: StreamingState

  // Actions
  setCurrentConversation: (conversationId: string | null) => void
  setConversation: (conversation: ConversationDetailResponse) => void
  updateConversation: (conversationId: string, updates: Partial<ConversationDetailResponse>) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void

  // Loading actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Streaming actions
  startStreaming: (conversationId: string, messageId: string) => void
  updateStreamingContent: (content: string) => void
  finalizeStreaming: (finalContent: string) => void
  stopStreaming: () => void

  // Utils
  getCurrentConversation: () => ConversationDetailResponse | null
  getConversation: (conversationId: string) => ConversationDetailResponse | null
  reset: () => void
}

const initialStreamingState: StreamingState = {
  isStreaming: false,
  streamingContent: '',
  streamingMessageId: null,
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // Initial state
      conversations: new Map(),
      currentConversationId: null,
      loading: false,
      error: null,
      streaming: initialStreamingState,

      // Conversation actions
      setCurrentConversation: conversationId =>
        set({ currentConversationId: conversationId }, false, 'setCurrentConversation'),

      setConversation: conversation =>
        set(
          state => {
            const newConversations = new Map(state.conversations)
            newConversations.set(conversation.id, conversation)
            return { conversations: newConversations }
          },
          false,
          'setConversation'
        ),

      updateConversation: (conversationId, updates) =>
        set(
          state => {
            const conversation = state.conversations.get(conversationId)
            if (!conversation) return state

            const newConversations = new Map(state.conversations)
            newConversations.set(conversationId, { ...conversation, ...updates })
            return { conversations: newConversations }
          },
          false,
          'updateConversation'
        ),

      addMessage: (conversationId, message) =>
        set(
          state => {
            const conversation = state.conversations.get(conversationId)
            if (!conversation) return state

            const newConversations = new Map(state.conversations)
            newConversations.set(conversationId, {
              ...conversation,
              messages: [...conversation.messages, message],
            })
            return { conversations: newConversations }
          },
          false,
          'addMessage'
        ),

      updateMessage: (conversationId, messageId, updates) =>
        set(
          state => {
            const conversation = state.conversations.get(conversationId)
            if (!conversation) return state

            const newMessages = conversation.messages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            )

            const newConversations = new Map(state.conversations)
            newConversations.set(conversationId, {
              ...conversation,
              messages: newMessages,
            })
            return { conversations: newConversations }
          },
          false,
          'updateMessage'
        ),

      // Loading actions
      setLoading: loading => set({ loading }, false, 'setLoading'),
      setError: error => set({ error }, false, 'setError'),

      // Streaming actions
      startStreaming: (conversationId, messageId) =>
        set(
          {
            streaming: {
              isStreaming: true,
              streamingContent: '',
              streamingMessageId: messageId,
            },
          },
          false,
          'startStreaming'
        ),

      updateStreamingContent: content =>
        set(
          state => ({
            streaming: {
              ...state.streaming,
              streamingContent: content,
            },
          }),
          false,
          'updateStreamingContent'
        ),

      finalizeStreaming: finalContent =>
        set(
          state => {
            const { streamingMessageId } = state.streaming
            const { currentConversationId } = state

            if (!streamingMessageId || !currentConversationId) {
              return {
                streaming: { ...initialStreamingState },
              }
            }

            // Update the final message content
            const conversation = state.conversations.get(currentConversationId)
            if (conversation) {
              const newMessages = conversation.messages.map(msg =>
                msg.id === streamingMessageId ? { ...msg, content: finalContent } : msg
              )

              const newConversations = new Map(state.conversations)
              newConversations.set(currentConversationId, {
                ...conversation,
                messages: newMessages,
              })

              return {
                conversations: newConversations,
                streaming: {
                  isStreaming: false,
                  streamingContent: finalContent, // Keep final content visible
                  streamingMessageId: null,
                },
              }
            }

            return {
              streaming: {
                isStreaming: false,
                streamingContent: finalContent, // Keep final content visible
                streamingMessageId: null,
              },
            }
          },
          false,
          'finalizeStreaming'
        ),

      stopStreaming: () =>
        set(
          {
            streaming: { ...initialStreamingState },
          },
          false,
          'stopStreaming'
        ),

      // Utils
      getCurrentConversation: () => {
        const state = get()
        return state.currentConversationId
          ? state.conversations.get(state.currentConversationId) || null
          : null
      },

      getConversation: conversationId => {
        const state = get()
        return state.conversations.get(conversationId) || null
      },

      reset: () =>
        set(
          {
            conversations: new Map(),
            currentConversationId: null,
            loading: false,
            error: null,
            streaming: initialStreamingState,
          },
          false,
          'reset'
        ),
    }),
    {
      name: 'chat-store',
    }
  )
)
