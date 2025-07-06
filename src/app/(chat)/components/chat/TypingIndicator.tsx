interface TypingIndicatorProps {
  className?: string
  content?: string
}

const TypingIndicator = ({ className, content }: TypingIndicatorProps) => {
  return (
    <div className={`group flex py-4 ${className || ''}`}>
      {/* Typing bubble - full width */}
      <div className="flex flex-col gap-2 min-w-0 w-full">
        <div className="relative rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] bg-card border border-border shadow-sm text-card-foreground">
          {content ? (
            // Show streaming content with cursor
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {content}
              <span className="inline-block w-0.5 h-5 ml-1 bg-primary animate-pulse" />
            </div>
          ) : (
            // Show typing dots when no content yet
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
              <div className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
              <div className="size-2 rounded-full bg-muted-foreground animate-bounce" />
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>AI is typing...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
