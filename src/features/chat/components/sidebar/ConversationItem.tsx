'use client'

import { MoreHorizontal, Edit, Trash2, MessageSquare } from 'lucide-react'
import { SidebarMenuButton, SidebarMenuAction, SidebarMenuItem } from '@/shared/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useState, useId, useCallback } from 'react'
import { toast } from 'sonner'
import { formatConversationDate } from '@/features/chat/lib/chat-utils'
import {
  useUpdateConversationTitle,
  useDeleteConversation,
} from '@/features/chat/queries/useConversation'
import type { ConversationSummaryResponse } from '@/features/chat/types/conversation'

interface ConversationItemProps {
  conversation: ConversationSummaryResponse
  isActive?: boolean
  onClick: (conversation: ConversationSummaryResponse) => void
  className?: string
  role?: string
}

/**
 * Component for displaying a single conversation item in the sidebar.
 * Provides options to edit the title and delete the conversation.
 */
const ConversationItem = ({
  conversation,
  isActive = false,
  onClick,
  className = '',
  role,
}: ConversationItemProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)

  const titleInputId = useId()

  // React Query mutations
  const updateTitle = useUpdateConversationTitle()
  const deleteConversation = useDeleteConversation()

  // Format the last message date
  const formattedDate = conversation.last_message_at
    ? formatConversationDate(conversation.last_message_at)
    : formatConversationDate(conversation.id) // Fallback to conversation ID (which often contains a timestamp)

  const handleClick = useCallback(() => {
    onClick(conversation)
  }, [onClick, conversation])

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setEditTitle(conversation.title)
      setShowEditDialog(true)
    },
    [conversation.title]
  )

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }, [])

  const handleTitleUpdate = useCallback(async () => {
    if (!editTitle || !editTitle.trim() || editTitle.trim() === conversation.title) {
      setShowEditDialog(false)
      return
    }

    try {
      await updateTitle.mutateAsync({
        id: conversation.id,
        title: editTitle.trim(),
      })

      toast.success('Title updated successfully')
      setShowEditDialog(false)
    } catch (error) {
      console.error('Failed to update title:', error)
      toast.error('Failed to update title', {
        description: 'Please try again later.',
      })
    }
  }, [editTitle, conversation.title, conversation.id, updateTitle])

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteConversation.mutateAsync(conversation.id)
      toast.success('Conversation deleted successfully')
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation', {
        description: 'Please try again later.',
      })
    }
  }, [conversation.id, deleteConversation])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleTitleUpdate()
      }
    },
    [handleTitleUpdate]
  )

  return (
    <>
      <SidebarMenuItem className={className} role={role}>
        <SidebarMenuButton
          onClick={handleClick}
          isActive={isActive}
          className="group relative"
          aria-label={`Conversation: ${conversation.title}`}
          aria-current={isActive ? 'page' : undefined}
        >
          <MessageSquare className="size-4 shrink-0 mr-2 text-muted-foreground group-hover:text-foreground" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate font-medium">{conversation.title}</span>
            <span className="text-xs text-muted-foreground truncate">{formattedDate}</span>
          </div>
        </SidebarMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover aria-label="Conversation options">
              <MoreHorizontal className="size-4" />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="size-4 mr-2" />
              <span>Edit Title</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
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
                disabled={updateTitle.isPending}
                autoFocus
                maxLength={100}
                aria-label="Conversation title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={updateTitle.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTitleUpdate}
              disabled={updateTitle.isPending || !editTitle.trim()}
            >
              {updateTitle.isPending ? 'Updating...' : 'Save Changes'}
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
            <AlertDialogCancel disabled={deleteConversation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteConversation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteConversation.isPending ? 'Deleting...' : 'Delete Conversation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ConversationItem
