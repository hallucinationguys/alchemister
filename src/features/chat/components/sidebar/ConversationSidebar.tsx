'use client'

import { AlertCircle, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from '@/shared/ui/sidebar'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import ConversationList from './ConversationList'
import NewChatButton from './NewChatButton'
import { useRouter } from 'next/navigation'
import {
  useInfiniteConversations,
  useCreateConversation,
} from '@/features/chat/queries/useConversation'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { ConversationSummaryResponse } from '@/features/chat/types/conversation'

interface ConversationSidebarProps {
  currentConversationId?: string
  onConversationSelect: (conversation: ConversationSummaryResponse) => void
  className?: string
}

/**
 * Sidebar component for displaying and managing conversations.
 * Provides navigation between conversations and creation of new conversations.
 */
const ConversationSidebar = ({
  currentConversationId,
  onConversationSelect,
  className = '',
}: ConversationSidebarProps) => {
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const [isCreating, setIsCreating] = useState(false)

  // Fetch conversations with infinite scrolling
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteConversations({
      sortBy: 'updated_at',
      sortOrder: 'desc',
      isActive: true,
      limit: 20,
    })

  // Create conversation mutation
  const createConversation = useCreateConversation()

  // Flatten the pages of conversations into a single array
  const conversations = data?.pages.flat() || []

  // Handle creating a new conversation
  const handleNewConversation = useCallback(async () => {
    if (isCreating) return

    setIsCreating(true)

    try {
      const newConversation = await createConversation.mutateAsync({
        title: 'New Conversation',
      })

      // Navigate to the new conversation
      if (newConversation) {
        onConversationSelect(newConversation)

        // Close mobile sidebar after selection on mobile
        if (isMobile) {
          setOpenMobile(false)
        }
      }
    } catch (error) {
      toast.error('Failed to create conversation', {
        description: 'Please try again later.',
      })
    } finally {
      setIsCreating(false)
    }
  }, [createConversation, onConversationSelect, isCreating, isMobile, setOpenMobile])

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    (conversation: ConversationSummaryResponse) => {
      onConversationSelect(conversation)

      // Close mobile sidebar after selection on mobile
      if (isMobile) {
        setOpenMobile(false)
      }
    },
    [onConversationSelect, isMobile, setOpenMobile]
  )

  // Handle loading more conversations
  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, isFetchingNextPage, hasNextPage])

  // Handle retry loading conversations
  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  // Handle settings navigation
  const handleSettingsClick = useCallback(() => {
    router.push('/settings/profile')
  }, [router])

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      className={className}
      data-testid="conversation-sidebar"
    >
      <SidebarHeader>
        <h2 className="text-lg font-semibold">AI Assistant</h2>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-2 w-full">
          <NewChatButton
            onClick={handleNewConversation}
            loading={isCreating || createConversation.isPending}
            className="w-full"
            aria-label="Create new conversation"
          />
        </div>

        {isError && (
          <Alert variant="destructive" className="mx-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load conversations</span>
              <Button
                variant="link"
                className="p-0 h-auto text-sm underline ml-2"
                onClick={handleRetry}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              loading={isLoading}
              hasMore={!!hasNextPage}
              onConversationClick={handleConversationSelect}
              onLoadMore={handleLoadMore}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="outline"
          className="w-full h-9 text-sidebar-foreground border-border"
          onClick={handleSettingsClick}
          aria-label="Settings"
        >
          <Settings className="size-4 mr-2" />
          <span>Settings</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export default ConversationSidebar
