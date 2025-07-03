import { useEffect, useState, useCallback } from 'react'
import type {
  ProviderResponse,
  UserProviderSettingResponse,
  UseAiProvidersResult,
} from '../../types'

const providerDetails: {
  [key: string]: {
    listIcon: string
    tags: string[]
    color: { bg: string; border: string; text: string }
  }
} = {
  openai: {
    listIcon: '/OpenAI-Logo.svg',
    tags: ['LLM', 'TEXT EMBEDDING', 'SPEECH2TEXT', 'MODERATION', 'TTS'],
    color: {
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-900',
    },
  },
  google: {
    listIcon: '/Gemini_Logo.svg',
    tags: ['LLM'],
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-600',
    },
  },
  anthropic: {
    listIcon: '/Anthropic-Logo.svg',
    tags: ['LLM'],
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
    },
  },
  jina: {
    listIcon: '/Jina-Logo.svg',
    tags: ['TEXT EMBEDDING', 'RERANK'],
    color: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-600',
    },
  },
  default: {
    listIcon: '/globe.svg',
    tags: ['Unknown'],
    color: {
      bg: 'bg-gray-100',
      border: 'border-gray-200',
      text: 'text-gray-500',
    },
  },
}

export const useAiProviders = (): UseAiProvidersResult => {
  const [providers, setProviders] = useState<ProviderResponse[]>([])
  const [userSettings, setUserSettings] = useState<UserProviderSettingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')

      const headers = {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      }

      // Fetch all providers using the new API endpoint
      const providersRes = await fetch('/settings/api/provider', { headers })
      if (!providersRes.ok) {
        throw new Error(`Error fetching providers: ${providersRes.statusText}`)
      }
      const providersData = await providersRes.json()
      console.log('🔍 Providers response:', providersData)

      // Map backend response to frontend model, adding UI-specific details
      const enhancedProviders = providersData.data.map((p: ProviderResponse) => {
        const details = providerDetails[p.name] || providerDetails.default
        const enhancedModels = p.models.map(model => {
          const tags = ['LLM', 'CHAT']
          return { ...model, tags }
        })

        return {
          ...p,
          icon: details.listIcon,
          tags: details.tags,
          models: enhancedModels,
          color: details.color,
        }
      })
      console.log('🔍 Enhanced providers:', enhancedProviders)
      setProviders(enhancedProviders)

      // Fetch user settings
      const userSettingsRes = await fetch('/settings/api/settings', { headers })
      if (!userSettingsRes.ok) {
        throw new Error(`Error fetching user settings: ${userSettingsRes.statusText}`)
      }
      const userSettingsData = await userSettingsRes.json()
      console.log('🔍 User settings response:', userSettingsData)
      setUserSettings(userSettingsData.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Failed to fetch AI providers or settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    providers,
    userSettings,
    loading,
    error,
    refetch: fetchData,
  }
}
