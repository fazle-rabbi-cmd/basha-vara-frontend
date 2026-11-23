'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { formatDate } from '@/lib/utils';
import { useWebSocket } from '@/hooks/use-websocket';
import { webSocketService } from '@/lib/websocket';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId?: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    email: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
  };
  property?: {
    id: string;
    title: string;
  };
}

interface MessageThreadProps {
  userId: string;
  propertyId?: string;
  onClose?: () => void;
}

export function MessageThread({ userId, propertyId, onClose }: MessageThreadProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.messages.getMessages(userId, propertyId);
      setMessages(data || []);

      // Mark conversation as read
      await apiClient.messages.markConversationAsRead(userId);
    } catch (error) {
      showToast('error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && userId) {
      fetchMessages();

      // Listen for new messages via WebSocket
      const handleNewMessage = (data: any) => {
        const isThisConversation =
          (data.senderId === user.id && data.receiverId === userId) ||
          (data.senderId === userId && data.receiverId === user.id);
        if (isThisConversation) {
          setMessages((prev) =>
            prev.some((m) => m.id === data.id) ? prev : [...prev, data]
          );
        }
      };

      const handleMessageError = (data: any) => {
        showToast('error', data.error || 'Failed to send message');
      };

      webSocketService.onNewMessage(handleNewMessage);
      webSocketService.onMessageError(handleMessageError);

      return () => {
        webSocketService.offNewMessage(handleNewMessage);
        webSocketService.offMessageError(handleMessageError);
      };
    }
  }, [user?.id, userId, propertyId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id) return;

    setIsSending(true);
    try {
      if (isConnected) {
        // Send via WebSocket
        sendWsMessage({
          senderId: user.id,
          receiverId: userId,
          content: newMessage.trim(),
          messageType: 'TEXT',
          propertyId,
        });
      } else {
        // Fallback to REST API
        await apiClient.messages.send({
          receiverId: userId,
          content: newMessage.trim(),
          messageType: 'TEXT',
          propertyId,
        });
        await fetchMessages();
      }
      setNewMessage('');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border'
                  }`}
                >
                  {message.property && (
                    <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {message.property.title}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-xs opacity-60">
                      {formatDate(message.createdAt)}
                    </span>
                    {isOwn && message.isRead && (
                      <span className="text-xs opacity-60">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
