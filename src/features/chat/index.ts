// Chat Feature Exports
export * from './components/chat'
export * from './types'
export * from './lib'

// Export hooks explicitly to avoid conflicts
export { useProviders } from './hooks/use-providers'
export { useChat } from './hooks/use-chat'

// Export new simplified state hooks
export { useStreamingState } from './hooks/use-streaming-state'
export { useEditingState } from './hooks/use-editing-state'
export { useSelectedModel, type AvailableModel } from './hooks/use-selected-model'
