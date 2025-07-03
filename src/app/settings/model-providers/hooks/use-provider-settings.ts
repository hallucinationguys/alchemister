import { useState } from 'react'
import type {
  UpsertUserProviderSettingRequest,
  UserProviderSettingResponse,
  UseProviderSettingsResult,
} from '../../types'

export const useProviderSettings = (): UseProviderSettingsResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      return responseData.data as UserProviderSettingResponse
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
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
