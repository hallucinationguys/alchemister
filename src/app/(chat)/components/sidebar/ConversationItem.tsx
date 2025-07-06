import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { SidebarMenuButton, SidebarMenuAction, SidebarMenuItem } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ConversationSummaryResponse } from '../../types/conversation'

interface ConversationItemProps {
  conversation: ConversationSummaryResponse
  isActive?: boolean
  onClick: (conversation: ConversationSummaryResponse) => void
  onEdit?: (conversation: ConversationSummaryResponse) => void
  onDelete?: (conversation: ConversationSummaryResponse) => void
  className?: string
}

const ConversationItem = ({
  conversation,
  isActive = false,
  onClick,
  onEdit,
  onDelete,
  className = '',
}: ConversationItemProps) => {
  const handleClick = () => {
    onClick(conversation)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit?.(conversation)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(conversation)
  }

  return (
    <SidebarMenuItem className={className}>
      <SidebarMenuButton onClick={handleClick} isActive={isActive} className="group">
        <span className="truncate">{conversation.title}</span>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction>
            <MoreHorizontal className="size-4" />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          {onEdit && (
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="size-4 mr-2" />
              <span>Edit Title</span>
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem onClick={handleDelete}>
              <Trash2 className="size-4 mr-2" />
              <span>Delete Conversation</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export default ConversationItem
