import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, User, Send, X } from 'lucide-react';
import { formatShortDate } from '@/lib/utils';
import { useState } from 'react';

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
    avatarUrl?: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  property?: {
    id: string;
    title: string;
  };
}

interface ChatThreadProps {
  messages: Message[];
  currentUserId: string;
  selectedUser: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  property?: {
    id: string;
    title: string;
  };
  onBack: () => void;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isSending: boolean;
  isConnected: boolean;
}

export function ChatThread({
  messages,
  currentUserId,
  selectedUser,
  property,
  onBack,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  isSending,
  isConnected,
}: ChatThreadProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="border-b border-border p-3 flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => {
              if (selectedUser.avatarUrl) {
                setPreviewImage(selectedUser.avatarUrl);
              }
            }}
          >
            {selectedUser.avatarUrl ? (
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-base">{selectedUser.fullName}</h3>
            {property && (
              <p className="text-xs text-muted-foreground truncate">Re: {property.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-muted/20">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border'
                    }`}
                  >
                    {message.property && (
                      <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {message.property.title}
                        </Badge>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-xs opacity-60">
                        {formatShortDate(message.createdAt)}
                      </span>
                      {isOwn && message.isRead && (
                        <Badge variant="outline" className="text-xs h-4 px-1">
                          Read
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={onSendMessage} className="border-t border-border p-3 bg-background shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              disabled={isSending}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            <Button type="submit" disabled={isSending || !newMessage.trim()} size="icon" className="h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0">
          <div className="relative">
            <img
              src={previewImage || ''}
              alt="Profile preview"
              className="w-full h-auto object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}