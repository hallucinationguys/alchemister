import { useRef, useState, FormEvent } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { isValidMessage } from '@/features/chat/lib/chat-utils'

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValidMessage(content) || disabled || streaming) {
      return
    }
    onSendMessage(content.trim())
    setContent('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isValidMessage(content) && !disabled && !streaming) {
        onSendMessage(content.trim())
        setContent('')
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
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
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-2 p-3 rounded-2xl shadow-sm transition-all duration-200 focus-within:border-ring focus-within:shadow-md">
            <Textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || streaming}
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
