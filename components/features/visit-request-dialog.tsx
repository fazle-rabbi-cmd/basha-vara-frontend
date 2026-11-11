'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface VisitRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  onSuccess?: () => void;
}

export function VisitRequestDialog({ open, onOpenChange, propertyId, propertyTitle, onSuccess }: VisitRequestDialogProps) {
  const { showToast } = useToast();
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedDate || !requestedTime) {
      showToast('error', 'Please select a date and time for your visit');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.visits.create(propertyId, {
        requestedDate,
        requestedTime,
        message: message || undefined,
      });
      showToast('success', 'Visit request submitted successfully');
      onOpenChange(false);
      setRequestedDate('');
      setRequestedTime('');
      setMessage('');
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to submit visit request');
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
      <DialogContent>
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
