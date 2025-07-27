import { QueryClient } from '@tanstack/react-query'
import { isRetryableError, handleQueryError } from './errorHandling'

/**
 * Creates a new QueryClient with optimized settings for Next.js 15
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time of 1 minute
        staleTime: 60 * 1000,

        // Cache time of 5 minutes
        gcTime: 5 * 60 * 1000,

        // Custom retry logic
        retry: (failureCount, error) => {
          // Convert error to our standard format
          const apiError = handleQueryError(error)

          // Don't retry more than 3 times
          if (failureCount >= 3) {
            return false
          }

          // Only retry if the error is retryable
          return isRetryableError(apiError)
        },

        // Exponential backoff for retries
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Custom retry logic for mutations
        retry: (failureCount, error) => {
          // Convert error to our standard format
          const apiError = handleQueryError(error)

          // Don't retry more than 2 times for mutations
          if (failureCount >= 2) {
            return false
          }

          // Only retry if the error is retryable
          return isRetryableError(apiError)
        },

        // Exponential backoff for retries
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  })
}
