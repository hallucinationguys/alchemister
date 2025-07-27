'use client'

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { providerSettingsService } from '@/api/services/settings-service'
import { handleQueryError, showQueryError } from '@/lib/react-query/errorHandling'
import type {
  ProviderResponse,
  UserProviderSettingResponse,
  UpsertUserProviderSettingRequest,
} from '@/features/settings/types/types'

/**
 * Query keys for provider-related queries
 */
export const providerKeys = {
  all: ['providers'] as const,
  lists: () => [...providerKeys.all, 'list'] as const,
  settings: () => [...providerKeys.all, 'settings'] as const,
  setting: (providerId: string) => [...providerKeys.settings(), providerId] as const,
}

/**
 * Hook for fetching all available providers
 */
export const useProviders = (options?: UseQueryOptions<ProviderResponse[]>) => {
  return useQuery({
    queryKey: providerKeys.lists(),
    queryFn: () => providerSettingsService.getProviders(),
    ...options,
  })
}

/**
 * Hook for fetching user provider settings
 */
export const useProviderSettings = (options?: UseQueryOptions<UserProviderSettingResponse[]>) => {
  return useQuery({
    queryKey: providerKeys.settings(),
    queryFn: () => providerSettingsService.getUserProviderSettings(),
    ...options,
  })
}

/**
 * Hook for updating provider settings
 */
export const useUpdateProviderSettings = () => {
  const queryClient = useQueryClient()

  return useMutation<UserProviderSettingResponse, Error, UpsertUserProviderSettingRequest>({
    mutationFn: (data: UpsertUserProviderSettingRequest) =>
      providerSettingsService.updateProviderSettings(data),
    onSuccess: updatedSetting => {
      // Invalidate and refetch provider settings
      queryClient.invalidateQueries({ queryKey: providerKeys.settings() })

      // Update the specific provider setting in the cache
      queryClient.setQueryData(providerKeys.setting(updatedSetting.provider_id), updatedSetting)
    },
    onError: (error: Error) => {
      const apiError = handleQueryError(error)
      showQueryError(apiError)
    },
  })
}

/**
 * Hook for deleting provider settings
 */
export const useDeleteProviderSettings = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (providerId: string) => providerSettingsService.deleteProviderSettings(providerId),
    onSuccess: (_, providerId) => {
      // Invalidate and refetch provider settings
      queryClient.invalidateQueries({ queryKey: providerKeys.settings() })

      // Remove the specific provider setting from the cache
      queryClient.removeQueries({ queryKey: providerKeys.setting(providerId) })
    },
    onError: (error: Error) => {
      const apiError = handleQueryError(error)
      showQueryError(apiError)
    },
  })
}
