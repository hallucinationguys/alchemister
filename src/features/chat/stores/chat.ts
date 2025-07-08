import { create } from 'zustand'
import type { ConversationDetailResponse, Message } from '@/features/chat/types/conversation'

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

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  conversations: new Map(),
  currentConversationId: null,
  loading: false,
  error: null,
  streaming: initialStreamingState,

  // Conversation actions
  setCurrentConversation: conversationId => set({ currentConversationId: conversationId }),

  setConversation: conversation =>
    set(state => {
      const newConversations = new Map(state.conversations)
      newConversations.set(conversation.id, conversation)
      return { conversations: newConversations }
    }),

  updateConversation: (conversationId, updates) =>
    set(state => {
      const conversation = state.conversations.get(conversationId)
      if (!conversation) return state

      const newConversations = new Map(state.conversations)
      newConversations.set(conversationId, { ...conversation, ...updates })
      return { conversations: newConversations }
    }),

  addMessage: (conversationId, message) =>
    set(state => {
      const conversation = state.conversations.get(conversationId)
      if (!conversation) return state

      const newConversations = new Map(state.conversations)
      newConversations.set(conversationId, {
        ...conversation,
        messages: [...conversation.messages, message],
      })
      return { conversations: newConversations }
    }),

  updateMessage: (conversationId, messageId, updates) =>
    set(state => {
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
    }),

  // Loading actions
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),

  // Streaming actions
  startStreaming: (conversationId, messageId) =>
    set({
      streaming: {
        isStreaming: true,
        streamingContent: '',
        streamingMessageId: messageId,
      },
    }),

  updateStreamingContent: content =>
    set(state => ({
      streaming: {
        ...state.streaming,
        streamingContent: content,
      },
    })),

  finalizeStreaming: finalContent =>
    set(state => {
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
            streamingContent: finalContent,
            streamingMessageId: null,
          },
        }
      }

      return {
        streaming: {
          isStreaming: false,
          streamingContent: finalContent,
          streamingMessageId: null,
        },
      }
    }),

  stopStreaming: () =>
    set({
      streaming: { ...initialStreamingState },
    }),

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
    set({
      conversations: new Map(),
      currentConversationId: null,
      loading: false,
      error: null,
      streaming: initialStreamingState,
    }),
}))

// Optimized selectors to prevent unnecessary re-renders
export const useChatActions = () =>
  useChatStore(state => ({
    setCurrentConversation: state.setCurrentConversation,
    setConversation: state.setConversation,
    updateConversation: state.updateConversation,
    addMessage: state.addMessage,
    updateMessage: state.updateMessage,
  }))

export const useChatLoading = () =>
  useChatStore(state => ({
    loading: state.loading,
    setLoading: state.setLoading,
    error: state.error,
    setError: state.setError,
  }))

export const useChatStreaming = () =>
  useChatStore(state => ({
    streaming: state.streaming,
    startStreaming: state.startStreaming,
    updateStreamingContent: state.updateStreamingContent,
    finalizeStreaming: state.finalizeStreaming,
    stopStreaming: state.stopStreaming,
  }))

export const useCurrentConversation = () =>
  useChatStore(state => {
    const currentId = state.currentConversationId
    return currentId ? state.conversations.get(currentId) || null : null
  })

export const useConversationById = (conversationId: string | null) =>
  useChatStore(state => (conversationId ? state.conversations.get(conversationId) || null : null))

// Utility selector for streaming state
export const useIsStreaming = () => useChatStore(state => state.streaming.isStreaming)

export const useStreamingContent = () => useChatStore(state => state.streaming.streamingContent)
