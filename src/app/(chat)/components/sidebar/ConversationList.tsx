import { MessageSquare, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import ConversationItem from './ConversationItem'
import type { ConversationSummaryResponse } from '@/chat/types/conversation'

interface ConversationListProps {
  conversations: ConversationSummaryResponse[]
  currentConversationId?: string
  loading?: boolean
  hasMore?: boolean
  onConversationClick: (conversation: ConversationSummaryResponse) => void
  onEditConversation?: (conversation: ConversationSummaryResponse) => void
  onDeleteConversation?: (conversation: ConversationSummaryResponse) => void
  onLoadMore?: () => void
  onNewConversation?: () => void
  isCreating?: boolean
  className?: string
}

const ConversationList = ({
  conversations,
  currentConversationId,
  loading = false,
  hasMore = false,
  onConversationClick,
  onEditConversation,
  onDeleteConversation,
  onLoadMore,
  onNewConversation,
  isCreating = false,
  className = '',
}: ConversationListProps) => {
  if (loading && conversations.length === 0) {
    return (
      <SidebarMenu className={className}>
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <p className="text-sm text-muted-foreground mb-2">No conversations yet</p>
      </div>
    )
  }

  return (
    <SidebarMenu className={className}>
      {conversations.map(conversation => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === currentConversationId}
          onClick={onConversationClick}
          onEdit={onEditConversation}
          onDelete={onDeleteConversation}
        />
      ))}

      {/* Load more button */}
      {hasMore && onLoadMore && (
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={onLoadMore}
            disabled={loading}
            className="text-center justify-center text-muted-foreground hover:text-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  )
}

export default ConversationList
