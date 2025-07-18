import { useState } from 'react'
import { Check, ChevronDown, Settings, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Badge } from '@/shared/ui/badge'
import { toast } from 'sonner'
import { showApiKeyError } from '@/features/chat/lib/toast-utils'
import Link from 'next/link'
import { useProviders, type AvailableModel } from '@/features/chat/hooks/use-providers'
import { cn } from '@/shared/lib/utils'

interface ModelSelectorProps {
  disabled?: boolean
  className?: string
}

const ModelSelector = ({ disabled = false, className = '' }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false)
  const { models, loading, error, selectedModel, setSelectedModel, refetch } = useProviders()
  // Using toast directly - no need for store

  const configuredModels = models.filter((m: AvailableModel) => m.has_api_key)
  const unconfiguredModels = models.filter((m: AvailableModel) => !m.has_api_key)

  // Show error notification if there's an error loading models
  if (error) {
    toast.error('Failed to load models', {
      description: 'Please check your connection and try again.',
    })
    return (
      <Button
        variant="outline"
        onClick={() => refetch()}
        disabled={disabled || loading}
        className={cn('justify-between', className)}
      >
        <span className="text-destructive">Error loading models</span>
        <AlertCircle className="ml-2 size-4 text-destructive" />
      </Button>
    )
  }

  // Show warning notification if no models are configured
  if (configuredModels.length === 0 && !loading) {
    toast.warning('No models configured', {
      description: 'Please configure your API keys in settings to use models.',
    })
    return (
      <Button asChild variant="outline" disabled={disabled} className={className}>
        <Link href="/settings/model-providers">
          <Settings className="mr-2 size-4" />
          Configure API keys
        </Link>
      </Button>
    )
  }

  const handleModelSelect = (model: AvailableModel) => {
    if (model.has_api_key) {
      setSelectedModel(model)
      setOpen(false)
    } else {
      toast.warning('API key required', {
        description: `Please configure your API key for ${model.provider_display_name} first.`,
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
          disabled={disabled || loading}
        >
          {loading ? (
            <span className="text-muted-foreground">Loading models...</span>
          ) : selectedModel ? (
            <div className="flex items-center gap-2">
              <span className="truncate">{selectedModel.display_name}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedModel.provider_display_name}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">Select a model</span>
          )}
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>

            {configuredModels.length > 0 && (
              <CommandGroup heading="Available Models">
                {configuredModels.map(model => (
                  <CommandItem
                    key={model.id}
                    value={`${model.display_name} ${model.provider_display_name}`}
                    onSelect={() => handleModelSelect(model)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        selectedModel?.id === model.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span>{model.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.provider_display_name}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-success/10 text-success border-success/20"
                      >
                        Ready
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {unconfiguredModels.length > 0 && (
              <CommandGroup heading="Needs Configuration">
                {unconfiguredModels.map(model => (
                  <CommandItem
                    key={model.id}
                    value={`${model.display_name} ${model.provider_display_name}`}
                    onSelect={() => handleModelSelect(model)}
                    className="cursor-pointer opacity-60"
                  >
                    <Settings className="mr-2 size-4" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span>{model.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.provider_display_name}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-warning/10 text-warning border-warning/20"
                      >
                        Setup needed
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
                <div className="p-2 border-t">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/settings/model-providers">
                      <Settings className="size-4 mr-2" />
                      Configure API Keys
                    </Link>
                  </Button>
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ModelSelector
