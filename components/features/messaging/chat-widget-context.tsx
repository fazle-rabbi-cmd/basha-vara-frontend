'use client';

import { createContext, useContext, ReactNode } from 'react';

interface ChatWidgetContextType {
  openChat: (userId: string, propertyId?: string) => void;
}

const ChatWidgetContext = createContext<ChatWidgetContextType | undefined>(undefined);

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const openChat = (userId: string, propertyId?: string) => {
    // Dispatch a custom event that the chat widget will listen to
    const event = new CustomEvent('openChatWidget', { detail: { userId, propertyId } });
    window.dispatchEvent(event);
  };

  return (
    <ChatWidgetContext.Provider value={{ openChat }}>
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  const context = useContext(ChatWidgetContext);
  if (!context) {
    throw new Error('useChatWidget must be used within ChatWidgetProvider');
  }
  return context;
}
