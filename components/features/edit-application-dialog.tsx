'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';
import { RentalApplication } from '@/types';

interface EditApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: RentalApplication | null;
  propertyRent: number;
  propertyTitle?: string;
  onSuccess?: () => void;
}

export function EditApplicationDialog({ open, onOpenChange, application, propertyRent, propertyTitle, onSuccess }: EditApplicationDialogProps) {
  const { showToast } = useToast();
  const [coverNote, setCoverNote] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [proposedRent, setProposedRent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (application) {
      setCoverNote(application.coverNote || '');
      setMoveInDate(application.moveInDate ? new Date(application.moveInDate).toISOString().split('T')[0] : '');
      setProposedRent(application.proposedRent ? application.proposedRent.toString() : '');
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!application) return;

    setIsSubmitting(true);
    try {
      await apiClient.applications.update(application.id, {
        coverNote: coverNote || undefined,
        moveInDate: moveInDate || undefined,
        proposedRent: proposedRent ? Number(proposedRent) : undefined,
      });
      showToast('success', 'Application updated successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isSubmitting && onOpenChange(newOpen)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>
            Update your application for {propertyTitle || 'this property'}
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
              {isSubmitting ? 'Updating...' : 'Update Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
