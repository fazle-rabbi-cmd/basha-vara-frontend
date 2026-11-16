'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface PoliceVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  propertyId: string;
  applicationId?: string;
  tenantName: string;
  propertyTitle: string;
  onSuccess?: () => void;
}

export function PoliceVerificationDialog({
  open,
  onOpenChange,
  tenantId,
  propertyId,
  applicationId,
  tenantName,
  propertyTitle,
  onSuccess,
}: PoliceVerificationDialogProps) {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const verification = await apiClient.policeVerification.generate({
        tenantId,
        propertyId,
        applicationId,
      });
      setVerificationId(verification.id);
      setVerificationStatus(verification.status);
      showToast('success', 'Police verification form generated successfully');
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate police verification');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!verificationId) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/police-verification/${verificationId}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `police-verification-${tenantName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('success', 'PDF downloaded successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to download PDF');
    }
  };

  const handleSubmit = async () => {
    if (!verificationId) return;

    setIsSubmitting(true);
    try {
      await apiClient.policeVerification.submit(verificationId);
      setVerificationStatus('SUBMITTED');
      showToast('success', 'Police verification submitted successfully');
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating && !isSubmitting) {
      onOpenChange(false);
      setVerificationId(null);
      setVerificationStatus(null);
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'PENDING':
        return <span className="text-yellow-600">Pending</span>;
      case 'GENERATED':
        return <span className="text-blue-600">Generated</span>;
      case 'SUBMITTED':
        return <span className="text-green-600">Submitted</span>;
      case 'VERIFIED':
        return <span className="text-green-600">Verified</span>;
      default:
        return <span className="text-muted-foreground">Not Started</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Police Verification
          </DialogTitle>
          <DialogDescription>
            Generate DMP tenant registration form for {tenantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tenant:</span>
                <span className="font-medium">{tenantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Property:</span>
                <span className="font-medium">{propertyTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge()}
              </div>
            </CardContent>
          </Card>

          {!verificationId ? (
            <div className="text-center py-4">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Generate a police verification form for this tenant. The form will be automatically populated with tenant and property information.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Verification Form'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Form Generated</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Verification form ready</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Download the PDF form and submit it to the nearest police station for tenant verification.
                  </p>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {verificationStatus === 'GENERATED' && (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Mark as Submitted'}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
            <p>• Form is automatically populated with tenant and property data</p>
            <p>• Download PDF and submit to nearest police station</p>
            <p>• Admin will verify after police confirmation</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} disabled={isGenerating || isSubmitting}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
