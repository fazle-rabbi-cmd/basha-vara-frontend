'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { formatDate } from '@/lib/utils';

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
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
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
      await apiClient.messages.send({
        receiverId: userId,
        content: newMessage.trim(),
        messageType: 'TEXT',
        propertyId,
      });
      setNewMessage('');
      await fetchMessages();
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.senderId === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.property && (
                  <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {message.property.title}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <div className="text-xs opacity-60 mt-1 text-right">
                  {formatDate(message.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
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
