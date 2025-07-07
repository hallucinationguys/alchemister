import { create } from 'zustand'
import type { ProviderResponse, UserProviderSettingResponse } from '@/settings/types'

export interface AvailableModel {
  id: string
  name: string
  display_name: string
  provider_name: string
  provider_display_name: string
  provider_id: string
  is_active: boolean
  has_api_key: boolean
}

interface CacheState {
  providers: ProviderResponse[]
  userSettings: UserProviderSettingResponse[]
  models: AvailableModel[]
  lastFetched: {
    providers: number | null
    userSettings: number | null
  }
  selectedModel: AvailableModel | null
}

interface LoadingState {
  providers: boolean
  userSettings: boolean
  global: boolean
}

interface ProvidersState extends CacheState {
  // Loading states
  loading: LoadingState
  error: string | null

  // Actions
  fetchProviders: () => Promise<void>
  fetchUserSettings: () => Promise<void>
  fetchAll: (force?: boolean) => Promise<void>
  setSelectedModel: (model: AvailableModel | null) => void
  invalidateCache: () => void
  updateUserSettings: (settings: UserProviderSettingResponse[]) => void

  // Selectors
  getConfiguredModels: () => AvailableModel[]
  getUnconfiguredModels: () => AvailableModel[]
  isDataStale: () => boolean
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Helper function to process models from providers and settings
const processModels = (
  providers: ProviderResponse[],
  userSettings: UserProviderSettingResponse[]
): AvailableModel[] => {
  const availableModels: AvailableModel[] = []

  providers.forEach(provider => {
    const userSetting = userSettings.find(s => s.provider_id === provider.id)
    const hasApiKey = userSetting?.api_key_set && userSetting?.is_active

    provider.models.forEach(model => {
      if (model.is_active) {
        availableModels.push({
          id: model.id,
          name: model.name,
          display_name: model.display_name,
          provider_name: provider.name,
          provider_display_name: provider.display_name,
          provider_id: provider.id,
          is_active: model.is_active,
          has_api_key: hasApiKey || false,
        })
      }
    })
  })

  // Sort models: configured models first, then by provider name, then by model name
  availableModels.sort((a, b) => {
    if (a.has_api_key !== b.has_api_key) {
      return b.has_api_key ? 1 : -1
    }
    if (a.provider_display_name !== b.provider_display_name) {
      return a.provider_display_name.localeCompare(b.provider_display_name)
    }
    return a.display_name.localeCompare(b.display_name)
  })

  return availableModels
}

// Helper function to check if cache is still valid
const isCacheValid = (timestamp: number | null): boolean => {
  if (!timestamp) return false
  return Date.now() - timestamp < CACHE_DURATION
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  // Initial state
  providers: [],
  userSettings: [],
  models: [],
  lastFetched: {
    providers: null,
    userSettings: null,
  },
  selectedModel: null,
  loading: {
    providers: false,
    userSettings: false,
    global: false,
  },
  error: null,

  // Fetch providers only
  fetchProviders: async () => {
    const state = get()

    // Skip if already loading or cache is valid
    if (state.loading.providers || isCacheValid(state.lastFetched.providers)) {
      return
    }

    set(state => ({
      loading: { ...state.loading, providers: true, global: true },
      error: null,
    }))

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/settings/api/provider', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`)
      }

      const data = await response.json()
      const providers = data.data || []

      set(state => {
        const newModels = processModels(providers, state.userSettings)
        return {
          providers,
          models: newModels,
          lastFetched: { ...state.lastFetched, providers: Date.now() },
          loading: { ...state.loading, providers: false, global: false },
          error: null,
        }
      })
    } catch (error) {
      set(state => ({
        loading: { ...state.loading, providers: false, global: false },
        error: error instanceof Error ? error.message : 'Failed to fetch providers',
      }))
    }
  },

  // Fetch user settings only
  fetchUserSettings: async () => {
    const state = get()

    // Skip if already loading or cache is valid
    if (state.loading.userSettings || isCacheValid(state.lastFetched.userSettings)) {
      return
    }

    set(state => ({
      loading: { ...state.loading, userSettings: true, global: true },
      error: null,
    }))

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/settings/api/settings', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user settings: ${response.statusText}`)
      }

      const data = await response.json()
      const userSettings = data.data || []

      set(state => {
        const newModels = processModels(state.providers, userSettings)
        return {
          userSettings,
          models: newModels,
          lastFetched: { ...state.lastFetched, userSettings: Date.now() },
          loading: { ...state.loading, userSettings: false, global: false },
          error: null,
        }
      })
    } catch (error) {
      set(state => ({
        loading: { ...state.loading, userSettings: false, global: false },
        error: error instanceof Error ? error.message : 'Failed to fetch user settings',
      }))
    }
  },

  // Fetch both providers and user settings
  fetchAll: async (force = false) => {
    const state = get()

    const needsProviders = force || !isCacheValid(state.lastFetched.providers)
    const needsSettings = force || !isCacheValid(state.lastFetched.userSettings)

    // Skip if nothing needs to be fetched
    if (!needsProviders && !needsSettings) {
      return
    }

    // If already loading, don't start another fetch
    if (state.loading.global) {
      return
    }

    set(state => ({
      loading: {
        providers: needsProviders,
        userSettings: needsSettings,
        global: true,
      },
      error: null,
    }))

    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      }

      const requests = []
      if (needsProviders) {
        requests.push(fetch('/settings/api/provider', { headers }))
      }
      if (needsSettings) {
        requests.push(fetch('/settings/api/settings', { headers }))
      }

      const responses = await Promise.all(requests)

      // Check if all responses are ok
      responses.forEach((response, index) => {
        if (!response.ok) {
          const type =
            needsProviders && needsSettings
              ? index === 0
                ? 'providers'
                : 'settings'
              : needsProviders
                ? 'providers'
                : 'settings'
          throw new Error(`Failed to fetch ${type}: ${response.statusText}`)
        }
      })

      const data = await Promise.all(responses.map(r => r.json()))

      set(state => {
        let newProviders = state.providers
        let newUserSettings = state.userSettings
        const newLastFetched = { ...state.lastFetched }

        if (needsProviders) {
          newProviders = data[needsSettings ? 0 : 0].data || []
          newLastFetched.providers = Date.now()
        }

        if (needsSettings) {
          newUserSettings = data[needsProviders ? 1 : 0].data || []
          newLastFetched.userSettings = Date.now()
        }

        const newModels = processModels(newProviders, newUserSettings)

        // Auto-select first available model if none selected and models are available
        let selectedModel = state.selectedModel
        if (!selectedModel && newModels.length > 0) {
          selectedModel = newModels.find(m => m.has_api_key) || newModels[0]
        }

        return {
          providers: newProviders,
          userSettings: newUserSettings,
          models: newModels,
          selectedModel,
          lastFetched: newLastFetched,
          loading: {
            providers: false,
            userSettings: false,
            global: false,
          },
          error: null,
        }
      })
    } catch (error) {
      set(state => ({
        loading: {
          providers: false,
          userSettings: false,
          global: false,
        },
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }))
    }
  },

  // Set selected model
  setSelectedModel: (model: AvailableModel | null) => set({ selectedModel: model }),

  // Invalidate cache (force refresh on next fetch)
  invalidateCache: () =>
    set({
      lastFetched: {
        providers: null,
        userSettings: null,
      },
    }),

  // Update user settings (called after saving settings)
  updateUserSettings: (userSettings: UserProviderSettingResponse[]) =>
    set(state => {
      const newModels = processModels(state.providers, userSettings)
      return {
        userSettings,
        models: newModels,
        lastFetched: { ...state.lastFetched, userSettings: Date.now() },
      }
    }),

  // Selectors
  getConfiguredModels: () => {
    const state = get()
    return state.models.filter(m => m.has_api_key)
  },

  getUnconfiguredModels: () => {
    const state = get()
    return state.models.filter(m => !m.has_api_key)
  },

  isDataStale: () => {
    const state = get()
    return (
      !isCacheValid(state.lastFetched.providers) || !isCacheValid(state.lastFetched.userSettings)
    )
  },
}))

