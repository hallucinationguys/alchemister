'use client'

import { useProviders as useProvidersQuery } from '@/features/chat/queries/useProviders'
import type { AvailableModel } from '@/features/chat/hooks/use-selected-model'

interface UseProvidersOptions {
  autoFetch?: boolean
  fetchOnMount?: boolean
}

/**
 * Hook for accessing provider data and actions
 *
 * This is a wrapper around the React Query hook that provides
 * a simpler interface for components to use.
 */
export const useProviders = (options: UseProvidersOptions = {}) => {
  // Use the React Query hook
  const providersQuery = useProvidersQuery(options)

  return {
    // Data
    providers: providersQuery.providers,
    userSettings: providersQuery.userSettings,
    models: providersQuery.models,
    selectedModel: providersQuery.selectedModel,

    // Computed data
    configuredModels: providersQuery.configuredModels,
    unconfiguredModels: providersQuery.unconfiguredModels,

    // Loading states
    loading: providersQuery.loading,
    error: providersQuery.error,

    // Actions
    setSelectedModel: providersQuery.setSelectedModel,
    updateUserSettings: providersQuery.updateUserSettings,

    // Refetch actions
    refetch: providersQuery.refetchAll,
    refetchProviders: providersQuery.refetchProviders,
    refetchUserSettings: providersQuery.refetchUserSettings,
  }
}

export type { AvailableModel }
