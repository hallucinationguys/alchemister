'use client'

import { useEffect } from 'react'
import { SidebarProvider, useSidebar } from '@/shared/ui/sidebar'
import ConversationSidebar from '@/features/chat/components/sidebar/ConversationSidebar'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import type { ConversationSummaryResponse } from '@/features/chat/types/conversation'

interface ChatLayoutProps {
  // Sidebar props
  currentConversationId?: string
  onConversationSelect: (conversation: ConversationSummaryResponse) => void

  // Layout props
  children: React.ReactNode
  defaultSidebarOpen?: boolean
  className?: string
}

/**
 * The main layout component for the chat interface.
 * Provides the overall structure with a sidebar and main content area.
 * Optimized for ChatGPT-like scrolling experience.
 */
const ChatLayout = ({
  currentConversationId,
  onConversationSelect,
  children,
  defaultSidebarOpen = true,
  className = '',
}: ChatLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="flex h-screen w-full bg-background" data-testid="chat-layout">
        {/* Sidebar */}
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onConversationSelect={onConversationSelect}
        />

        {/* Main Content Area with Responsive Handling */}
        <ChatLayoutContent>{children}</ChatLayoutContent>
      </div>
    </SidebarProvider>
  )
}

/**
 * Content area component that handles responsive behavior
 * Provides proper height and overflow management for scrolling
 */
const ChatLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()

  // Close mobile sidebar when content is clicked/tapped
  const handleContentClick = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false)
    }
  }

  // Add keyboard accessibility - close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && openMobile) {
        setOpenMobile(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, openMobile, setOpenMobile])

  return (
    <div
      className="flex flex-1 flex-col h-screen relative"
      onClick={handleContentClick}
      role="main"
      aria-label="Chat content area"
    >
      {children}
    </div>
  )
}

export default ChatLayout
