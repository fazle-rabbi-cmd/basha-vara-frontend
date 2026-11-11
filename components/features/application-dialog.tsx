'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, DollarSign, FileText, Upload, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';
import { DocumentUpload, DocumentType } from '@/components/shared/document-upload';

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
  const [showDocuments, setShowDocuments] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await apiClient.applications.create(propertyId, {
        coverNote: coverNote || undefined,
        moveInDate: moveInDate || undefined,
        proposedRent: proposedRent ? Number(proposedRent) : undefined,
      });
      setApplicationId(response.id);
      showToast('success', 'Application submitted successfully. You can now upload supporting documents.');
      setShowDocuments(true);
      setCoverNote('');
      setMoveInDate('');
      setProposedRent('');
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setShowDocuments(false);
        setApplicationId(null);
      }
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showDocuments ? 'Upload Supporting Documents' : 'Apply for this Property'}
          </DialogTitle>
          <DialogDescription>
            {showDocuments
              ? 'Upload documents to support your application for ' + propertyTitle
              : 'Submit your rental application for ' + propertyTitle
            }
          </DialogDescription>
        </DialogHeader>

        {!showDocuments ? (
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
        ) : (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Your application has been submitted successfully. You can now upload supporting documents to strengthen your application.
              </p>
              <p className="text-xs text-muted-foreground">
                Accepted file types: PDF, JPG, PNG (Max 5MB per file)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">
                  <FileText className="inline w-4 h-4 mr-2" />
                  Government ID
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Passport, National ID, or Driver's License
                </p>
                {applicationId && (
                  <DocumentUpload
                    applicationId={applicationId}
                    documentType={DocumentType.ID}
                    onDocumentsChange={() => {}}
                  />
                )}
              </div>

              <div>
                <Label className="text-base font-semibold">
                  <DollarSign className="inline w-4 h-4 mr-2" />
                  Proof of Income
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Pay stubs, bank statements, or employment letter
                </p>
                {applicationId && (
                  <DocumentUpload
                    applicationId={applicationId}
                    documentType={DocumentType.INCOME}
                    onDocumentsChange={() => {}}
                  />
                )}
              </div>

              <div>
                <Label className="text-base font-semibold">
                  <FileText className="inline w-4 h-4 mr-2" />
                  References
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Previous landlord references or character references
                </p>
                {applicationId && (
                  <DocumentUpload
                    applicationId={applicationId}
                    documentType={DocumentType.REFERENCE}
                    onDocumentsChange={() => {}}
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
