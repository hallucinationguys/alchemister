'use client'

import { useRef, useState, FormEvent, useCallback } from 'react'
import { Send, StopCircle, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/lib/utils'
import { isValidMessage } from '@/features/chat/lib/chat-utils'
import { useSendMessage } from '@/features/chat/queries/useMessage'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip'
import type { StreamEvent } from '@/features/chat/types/conversation'

/**
 * Props for the MessageInput component
 *
 * @property conversationId - The ID of the conversation this input is for
 * @property onStreamEvent - Callback for handling streaming events
 * @property placeholder - Placeholder text for the input
 * @property streaming - Whether a message is currently streaming
 * @property onStopStreaming - Callback for stopping streaming
 * @property className - Additional CSS classes to apply
 * @property disabled - Whether the input is disabled
 */
interface MessageInputProps {
  conversationId: string
  onStreamEvent?: (event: StreamEvent) => void
  placeholder?: string
  streaming?: boolean
  onStopStreaming?: () => void
  className?: string
  disabled?: boolean
}

/**
 * A fixed input component for typing and sending messages
 *
 * This component provides a textarea for entering messages with the following features:
 * - Auto-resizing as the user types
 * - Submit on Enter (Shift+Enter for new line)
 * - Visual feedback during streaming
 * - Stop button during streaming
 * - Fixed positioning at the bottom of the chat
 */
const MessageInput = ({
  conversationId,
  onStreamEvent,
  placeholder = 'Type your message...',
  streaming = false,
  onStopStreaming,
  className = '',
  disabled = false,
}: MessageInputProps) => {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Use the sendMessage mutation from React Query
  const sendMessage = useSendMessage(conversationId, onStreamEvent)

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!isValidMessage(content) || streaming || sendMessage.isPending || disabled) {
        return
      }

      sendMessage.mutate({ content: content.trim() })
      setContent('')

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    },
    [content, streaming, sendMessage, disabled]
  )

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (isValidMessage(content) && !streaming && !sendMessage.isPending && !disabled) {
          sendMessage.mutate({ content: content.trim() })
          setContent('')

          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
          }
        }
      }
    },
    [content, streaming, sendMessage, disabled]
  )

  /**
   * Handle textarea input and auto-resize
   */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setContent(textarea.value)

    // Auto-resize textarea
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }, [])

  /**
   * Handle stopping the streaming response
   */
  const handleStop = useCallback(() => {
    if (onStopStreaming) {
      onStopStreaming()
    }
  }, [onStopStreaming])

  // Determine button state
  const isInputDisabled = sendMessage.isPending || streaming || disabled
  const canSubmit = isValidMessage(content) && !streaming && !sendMessage.isPending && !disabled

  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border',
        className
      )}
      aria-label="Message input area"
    >
      <div className="mx-auto max-w-4xl px-4 py-4">
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={cn(
              'relative flex items-end gap-2 p-3 rounded-2xl border border-input',
              'transition-all duration-200 focus-within:border-ring focus-within:shadow-md'
            )}
          >
            <Textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isInputDisabled}
              className={cn(
                'resize-none min-h-[40px] max-h-[150px] overflow-y-auto',
                'placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0',
                'border-0 shadow-none focus-visible:shadow-none'
              )}
              rows={1}
              aria-label="Message input"
            />

            {streaming ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    onClick={handleStop}
                    disabled={!onStopStreaming}
                    className={cn(
                      'shrink-0 size-9 rounded-full',
                      'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
                      'shadow-sm transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    aria-label="Stop generating response"
                  >
                    <StopCircle className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop generating</TooltipContent>
              </Tooltip>
            ) : sendMessage.isPending ? (
              <Button
                type="button"
                disabled
                className={cn(
                  'shrink-0 size-9 rounded-full',
                  'bg-muted text-muted-foreground',
                  'shadow-sm transition-all duration-200'
                )}
                aria-label="Sending message"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className={cn(
                      'shrink-0 size-9 rounded-full',
                      'bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground',
                      'shadow-sm transition-all duration-200 disabled:cursor-not-allowed',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    aria-label="Send message"
                  >
                    <Send className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{canSubmit ? 'Send message' : 'Type a message'}</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Character count and model info could be added here */}
          <div className="flex justify-between items-center mt-1 px-2 text-xs text-muted-foreground">
            <div>{/* Optional: Add character count here */}</div>
            <div>{/* Optional: Add model info here */}</div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MessageInput
