'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MessageSquare, Users, Video, Phone } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';
import { VisitRequest } from '@/types';

interface EditVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitRequest | null;
  propertyTitle?: string;
  onSuccess?: () => void;
}

export function EditVisitDialog({ open, onOpenChange, visit, propertyTitle, onSuccess }: EditVisitDialogProps) {
  const { showToast } = useToast();
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [message, setMessage] = useState('');
  const [visitType, setVisitType] = useState<'IN_PERSON' | 'VIDEO_CALL'>('IN_PERSON');
  const [guestCount, setGuestCount] = useState(1);
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visit) {
      const date = new Date(visit.requestedDate);
      setRequestedDate(date.toISOString().split('T')[0]);
      setRequestedTime(visit.requestedTime);
      setMessage(visit.message || '');
      setVisitType(visit.visitType || 'IN_PERSON');
      setGuestCount(visit.guestCount || 1);
      setContactPhone(visit.contactPhone || '');
    }
  }, [visit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visit) return;

    if (!requestedDate || !requestedTime) {
      showToast('error', 'Please select a date and time for your visit');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.visits.update(visit.id, {
        requestedDate,
        requestedTime,
        message: message || undefined,
        visitType,
        guestCount,
        contactPhone: contactPhone || undefined,
      });
      showToast('success', 'Visit request updated successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update visit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Visit Request</DialogTitle>
          <DialogDescription>
            Update your visit details for {propertyTitle || 'this property'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requestedDate">
              <Calendar className="inline w-4 h-4 mr-2" />
              Preferred Date
            </Label>
            <Input
              id="requestedDate"
              type="date"
              min={minDate}
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedTime">
              <Clock className="inline w-4 h-4 mr-2" />
              Preferred Time
            </Label>
            <Input
              id="requestedTime"
              type="time"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitType">
              <Video className="inline w-4 h-4 mr-2" />
              Visit Type
            </Label>
            <select
              id="visitType"
              value={visitType}
              onChange={(e) => setVisitType(e.target.value as 'IN_PERSON' | 'VIDEO_CALL')}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="IN_PERSON">In-Person Visit</option>
              <option value="VIDEO_CALL">Video Call Tour</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCount">
              <Users className="inline w-4 h-4 mr-2" />
              Number of Guests
            </Label>
            <Input
              id="guestCount"
              type="number"
              min="1"
              max="10"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">
              <Phone className="inline w-4 h-4 mr-2" />
              Contact Phone (Optional)
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+8801712345678"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              <MessageSquare className="inline w-4 h-4 mr-2" />
              Message (Optional)
            </Label>
            <Input
              id="message"
              placeholder="Any specific questions or requests?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
