import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface NewChatButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

const NewChatButton = ({
  onClick,
  loading = false,
  disabled = false,
  className = '',
}: NewChatButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={loading || disabled}
      className={`${className}`}
    >
      {loading ? (
        <div className="flex items-start gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <Plus className="size-4" />
          <span>New Chat</span>
        </div>
      )}
    </Button>
  )
}

export default NewChatButton