// Optimized selectors to prevent unnecessary re-renders
export const useProvidersData = () =>
  useProvidersStore(state => ({
    providers: state.providers,
    userSettings: state.userSettings,
    models: state.models,
  }))

export const useProvidersLoading = () =>
  useProvidersStore(state => ({
    loading: state.loading,
    error: state.error,
  }))

export const useSelectedModel = () => useProvidersStore(state => state.selectedModel)

export const useModelSelection = () =>
  useProvidersStore(state => ({
    selectedModel: state.selectedModel,
    setSelectedModel: state.setSelectedModel,
  }))

export const useProvidersActions = () =>
  useProvidersStore(state => ({
    fetchProviders: state.fetchProviders,
    fetchUserSettings: state.fetchUserSettings,
    fetchAll: state.fetchAll,
    invalidateCache: state.invalidateCache,
    updateUserSettings: state.updateUserSettings,
  }))

export const useConfiguredModels = () =>
  useProvidersStore(state => state.models.filter(m => m.has_api_key))

export const useUnconfiguredModels = () =>
  useProvidersStore(state => state.models.filter(m => !m.has_api_key))

export const useIsDataStale = () => useProvidersStore(state => state.isDataStale())

// Specific model selectors
export const useAvailableModels = () => useProvidersStore(state => state.models)

export const useProviderById = (providerId: string) =>
  useProvidersStore(state => state.providers.find(p => p.id === providerId) || null)
