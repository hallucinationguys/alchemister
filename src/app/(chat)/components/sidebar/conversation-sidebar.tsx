'use client'

import { AlertCircle } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ConversationList from './conversation-list'
import NewChatButton from './new-chat-button'
import { Settings } from 'lucide-react'
import type { ConversationSummaryResponse } from '../../types/conversation'
import { useRouter } from 'next/navigation'

interface ConversationSidebarProps {
  conversations: ConversationSummaryResponse[]
  currentConversationId?: string
  loading?: boolean
  hasMore?: boolean
  isCreating?: boolean
  onConversationSelect: (conversation: ConversationSummaryResponse) => void
  onNewConversation: () => void
  onEditConversation?: (conversation: ConversationSummaryResponse) => void
  onDeleteConversation?: (conversation: ConversationSummaryResponse) => void
  onLoadMore?: () => void
  onRetry?: () => void
  className?: string
}

const ConversationSidebar = ({
  conversations,
  currentConversationId,
  loading = false,
  hasMore = false,
  isCreating = false,
  onConversationSelect,
  onNewConversation,
  onEditConversation,
  onDeleteConversation,
  onLoadMore,
  onRetry,
  className = '',
}: ConversationSidebarProps) => {
  const router = useRouter()

  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas" className={className}>
      <SidebarHeader>
        <h2 className="text-lg font-semibold">Trading Alchemist</h2>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-2 w-full">
          <NewChatButton onClick={onNewConversation} loading={isCreating} className="w-full" />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              loading={loading}
              hasMore={hasMore}
              onConversationClick={onConversationSelect}
              onEditConversation={onEditConversation}
              onDeleteConversation={onDeleteConversation}
              onLoadMore={onLoadMore}
              onNewConversation={onNewConversation}
              isCreating={isCreating}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/settings/profile')}
        >
          <Settings className="size-4" />
          <span>Settings</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export default ConversationSidebar
