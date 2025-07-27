'use client'

import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

interface NewChatButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Button component for creating a new chat conversation.
 * Provides loading state and accessibility features.
 */
const NewChatButton = ({
  onClick,
  loading = false,
  disabled = false,
  className = '',
}: NewChatButtonProps) => {
  return (
    <Button
      variant="default"
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        'w-full bg-primary text-primary-foreground font-medium',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'shadow-sm',
        loading && 'opacity-70 cursor-not-allowed',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label="Create new chat"
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 w-full">
          <Loader2 className="size-4 animate-spin" />
          <span>Creating...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 w-full">
          <Plus className="size-5 shrink-0" />
          <span className="font-medium">New Chat</span>
        </div>
      )}
    </Button>
  )
}

export default NewChatButton
