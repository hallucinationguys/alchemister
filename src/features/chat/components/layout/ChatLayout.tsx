import { SidebarProvider } from '@/shared/ui/sidebar'
import ConversationSidebar from '@/features/chat/components/sidebar/ConversationSidebar'
import type { ConversationSummaryResponse } from '@/features/chat/types/conversation'

interface ChatLayoutProps {
  // Sidebar props
  conversations: ConversationSummaryResponse[]
  currentConversationId?: string
  sidebarLoading?: boolean
  hasMore?: boolean
  isCreating?: boolean
  onConversationSelect: (conversation: ConversationSummaryResponse) => void
  onNewConversation: () => void
  onEditConversation?: (conversation: ConversationSummaryResponse) => void
  onDeleteConversation?: (conversation: ConversationSummaryResponse) => void
  onLoadMore?: () => void
  onSidebarRetry?: () => void

  // Layout props
  children: React.ReactNode
  defaultSidebarOpen?: boolean
  className?: string
}

const ChatLayout = ({
  conversations,
  currentConversationId,
  sidebarLoading = false,
  hasMore = false,
  isCreating = false,
  onConversationSelect,
  onNewConversation,
  onEditConversation,
  onDeleteConversation,
  onLoadMore,
  onSidebarRetry,
  children,
  defaultSidebarOpen = true,
  className = '',
}: ChatLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className={`flex h-screen w-full ${className}`}>
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          loading={sidebarLoading}
          hasMore={hasMore}
          isCreating={isCreating}
          onConversationSelect={onConversationSelect}
          onNewConversation={onNewConversation}
          onEditConversation={onEditConversation}
          onDeleteConversation={onDeleteConversation}
          onLoadMore={onLoadMore}
          onRetry={onSidebarRetry}
        />
        {children}
      </div>
    </SidebarProvider>
  )
}

export default ChatLayout
