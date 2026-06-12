'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import GlobalChatSheet from '@/components/dashboard/global-chat-sheet'

interface ChatContextValue {
  openChat: () => void
  closeChat: () => void
  isOpen: boolean
}

const ChatContext = createContext<ChatContextValue>({
  openChat: () => {},
  closeChat: () => {},
  isOpen: false,
})

export function useChat() {
  return useContext(ChatContext)
}

function getChatContext(pathname: string) {
  if (pathname.includes('/exercises') || pathname.includes('/cbt')) {
    return { page: 'cbt' }
  }
  if (pathname.includes('/goals')) {
    return { page: 'goals' }
  }
  if (pathname.includes('/insights')) {
    return { page: 'insights' }
  }
  if (pathname.includes('/archive')) {
    return { page: 'archive' }
  }
  return { page: 'dashboard' }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false)
  const pathname = usePathname()

  const openChat = useCallback(() => setChatOpen(true), [])
  const closeChat = useCallback(() => setChatOpen(false), [])

  return (
    <ChatContext.Provider value={{ openChat, closeChat, isOpen: chatOpen }}>
      {children}
      <GlobalChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        context={getChatContext(pathname)}
      />
    </ChatContext.Provider>
  )
}
