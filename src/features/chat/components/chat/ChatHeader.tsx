'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import ModelSelector from './ModelSelector'

/**
 * Props for the ChatHeader component
 *
 * @property title - The title to display in the header
 * @property loading - Whether the header is in a loading state
 * @property onBackClick - Callback for when the back button is clicked
 * @property showBackButton - Whether to show the back button
 * @property showModelSelector - Whether to show the model selector
 * @property disabled - Whether the header controls are disabled
 * @property className - Additional CSS classes to apply
 */
interface ChatHeaderProps {
  title?: string
  loading?: boolean
  onBackClick?: () => void
  showBackButton?: boolean
  showModelSelector?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Header component for the chat area.
 *
 * This component provides:
 * - A fixed header at the top of the chat area
 * - A title for the current conversation
 * - A sidebar toggle button
 * - An optional back button for navigation
 * - An optional model selector for changing the AI model
 * - Loading state visualization
 */
const ChatHeader = ({
  title = 'Chat',
  loading = false,
  onBackClick,
  showBackButton = false,
  showModelSelector = false,
  disabled = false,
  className = '',
}: ChatHeaderProps) => {
  return (
    <header
      className={`sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between px-4 backdrop-blur bg-background/70 ${className}`}
      role="banner"
      aria-label="Chat header"
    >
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />

        {showBackButton && onBackClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            aria-label="Go back"
            className="mr-1"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

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
      {showModelSelector && (
        <div className="flex items-center gap-4">
          <ModelSelector disabled={disabled} className="min-w-[200px]" />
        </div>
      )}
    </header>
  )
}

export default ChatHeader
