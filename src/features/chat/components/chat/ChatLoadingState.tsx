'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ChatLoadingStateProps {
  className?: string
  message?: string
}

/**
 * Simple loading state component shown while messages are being fetched.
 * Clean, minimal design with just a spinner and text.
 */
const ChatLoadingState = ({
  className = '',
  message = 'Loading conversation...',
}: ChatLoadingStateProps) => {
  return (
    <div
      className={cn('flex flex-1 items-center justify-center min-h-[calc(100vh-200px)]', className)}
    >
      <div className="text-center space-y-3">
        {/* Simple Spinner */}
        <Loader2 className="size-6 text-muted-foreground animate-spin mx-auto" />

        {/* Loading Text */}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export default ChatLoadingState
