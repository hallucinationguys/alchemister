'use client'

import { useProviders } from '@/features/chat/hooks/use-providers'
import {
  useProviderSettings as useProviderSettingsQuery,
  useUpdateProviderSettings,
  useDeleteProviderSettings,
} from '@/features/settings/queries/useProvider'
import type {
  UpsertUserProviderSettingRequest,
  UserProviderSettingResponse,
} from '@/features/settings/types/types'

interface UseProviderSettingsResult {
  providerSettings: UserProviderSettingResponse[] | undefined
  saveSettings: (
    data: UpsertUserProviderSettingRequest
  ) => Promise<UserProviderSettingResponse | undefined>
  deleteSettings: (providerId: string) => Promise<void>
  loading: boolean
  error: Error | null
  isUpdating: boolean
  isDeleting: boolean
}

export const useProviderSettings = (): UseProviderSettingsResult => {
  // Use React Query hooks
  const providerSettingsQuery = useProviderSettingsQuery()
  const updateProviderSettingsMutation = useUpdateProviderSettings()
  const deleteProviderSettingsMutation = useDeleteProviderSettings()

  // Use the providers hook to get the updateUserSettings function
  const { updateUserSettings } = useProviders()

  const saveSettings = async (data: UpsertUserProviderSettingRequest) => {
    try {
      const result = await updateProviderSettingsMutation.mutateAsync(data)

      // Also update the global store
      if (result && providerSettingsQuery.data) {
        const updatedSettings = [...providerSettingsQuery.data]
        const existingIndex = updatedSettings.findIndex(s => s.provider_id === result.provider_id)

        if (existingIndex >= 0) {
          updatedSettings[existingIndex] = result
        } else {
          updatedSettings.push(result)
        }

        updateUserSettings(updatedSettings)
      }

      return result
    } catch (error) {
      console.error('Error saving provider settings:', error)
      return undefined
    }
  }

  const deleteSettings = async (providerId: string) => {
    try {
      await deleteProviderSettingsMutation.mutateAsync(providerId)

      // Also update the global store
      if (providerSettingsQuery.data) {
        const updatedSettings = providerSettingsQuery.data.filter(
          (setting: UserProviderSettingResponse) => setting.provider_id !== providerId
        )
        updateUserSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Error deleting provider settings:', error)
    }
  }

  return {
    providerSettings: providerSettingsQuery.data,
    saveSettings,
    deleteSettings,
    loading: providerSettingsQuery.isLoading,
    error: providerSettingsQuery.error,
    isUpdating: updateProviderSettingsMutation.isPending,
    isDeleting: deleteProviderSettingsMutation.isPending,
  }
}
