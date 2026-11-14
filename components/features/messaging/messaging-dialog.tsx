'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MessageThread } from './message-thread';
import { User } from 'lucide-react';

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName?: string;
  propertyId?: string;
}

export function MessagingDialog({
  open,
  onOpenChange,
  userId,
  userName,
  propertyId,
}: MessagingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Message {userName || 'User'}
          </DialogTitle>
          <DialogDescription>
            Send a message through the platform to keep communication secure
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <MessageThread
            userId={userId}
            propertyId={propertyId}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
