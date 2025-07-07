import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { toast } from 'sonner'
import { useId } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface NotificationState {
  // Simple notification methods that work with Sonner
  showSuccess: (message: string, description?: string) => string
  showError: (message: string, description?: string) => string
  showWarning: (message: string, description?: string) => string
  showInfo: (message: string, description?: string) => string
  showLoading: (message: string) => string

  // Specialized notifications for the chat app
  showStreamError: (error: string, onRetry?: () => void) => string
  showConnectionError: (onRetry?: () => void) => string
  showApiKeyError: (providerName: string) => string

  // Management
  dismiss: (id: string) => void
  dismissAll: () => void
  update: (id: string, message: string) => void
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      showSuccess: (message, description) => {
        const id = `success-${Date.now()}-${Math.random()}`
        toast.success(message, { id, description, duration: 4000 })
        return id
      },

      showError: (message, description) => {
        const id = `error-${Date.now()}-${Math.random()}`
        toast.error(message, { id, description, duration: 6000 })
        return id
      },

      showWarning: (message, description) => {
        const id = `warning-${Date.now()}-${Math.random()}`
        toast.warning(message, { id, description, duration: 5000 })
        return id
      },

      showInfo: (message, description) => {
        const id = `info-${Date.now()}-${Math.random()}`
        toast.info(message, { id, description, duration: 4000 })
        return id
      },

      showLoading: message => {
        const id = `loading-${Date.now()}-${Math.random()}`
        toast.loading(message, { id })
        return id
      },

      // Specialized notifications
      showStreamError: (error, onRetry) => {
        const id = `stream-error-${Date.now()}-${Math.random()}`
        toast.error('Streaming failed', {
          id,
          description: error,
          action: onRetry
            ? {
                label: 'Retry',
                onClick: () => onRetry(),
              }
            : undefined,
        })
        return id
      },

      showConnectionError: onRetry => {
        const id = `connection-error-${Date.now()}-${Math.random()}`
        toast.error('Connection failed', {
          id,
          description: 'Failed to connect to the server. Please check your internet connection.',
          action: onRetry
            ? {
                label: 'Retry',
                onClick: () => onRetry(),
              }
            : undefined,
        })
        return id
      },

      showApiKeyError: providerName => {
        const id = `api-key-error-${Date.now()}-${Math.random()}`
        toast.error('API key required', {
          id,
          description: `Please configure your API key for ${providerName} in settings.`,
          action: {
            label: 'Settings',
            onClick: () => {
              window.location.href = '/settings/model-providers'
            },
          },
        })
        return id
      },

      // Management
      dismiss: id => {
        toast.dismiss(id)
      },

      dismissAll: () => {
        toast.dismiss()
      },

      update: (id, message) => {
        toast.success(message, { id })
      },
    }),
    {
      name: 'notification-store',
    }
  )
)

// Utility hook for generating unique IDs [[memory:2431528]]
export const useNotificationId = () => useId()
