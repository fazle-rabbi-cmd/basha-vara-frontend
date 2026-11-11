'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, DollarSign, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  propertyRent: number;
  onSuccess?: () => void;
}

export function ApplicationDialog({ open, onOpenChange, propertyId, propertyTitle, propertyRent, onSuccess }: ApplicationDialogProps) {
  const { showToast } = useToast();
  const [coverNote, setCoverNote] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [proposedRent, setProposedRent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await apiClient.applications.create(propertyId, {
        coverNote: coverNote || undefined,
        moveInDate: moveInDate || undefined,
        proposedRent: proposedRent ? Number(proposedRent) : undefined,
      });
      showToast('success', 'Application submitted successfully! You can upload supporting documents anytime from your applications page.');
      setCoverNote('');
      setMoveInDate('');
      setProposedRent('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isSubmitting && onOpenChange(newOpen)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for this Property</DialogTitle>
          <DialogDescription>
            Submit your rental application for {propertyTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverNote">
              <FileText className="inline w-4 h-4 mr-2" />
              Cover Letter (Optional)
            </Label>
            <textarea
              id="coverNote"
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              placeholder="Tell the landlord about yourself and why you'd be a great tenant..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moveInDate">
              <Calendar className="inline w-4 h-4 mr-2" />
              Preferred Move-in Date (Optional)
            </Label>
            <Input
              id="moveInDate"
              type="date"
              min={minDate}
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposedRent">
              <DollarSign className="inline w-4 h-4 mr-2" />
              Proposed Rent (Optional)
            </Label>
            <Input
              id="proposedRent"
              type="number"
              placeholder={`Current rent: ${propertyRent}`}
              value={proposedRent}
              onChange={(e) => setProposedRent(e.target.value)}
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to accept the listed rent
            </p>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> You can upload supporting documents (ID, income proof, references) anytime after submitting your application from your applications page.
            </p>
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
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
