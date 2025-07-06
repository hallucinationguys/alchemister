import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import ModelSelector from './ModelSelector'
import type { AvailableModel } from '../../hooks/use-available-models'

interface ChatHeaderProps {
  title?: string
  loading?: boolean
  onBackClick?: () => void
  showBackButton?: boolean
  showModelSelector?: boolean
  selectedModelId?: string
  onModelChange?: (model: AvailableModel) => void
  disabled?: boolean
  className?: string
}

const ChatHeader = ({
  title = 'Chat',
  loading = false,
  onBackClick,
  showBackButton = false,
  showModelSelector = false,
  selectedModelId,
  onModelChange,
  disabled = false,
  className = '',
}: ChatHeaderProps) => {
  return (
    <header
      className={` sticky top-0 z-1000 flex h-16 shrink-0 items-center justify-between px-4 ${className}`}
    >
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-lg font-semibold text-muted-foreground">Loading...</h1>
            </div>
          ) : (
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          )}
        </div>
      </div>

      {/* Right side - Model Selector */}
      {showModelSelector && onModelChange && (
        <div className="flex items-center gap-4">
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
            disabled={disabled}
            className="min-w-[200px]"
          />
        </div>
      )}
    </header>
  )
}

export default ChatHeader
