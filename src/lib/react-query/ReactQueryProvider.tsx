'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { createQueryClient } from './queryClientConfig'

interface ReactQueryProviderProps {
  children: ReactNode
}

/**
 * React Query provider component that initializes the query client
 * and wraps the application with QueryClientProvider.
 *
 * Includes React Query DevTools in development mode.
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create a new QueryClient instance for each session
  // This ensures that data isn't shared between different users and requests
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
