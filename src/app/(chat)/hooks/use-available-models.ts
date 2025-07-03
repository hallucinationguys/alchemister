import { useState, useEffect } from 'react'
import type { ProviderResponse, UserProviderSettingResponse } from '../../settings/types'

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

interface UseAvailableModelsResult {
  models: AvailableModel[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useAvailableModels = (): UseAvailableModelsResult => {
  const [models, setModels] = useState<AvailableModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      }

      // Fetch providers and user settings in parallel
      const [providersRes, userSettingsRes] = await Promise.all([
        fetch('/settings/api/provider', { headers }),
        fetch('/settings/api/settings', { headers }),
      ])

      if (!providersRes.ok) {
        throw new Error(`Error fetching providers: ${providersRes.statusText}`)
      }
      if (!userSettingsRes.ok) {
        throw new Error(`Error fetching user settings: ${userSettingsRes.statusText}`)
      }

      const providersData = await providersRes.json()
      const userSettingsData = await userSettingsRes.json()

      const providers: ProviderResponse[] = providersData.data
      const userSettings: UserProviderSettingResponse[] = userSettingsData.data

      // Create a flat list of all available models with their provider info
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
          return b.has_api_key ? 1 : -1 // configured models first
        }
        if (a.provider_display_name !== b.provider_display_name) {
          return a.provider_display_name.localeCompare(b.provider_display_name)
        }
        return a.display_name.localeCompare(b.display_name)
      })

      setModels(availableModels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
      console.error('Error fetching available models:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  }
}
