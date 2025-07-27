'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { useSelectedModel, type AvailableModel } from '@/features/chat/hooks/use-selected-model'
import type { ProviderResponse, UserProviderSettingResponse } from '@/features/settings/types/types'

/**
 * Query keys for provider-related queries
 */
export const providerKeys = {
  all: ['providers'] as const,
  lists: () => [...providerKeys.all, 'list'] as const,
  list: () => [...providerKeys.lists()] as const,
  settings: () => [...providerKeys.all, 'settings'] as const,
  models: () => [...providerKeys.all, 'models'] as const,
}

/**
 * Helper function to process models from providers and settings
 */
const processModels = (
  providers: ProviderResponse[],
  userSettings: UserProviderSettingResponse[]
): AvailableModel[] => {
  const availableModels: AvailableModel[] = []

  providers.forEach(provider => {
    const userSetting = userSettings.find(s => s.provider_id === provider.id)
    const hasApiKey = userSetting?.api_key_set && userSetting?.is_active

    // If provider has models, use them
    if (provider.models && Array.isArray(provider.models)) {
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
    } else {
      // If provider doesn't have models, create a default model
      availableModels.push({
        id: provider.id,
        name: provider.name,
        display_name: provider.display_name,
        provider_name: provider.name,
        provider_display_name: provider.display_name,
        provider_id: provider.id,
        is_active: provider.is_active,
        has_api_key: hasApiKey || false,
      })
    }
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

/**
 * Fetch providers from the API
 */
const fetchProviders = async (): Promise<ProviderResponse[]> => {
  const token = localStorage.getItem('access_token')
  const response = await fetch('/api/settings/providers', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch providers: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Fetch user provider settings from the API
 */
const fetchUserSettings = async (): Promise<UserProviderSettingResponse[]> => {
  const token = localStorage.getItem('access_token')
  const response = await fetch('/api/settings/providers/settings', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user settings: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Update user provider settings
 */
const updateUserSettings = async (
  settings: UserProviderSettingResponse[]
): Promise<UserProviderSettingResponse[]> => {
  const token = localStorage.getItem('access_token')
  const response = await fetch('/api/settings/providers/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ settings }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update user settings: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Hook for fetching providers and user settings
 */
export const useProviders = (options: { autoFetch?: boolean; fetchOnMount?: boolean } = {}) => {
  const { autoFetch = true, fetchOnMount = true } = options
  const queryClient = useQueryClient()

  // Use the provider context
  const { selectedModel, setSelectedModel } = useSelectedModel()

  // Use a ref to track if we've already selected a model to prevent infinite loops
  const hasSelectedModelRef = useRef(false)

  // Fetch providers
  const providersQuery = useQuery({
    queryKey: providerKeys.list(),
    queryFn: fetchProviders,
    enabled: autoFetch && fetchOnMount,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch user settings
  const userSettingsQuery = useQuery({
    queryKey: providerKeys.settings(),
    queryFn: fetchUserSettings,
    enabled: autoFetch && fetchOnMount,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Process models when providers and user settings are available
  const models = useMemo(() => {
    if (providersQuery.data && userSettingsQuery.data) {
      return processModels(providersQuery.data, userSettingsQuery.data)
    }
    return []
  }, [providersQuery.data, userSettingsQuery.data])

  // Auto-select first available model if none selected and models are available
  useEffect(() => {
    if (!selectedModel && models.length > 0 && !hasSelectedModelRef.current) {
      const configuredModel = models.find(m => m.has_api_key)
      if (configuredModel || models[0]) {
        hasSelectedModelRef.current = true
        const modelToSelect = configuredModel || models[0]

        // Use setTimeout to break the potential render cycle
        setTimeout(() => {
          setSelectedModel(modelToSelect)
        }, 0)
      }
    }
  }, [models, selectedModel, setSelectedModel])

  // Update user settings mutation
  const updateUserSettingsMutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: data => {
      // Update the user settings in the cache
      queryClient.setQueryData(providerKeys.settings(), data)

      // Invalidate the models query to trigger a re-fetch
      queryClient.invalidateQueries({ queryKey: providerKeys.models() })
    },
  })

  // Get configured and unconfigured models
  const configuredModels = useMemo(() => models.filter(m => m.has_api_key), [models])
  const unconfiguredModels = useMemo(() => models.filter(m => !m.has_api_key), [models])

  return {
    // Data
    providers: providersQuery.data || [],
    userSettings: userSettingsQuery.data || [],
    models,
    configuredModels,
    unconfiguredModels,
    selectedModel,

    // Loading states
    loading: providersQuery.isLoading || userSettingsQuery.isLoading,
    error: providersQuery.error || userSettingsQuery.error,

    // Actions
    setSelectedModel,
    updateUserSettings: updateUserSettingsMutation.mutate,

    // Refetch actions
    refetchProviders: () => queryClient.invalidateQueries({ queryKey: providerKeys.list() }),
    refetchUserSettings: () => queryClient.invalidateQueries({ queryKey: providerKeys.settings() }),
    refetchAll: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.list() })
      queryClient.invalidateQueries({ queryKey: providerKeys.settings() })
    },
  }
}
