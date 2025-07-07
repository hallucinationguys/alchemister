import { toast } from 'sonner'

// Stable action objects to prevent re-renders
const createRetryAction = (onRetry: () => void) => ({
  label: 'Retry',
  onClick: onRetry,
})

const SETTINGS_ACTION = {
  label: 'Settings',
  onClick: () => {
    window.location.href = '/settings/model-providers'
  },
}

// Specialized notification functions for the chat app
export const showStreamError = (error: string, onRetry?: () => void) => {
  return toast.error('Streaming failed', {
    description: error,
    action: onRetry ? createRetryAction(onRetry) : undefined,
  })
}

export const showConnectionError = (onRetry?: () => void) => {
  return toast.error('Connection failed', {
    description: 'Failed to connect to the server. Please check your internet connection.',
    action: onRetry ? createRetryAction(onRetry) : undefined,
  })
}

export const showApiKeyError = (providerName: string) => {
  return toast.error('API key required', {
    description: `Please configure your API key for ${providerName} in settings.`,
    action: SETTINGS_ACTION,
  })
}
