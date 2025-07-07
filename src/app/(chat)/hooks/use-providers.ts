import { useEffect } from 'react'
import { useProvidersStore, type AvailableModel } from '@/chat/stores/providers'

interface UseProvidersOptions {
  autoFetch?: boolean
  fetchOnMount?: boolean
}

export const useProviders = (options: UseProvidersOptions = {}) => {
  const { autoFetch = true, fetchOnMount = true } = options

  // Get state from store
  const {
    providers,
    userSettings,
    models,
    selectedModel,
    loading,
    error,
    fetchAll,
    fetchProviders,
    fetchUserSettings,
    setSelectedModel,
    invalidateCache,
    updateUserSettings,
    getConfiguredModels,
    getUnconfiguredModels,
    isDataStale,
  } = useProvidersStore()

  // Initialize data on mount
  useEffect(() => {
    if (autoFetch && fetchOnMount) {
      // Only fetch if data is stale or doesn't exist
      if (isDataStale() || providers.length === 0 || userSettings.length === 0) {
        fetchAll()
      }
    }
  }, [autoFetch, fetchOnMount, isDataStale, fetchAll, providers.length, userSettings.length])

  return {
    // Data
    providers,
    userSettings,
    models,
    selectedModel,

    // Computed data
    configuredModels: getConfiguredModels(),
    unconfiguredModels: getUnconfiguredModels(),

    // Loading states
    loading: loading.global,
    loadingProviders: loading.providers,
    loadingUserSettings: loading.userSettings,
    error,

    // Actions
    setSelectedModel,
    fetchAll,
    fetchProviders,
    fetchUserSettings,
    invalidateCache,
    updateUserSettings,

    // Utilities
    refetch: () => fetchAll(true), // Force refresh for backward compatibility
    isDataStale: isDataStale(),
  }
}

export type { AvailableModel }
