'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { cn } from '@/shared/lib/utils'
import ModelSelector from './ModelSelector'

/**
 * Props for the ChatHeader component
 *
 * @property title - The title to display in the header
 * @property loading - Whether the header is in a loading state
 * @property showBackButton - Whether to show the back button
 * @property showModelSelector - Whether to show the model selector
 * @property disabled - Whether the header controls are disabled
 * @property className - Additional CSS classes to apply
 */
interface ChatHeaderProps {
  title?: string
  loading?: boolean
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
  showBackButton = false,
  showModelSelector = false,
  disabled = false,
  className = '',
}: ChatHeaderProps) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between px-6',
        'bg-background/80 backdrop-blur-sm',
        className
      )}
      role="banner"
      aria-label="Chat header"
    >
      {/* Left side - Navigation */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        <div className="flex items-center ">
          {loading ? (
            <div className="flex items-center ">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-lg font-medium text-muted-foreground">Loading...</h1>
            </div>
          ) : (
            <h1 className="text-lg font-medium text-foreground truncate">{title}</h1>
          )}
        </div>
      </div>

      {/* Right side - Model Selector */}
      {showModelSelector && (
        <div className="flex items-center">
          <ModelSelector disabled={disabled} className="min-w-[180px]" />
        </div>
      )}
    </header>
  )
}

export default ChatHeader
