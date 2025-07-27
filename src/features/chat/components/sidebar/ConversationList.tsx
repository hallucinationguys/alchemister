'use client'

import { Loader2 } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuButton,
} from '@/shared/ui/sidebar'
import ConversationItem from './ConversationItem'
import { useEffect, useRef, useCallback } from 'react'
import type { ConversationSummaryResponse } from '@/features/chat/types/conversation'

interface ConversationListProps {
  conversations: ConversationSummaryResponse[]
  currentConversationId?: string
  loading?: boolean
  hasMore?: boolean
  onConversationClick: (conversation: ConversationSummaryResponse) => void
  onLoadMore?: () => void
  className?: string
}

/**
 * Component for displaying a list of conversations with infinite scrolling.
 */
const ConversationList = ({
  conversations,
  currentConversationId,
  loading = false,
  hasMore = false,
  onConversationClick,
  onLoadMore,
  className = '',
}: ConversationListProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Setup intersection observer for infinite scrolling
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading && onLoadMore) {
          onLoadMore()
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
  }, [hasMore, loading, onLoadMore])

  // Setup observer when dependencies change
  useEffect(() => {
    setupObserver()

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [setupObserver])

  // Show loading skeletons when initially loading
  if (loading && conversations.length === 0) {
    return (
      <SidebarMenu className={className} aria-busy="true" aria-label="Loading conversations">
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  // Show empty state when no conversations
  if (conversations.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 text-center ${className}`}
        aria-label="No conversations"
      >
        <p className="text-sm text-muted-foreground mb-2">No conversations yet</p>
        <p className="text-xs text-muted-foreground">Start a new chat to begin</p>
      </div>
    )
  }

  return (
    <SidebarMenu className={className} aria-label="Conversation list" role="list">
      {conversations.map(conversation => {
        // Ensure conversation has an id to use as key
        if (!conversation || !conversation.id) {
          console.warn('Conversation missing ID:', conversation)
          return null
        }

        return (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === currentConversationId}
            onClick={onConversationClick}
            role="listitem"
          />
        )
      })}

      {/* Infinite scroll trigger element */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-2 flex justify-center" aria-hidden="true">
          {loading && (
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin mr-2" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}

      {/* Manual load more button as fallback */}
      {hasMore && onLoadMore && !loading && (
        <SidebarMenuItem key="load-more">
          <SidebarMenuButton
            onClick={onLoadMore}
            disabled={loading}
            className="text-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Load more conversations"
          >
            Load more
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  )
}

export default ConversationList
