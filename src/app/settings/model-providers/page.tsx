'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Settings } from 'lucide-react'
import ModelCard from '@/app/settings/model-providers/model-card'
import { useAiProviders } from './hooks'
import type { ProviderResponse } from '../types'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const ModelProvidersPage = () => {
  const { providers, userSettings, loading, error, refetch } = useAiProviders()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter providers based on search query
  const filteredProviders = useMemo(() => {
    if (!searchQuery) return providers
    return providers.filter(
      provider =>
        provider.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.models.some(model =>
          model.display_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )
  }, [providers, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const connectedProviders = userSettings.filter(
      setting => setting.api_key_set && setting.is_active
    ).length
    const totalModels = providers.reduce((acc, provider) => acc + provider.models.length, 0)
    const activeModels = providers
      .filter(provider => userSettings.find(s => s.provider_id === provider.id)?.api_key_set)
      .reduce((acc, provider) => acc + provider.models.length, 0)

    return {
      connectedProviders,
      totalProviders: providers.length,
      totalModels,
      activeModels,
    }
  }, [providers, userSettings])

  const getCombinedProviderData = (provider: ProviderResponse) => {
    const userSetting = userSettings.find(setting => setting.provider_id === provider.id)
    console.log(`🔍 Matching provider ${provider.display_name} (${provider.id}) with settings:`, {
      userSetting,
      allUserSettings: userSettings,
      hasMatch: !!userSetting,
    })
    return {
      provider,
      userSetting,
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Models</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and manage your AI model providers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search providers or models..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Found {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''}{' '}
            matching &ldquo;{searchQuery}&rdquo;
          </span>
          {filteredProviders.length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* Providers */}
      {filteredProviders.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No providers found</p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Show all providers
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProviders.map(provider => (
            <ModelCard
              key={provider.id}
              {...getCombinedProviderData(provider)}
              refetchUserSettings={refetch}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ModelProvidersPage
