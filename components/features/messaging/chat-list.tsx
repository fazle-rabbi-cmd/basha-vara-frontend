import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MessageSquare, User, ChevronRight, X } from 'lucide-react';
import { formatShortDate } from '@/lib/utils';
import { useState } from 'react';

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

interface ChatListProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ChatList({ conversations, currentUserId, onSelectConversation }: ChatListProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h3>
          <p className="text-sm text-muted-foreground">
            Start a conversation by messaging a user from their profile or property page
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <Card
            key={conversation.userId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectConversation(conversation)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (conversation.user.avatarUrl) {
                      setPreviewImage(conversation.user.avatarUrl);
                    }
                  }}
                >
                  {conversation.user.avatarUrl ? (
                    <img
                      src={conversation.user.avatarUrl}
                      alt={conversation.user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate text-sm md:text-base">
                      {conversation.user.fullName}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatShortDate(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                  </div>

                  {conversation.property && (
                    <p className="text-xs text-muted-foreground truncate">
                      Re: {conversation.property.title}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                      {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                      {conversation.lastMessage.content}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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