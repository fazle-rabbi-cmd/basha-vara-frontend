'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MessageSquare, Users, Video } from 'lucide-react';
import { apiClient, clearCache } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface VisitRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  landlordId?: string;
  onSuccess?: () => void;
}

export function VisitRequestDialog({ open, onOpenChange, propertyId, propertyTitle, landlordId, onSuccess }: VisitRequestDialogProps) {
  const { showToast } = useToast();
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [message, setMessage] = useState('');
  const [visitType, setVisitType] = useState<'IN_PERSON' | 'VIDEO_CALL'>('IN_PERSON');
  const [guestCount, setGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedDate || !requestedTime) {
      showToast('error', 'Please select a date and time for your visit');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Starting visit request submission...');

      const payload = {
        requestedDate,
        requestedTime,
        visitType,
        guestCount: visitType === 'VIDEO_CALL' ? 1 : Number(guestCount),
        message: message.trim() || undefined,
      };
      console.log('Visit request payload:', payload);

      // Create visit request (POST /properties/:propertyId/visits)
      const visit = await apiClient.visits.create(propertyId, payload);
      console.log('Visit request response:', visit);

      // Clear cached visits so the UI reflects the new request immediately
      clearCache();

      // Resolve landlord ID for optional chat notification
      let targetLandlordId = landlordId;
      if (!targetLandlordId) {
        try {
          const property = await apiClient.properties.getById(propertyId);
          targetLandlordId = property.landlordId;
        } catch {
          // ignore error resolving landlord
        }
      }

      if (targetLandlordId) {
        try {
          const messageContent = message.trim()
            ? message
            : `I'm interested in visiting ${propertyTitle}. I've requested a ${visitType === 'IN_PERSON' ? 'visit' : 'video call tour'} for ${requestedDate} at ${requestedTime}.`;
          await apiClient.messages.send({
            receiverId: targetLandlordId,
            content: messageContent,
            messageType: 'TEXT',
            propertyId: propertyId,
          });
        } catch (chatError) {
          console.warn('Initial chat notification skipped:', chatError);
        }
      }

      showToast('success', 'Visit request submitted successfully');
      onOpenChange(false);
      setRequestedDate('');
      setRequestedTime('');
      setMessage('');
      setVisitType('IN_PERSON');
      setGuestCount(1);
      console.log('Calling onSuccess callback...');
      await onSuccess?.();
      console.log('onSuccess callback completed');
    } catch (error: any) {
      console.error('Visit request error:', error);
      if (error.message && error.message.includes('already')) {
        showToast('error', 'You already have a pending visit request for this property');
      } else {
        showToast('error', error.message || 'Failed to submit visit request');
      }
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Visit</DialogTitle>
          <DialogDescription>
            Schedule a visit to see {propertyTitle}
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

          {visitType === 'IN_PERSON' && (
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
          )}

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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
