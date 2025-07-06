import { useRef, useActionState, startTransition, useState } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { isValidMessage } from '../../lib/chat-utils'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
  streaming?: boolean
  onStopStreaming?: () => void
  className?: string
}

const MessageInput = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  streaming = false,
  onStopStreaming,
  className = '',
}: MessageInputProps) => {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sendMessageAction = async (
    prevState: { success?: boolean; error?: string },
    formData: FormData
  ) => {
    const messageContent = formData.get('content') as string

    if (!isValidMessage(messageContent) || disabled || streaming) {
      return { success: false, error: 'Invalid message' }
    }

    try {
      onSendMessage(messageContent.trim())
      setContent('')

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to send message' }
    }
  }

  const [state, formAction] = useActionState(sendMessageAction, { success: false })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isValidMessage(content) && !disabled && !streaming) {
        startTransition(() => {
          const formData = new FormData()
          formData.append('content', content)
          formAction(formData)
        })
      }
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setContent(textarea.value)

    // Auto-resize textarea
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }

  const handleStop = () => {
    if (onStopStreaming) {
      onStopStreaming()
    }
  }

  return (
    <div className={`${className} sticky bottom-0 z-1000 bg-background`}>
      <div className="mx-auto max-w-4xl px-4 py-4">
        <form action={formAction} className="relative">
          <div className="relative flex items-end gap-2 p-3 rounded-2xl shadow-sm transition-all duration-200 focus-within:border-ring focus-within:shadow-md">
            <Textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="resize-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />

            {streaming ? (
              <Button
                type="button"
                onClick={handleStop}
                disabled={!onStopStreaming}
                className="shrink-0 size-9 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm transition-all duration-200"
              >
                <StopCircle className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={disabled || !isValidMessage(content)}
                className="shrink-0 size-9 rounded-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground shadow-sm transition-all duration-200 disabled:cursor-not-allowed"
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default MessageInput
