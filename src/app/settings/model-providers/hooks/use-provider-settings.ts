import { useState } from 'react'
import { useProvidersStore } from '@/chat/stores/providers'
import type {
  UpsertUserProviderSettingRequest,
  UserProviderSettingResponse,
} from '@/settings/types'

interface UseProviderSettingsResult {
  saveSettings: (
    data: UpsertUserProviderSettingRequest
  ) => Promise<UserProviderSettingResponse | undefined>
  loading: boolean
  error: string | null
}

export const useProviderSettings = (): UseProviderSettingsResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updateUserSettings, userSettings } = useProvidersStore()

  const saveSettings = async (data: UpsertUserProviderSettingRequest) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      }

      const response = await fetch('/settings/api/settings', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to save settings')
      }

      const responseData = await response.json()
      const newSetting = responseData.data as UserProviderSettingResponse

      // Update the store with the new setting
      const updatedSettings = userSettings.map(setting =>
        setting.provider_id === newSetting.provider_id ? newSetting : setting
      )

      // If this is a new setting, add it to the array
      if (!userSettings.some(setting => setting.provider_id === newSetting.provider_id)) {
        updatedSettings.push(newSetting)
      }

      updateUserSettings(updatedSettings)

      return newSetting
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('Error saving settings:', err)
      return undefined
    } finally {
      setLoading(false)
    }
  }

  return {
    saveSettings,
    loading,
    error,
  }
}
