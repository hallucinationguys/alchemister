'use client'

import Image from 'next/image'
import { useState } from 'react'
import type {
  ProviderResponse,
  UserProviderSettingResponse,
  EnhancedProviderResponse,
} from '../types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { useProviderSettings } from './hooks'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ModelList from './ModelList'

interface ModelCardProps {
  provider: EnhancedProviderResponse
  userSetting?: UserProviderSettingResponse
  refetchUserSettings: () => void
}

const ModelCard = ({ provider, userSetting, refetchUserSettings }: ModelCardProps) => {
  console.log(`🔍 ModelCard for ${provider.display_name}:`, {
    provider: provider,
    userSetting: userSetting,
    hasApiKey: userSetting?.api_key_set,
    isActive: userSetting?.is_active,
  })

  const [showModels, setShowModels] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [baseURL, setBaseURL] = useState(userSetting?.api_base_override || '')

  const { saveSettings, loading: upsertLoading, error: upsertError } = useProviderSettings()

  const handleSaveSettings = async () => {
    try {
      await saveSettings({
        provider_id: provider.id,
        api_key: apiKey,
        api_base_override: baseURL,
      })

      setShowSetupDialog(false)
      setApiKey('')
      refetchUserSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const hasApiKey = userSetting?.api_key_set
  const isConnected = hasApiKey && userSetting?.is_active

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <h3 className="font-medium text-foreground">{provider.display_name}</h3>

          {/* Compact Status and Actions */}
          <div className="flex items-center">
            {/* API Key Status */}
            <div className="text-xs text-muted-foreground">API-KEY</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted'}`} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSetupDialog(true)}
                className="h-7 text-xs"
              >
                Setup
              </Button>
            </div>
          </div>
        </div>

        {/* Models Section - More compact */}
        <Collapsible open={showModels} onOpenChange={setShowModels}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <span className="text-sm text-muted-foreground">Show Models</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  showModels ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            {provider.models && provider.models.length > 0 ? (
              <ModelList models={provider.models} providerIcon={provider.icon} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No models available for this provider.
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle>Setup {provider.display_name}</DialogTitle>
              </div>
              <DialogDescription>
                Configure your API credentials to start using {provider.display_name} models.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current Status */}
              {userSetting && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted'}`}
                    />
                    <span className="text-sm">
                      {isConnected ? 'Connected' : hasApiKey ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                </div>
              )}

              {/* API Key Input */}
              <div className="space-y-4">
                <Label htmlFor="apiKey">
                  API Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={
                    hasApiKey ? 'Leave blank to keep existing key' : 'Enter your API key'
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {hasApiKey
                    ? 'Your API key is securely stored. Enter a new one to replace it.'
                    : "Get your API key from the provider's dashboard."}
                </p>
              </div>

              {/* Base URL Override */}
              <div className="space-y-4">
                <Label htmlFor="baseURL">API Base URL (Optional)</Label>
                <Input
                  id="baseURL"
                  value={baseURL}
                  onChange={e => setBaseURL(e.target.value)}
                  placeholder="Leave blank to use default endpoint"
                />
                <p className="text-xs text-muted-foreground">
                  Custom endpoint for proxy or regional deployments.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} disabled={upsertLoading}>
                {upsertLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </DialogFooter>

            {upsertError && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">Error: {upsertError}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ModelCard
