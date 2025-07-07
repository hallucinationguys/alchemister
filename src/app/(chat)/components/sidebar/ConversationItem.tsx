import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { SidebarMenuButton, SidebarMenuAction, SidebarMenuItem } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useId } from 'react'
import { toast } from 'sonner'
import { useChatHistory } from '@/chat/hooks/use-chat-history'
import type { ConversationSummaryResponse } from '@/chat/types/conversation'

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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const titleInputId = useId()
  const { updateConversationTitle, deleteConversation } = useChatHistory({ autoFetch: false })

  const handleClick = () => {
    onClick(conversation)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditTitle(conversation.title)
    setShowEditDialog(true)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleTitleUpdate = async () => {
    if (!editTitle.trim() || editTitle.trim() === conversation.title) {
      setShowEditDialog(false)
      return
    }

    setIsUpdating(true)
    try {
      await updateConversationTitle(conversation.id, editTitle.trim())
      toast.success('Title updated successfully')
      setShowEditDialog(false)
      onEdit?.(conversation)
    } catch (error) {
      console.error('Failed to update title:', error)
      toast.error('Failed to update title', {
        description: 'Please try again later.',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteConversation(conversation.id)
      toast.success('Conversation deleted successfully')
      setShowDeleteDialog(false)
      onDelete?.(conversation)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation', {
        description: 'Please try again later.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleUpdate()
    }
  }

  return (
    <>
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
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="size-4 mr-2" />
              <span>Edit Title</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>
              <Trash2 className="size-4 mr-2" />
              <span>Delete Conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Edit Title Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Conversation Title</DialogTitle>
            <DialogDescription>Enter a new title for this conversation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={titleInputId} className="text-right">
                Title
              </Label>
              <Input
                id={titleInputId}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="col-span-3"
                placeholder="Enter conversation title..."
                disabled={isUpdating}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTitleUpdate}
              disabled={isUpdating || !editTitle.trim()}
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{conversation.title}&quot;? This action cannot
              be undone and will permanently remove all messages in this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Conversation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ConversationItem
