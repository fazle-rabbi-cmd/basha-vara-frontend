'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { webSocketService } from '@/lib/websocket';
import { ChatList } from './chat-list';
import { ChatThread } from './chat-thread';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  property?: {
    id: string;
    title: string;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export function ChatWidget() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isConnected } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Fetch conversations and unread count
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversations = async () => {
      try {
        const data = await apiClient.messages.getConversations();
        setConversations(data || []);
        const unread = data?.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0) || 0;
        setTotalUnread(unread);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      }
    };

    fetchConversations();

    // Listen for new messages via WebSocket
    const handleNewMessage = (data: any) => {
      if (data.senderId === user.id || data.receiverId === user.id) {
        fetchConversations();
      }
    };

    webSocketService.onNewMessage(handleNewMessage);

    return () => {
      webSocketService.offNewMessage(handleNewMessage);
    };
  }, [user?.id]);

  // Listen for custom event to open chat with specific user
  useEffect(() => {
    const handleOpenChatWidget = async (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string; propertyId?: string }>;
      const { userId, propertyId } = customEvent.detail;
      setIsOpen(true);
      setIsMinimized(false);

      // Try to find existing conversation
      const conversation = conversations.find(c => c.userId === userId);
      if (conversation) {
        setSelectedConversation(conversation);
      } else {
        // If not found, refresh conversations and try again
        try {
          const data = await apiClient.messages.getConversations();
          setConversations(data || []);
          const newConversation = data?.find((c: any) => c.userId === userId);
          if (newConversation) {
            setSelectedConversation(newConversation);
          }
        } catch (error) {
          console.error('Failed to fetch conversations', error);
        }
      }
    };

    window.addEventListener('openChatWidget', handleOpenChatWidget);

    return () => {
      window.removeEventListener('openChatWidget', handleOpenChatWidget);
    };
  }, [conversations]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user?.id) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.messages.getMessages(
          selectedConversation.userId,
          selectedConversation.property?.id
        );
        setMessages(data || []);

        // Mark conversation as read
        await apiClient.messages.markConversationAsRead(selectedConversation.userId);

        // Update unread count
        setConversations((prev) =>
          prev.map((conv) =>
            conv.userId === selectedConversation.userId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
        setTotalUnread((prev) => Math.max(0, prev - selectedConversation.unreadCount));
      } catch (error) {
        showToast('error', 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, user?.id]);

  // Listen for new messages in selected conversation
  useEffect(() => {
    if (!user?.id || !selectedConversation) return;

    const handleNewMessage = (data: any) => {
      const isThisConversation =
        (data.senderId === user.id && data.receiverId === selectedConversation.userId) ||
        (data.senderId === selectedConversation.userId && data.receiverId === user.id);
      if (isThisConversation) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.id) ? prev : [...prev, data]
        );
      }
    };

    webSocketService.onNewMessage(handleNewMessage);

    return () => {
      webSocketService.offNewMessage(handleNewMessage);
    };
  }, [user?.id, selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id || !selectedConversation) return;

    setIsSending(true);
    try {
      if (isConnected) {
        webSocketService.sendMessage({
          senderId: user.id,
          receiverId: selectedConversation.userId,
          content: newMessage.trim(),
          messageType: 'TEXT',
          propertyId: selectedConversation.property?.id,
        });
      } else {
        await apiClient.messages.send({
          receiverId: selectedConversation.userId,
          content: newMessage.trim(),
          messageType: 'TEXT',
          propertyId: selectedConversation.property?.id,
        });
        const data = await apiClient.messages.getMessages(
          selectedConversation.userId,
          selectedConversation.property?.id
        );
        setMessages(data || []);
      }
      setNewMessage('');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setSelectedConversation(null);
  };

  const handleMinimize = () => setIsMinimized(true);
  const handleExpand = () => setIsMinimized(false);

  if (!user) return null;

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[100] md:bottom-8 md:right-8">
          <Button
            onClick={handleOpenChat}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg relative bg-primary hover:bg-primary/90"
          >
            <MessageSquare className="h-6 w-6" />
            {totalUnread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs bg-red-500 hover:bg-red-600">
                {totalUnread > 9 ? '9+' : totalUnread}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          ref={widgetRef}
          className={`fixed z-[100] flex flex-col bg-background border border-border shadow-2xl overflow-hidden transition-all duration-300 ${
            isMinimized
              ? 'w-80 h-16 bottom-6 right-6 md:bottom-8 md:right-8 rounded-lg'
              : 'inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[min(600px,calc(100dvh-3rem))] md:rounded-lg'
          }`}
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold text-base md:text-lg">Messages</span>
              {isConnected && (
                <div className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isMinimized ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExpand}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMinimize}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 hidden md:flex"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseChat}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 min-h-0 flex flex-col">
              {selectedConversation ? (
                <ChatThread
                  messages={messages}
                  currentUserId={user.id}
                  selectedUser={selectedConversation.user}
                  property={selectedConversation.property}
                  onBack={() => setSelectedConversation(null)}
                  newMessage={newMessage}
                  onNewMessageChange={setNewMessage}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                  isConnected={isConnected}
                />
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto p-3">
                  <ChatList
                    conversations={conversations}
                    currentUserId={user.id}
                    onSelectConversation={setSelectedConversation}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}