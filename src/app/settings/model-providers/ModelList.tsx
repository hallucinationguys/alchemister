'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Model } from '../types'

interface ModelListProps {
  models: Model[]
  providerIcon?: string
}

const ModelList = ({ models, providerIcon }: ModelListProps) => {
  return (
    <div className="space-y-1">
      {models.map(model => (
        <div
          key={model.id}
          className="flex items-center justify-between p-2  hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={providerIcon} alt="Provider Icon" />
              <AvatarFallback className="text-xs">{model.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-foreground">{model.display_name}</p>
              <p className="text-xs text-muted-foreground">{model.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {model.supports_vision && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Vision
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ModelList
