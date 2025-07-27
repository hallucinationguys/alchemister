'use client'

import { useRef, useState } from 'react'
import { Send, StopCircle, Loader2, Plus } from 'lucide-react'
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
   * Handle form submission using React 19 form actions
   */
  async function handleSubmit(formData: FormData) {
    const content = formData.get('content') as string

    if (!isValidMessage(content) || streaming || sendMessage.isPending || disabled) {
      return
    }

    sendMessage.mutate({ content: content.trim() })
    setContent('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
  }

  /**
   * Handle textarea input and auto-resize
   */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setContent(textarea.value)

    // Auto-resize textarea
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }

  /**
   * Handle stopping the streaming response
   */
  const handleStop = () => {
    if (onStopStreaming) {
      onStopStreaming()
    }
  }

  // Determine button state
  const isInputDisabled = sendMessage.isPending || streaming || disabled
  const canSubmit = isValidMessage(content) && !streaming && !sendMessage.isPending && !disabled

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-30 bg-background/80 backdrop-blur-sm',
        'left-0 md:left-[var(--sidebar-width,0px)]',
        'transition-[left] duration-200 ease-linear',
        className
      )}
      aria-label="Message input area"
    >
      <div className="mx-auto max-w-4xl px-6 py-6">
        <form action={handleSubmit} className="relative">
          <div
            className={cn(
              'relative flex items-center gap-3 px-4 py-3 rounded-3xl bg-transparent border border-border/30',
              'focus-within:border-border focus-within:shadow-sm',
              'hover:border-border/50'
            )}
          >
            {/* Add/Plus button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isInputDisabled}
                  className={cn(
                    'shrink-0 size-8 rounded-full p-0',
                    'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                    'transition-all duration-200'
                  )}
                  aria-label="Add content"
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add content</TooltipContent>
            </Tooltip>

            <Textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isInputDisabled}
              background="transparent"
              className={cn(
                'flex-1 resize-none min-h-[24px] max-h-[120px] overflow-y-auto',
                'placeholder:text-muted-foreground/60 text-foreground',
                'focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none focus-visible:shadow-none',
                'text-base leading-6 py-0'
              )}
              rows={1}
              aria-label="Message input"
            />

            {/* Right side buttons */}
            <div className="flex items-center gap-1">
              {/* Send/Stop button */}
              {streaming ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={handleStop}
                      disabled={!onStopStreaming}
                      className={cn(
                        'shrink-0 size-8 rounded-full p-0',
                        'bg-foreground hover:bg-foreground/90 text-background',
                        'transition-all duration-200'
                      )}
                      aria-label="Stop generating response"
                    >
                      <StopCircle className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generating</TooltipContent>
                </Tooltip>
              ) : sendMessage.isPending ? (
                <Button
                  type="button"
                  disabled
                  className={cn(
                    'shrink-0 size-8 rounded-full p-0',
                    'bg-muted text-muted-foreground',
                    'transition-all duration-200'
                  )}
                  aria-label="Sending message"
                >
                  <Loader2 className="size-4 animate-spin" />
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className={cn(
                        'shrink-0 size-8 rounded-full p-0',
                        canSubmit
                          ? 'bg-foreground hover:bg-foreground/90 text-background'
                          : 'bg-muted text-muted-foreground cursor-not-allowed',
                        'transition-all duration-200'
                      )}
                      aria-label="Send message"
                    >
                      <Send className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{canSubmit ? 'Send message' : 'Type a message'}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MessageInput
