import { useState } from 'react'
import { Check, ChevronDown, Settings, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useAvailableModels, type AvailableModel } from '../../hooks/use-available-models'
import { cn } from '@/lib/utils'

interface ModelSelectorProps {
  selectedModelId?: string
  onModelChange: (model: AvailableModel) => void
  disabled?: boolean
  className?: string
}

const ModelSelector = ({
  selectedModelId,
  onModelChange,
  disabled = false,
  className = '',
}: ModelSelectorProps) => {
  const [open, setOpen] = useState(false)
  const { models, loading, error, refetch } = useAvailableModels()

  const selectedModel = models.find(m => m.id === selectedModelId)
  const configuredModels = models.filter(m => m.has_api_key)
  const unconfiguredModels = models.filter(m => !m.has_api_key)

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="size-4" />
        <AlertDescription>
          Failed to load models.
          <Button
            variant="link"
            size="sm"
            onClick={refetch}
            className="ml-1 h-auto p-0 text-xs underline"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (configuredModels.length === 0 && !loading) {
    return (
      <Alert className={`border-warning/20 bg-warning/10 ${className}`}>
        <Settings className="size-4 text-warning" />
        <AlertDescription className="text-warning-foreground">
          No models configured.
          <Button asChild variant="link" size="sm" className="ml-1 h-auto p-0 text-xs underline">
            <Link href="/settings/model-providers">Configure API keys</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const handleModelSelect = (model: AvailableModel) => {
    if (model.has_api_key) {
      onModelChange(model)
      setOpen(false)
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
                        selectedModelId === model.id ? 'opacity-100' : 'opacity-0'
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
                    disabled
                    className="opacity-60"
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
