'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle, Download } from 'lucide-react';
import { SignatureCanvas } from '@/components/features/signature/signature-canvas';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';
import { formatDate } from '@/lib/utils';

interface LeaseAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  propertyTitle: string;
  rentAmount: number;
  depositAmount: number;
  tenantName: string;
  landlordName: string;
  userRole: 'landlord' | 'tenant';
  onSuccess?: () => void;
}

export function LeaseAgreementDialog({
  open,
  onOpenChange,
  applicationId,
  propertyTitle,
  rentAmount,
  depositAmount,
  tenantName,
  landlordName,
  userRole,
  onSuccess,
}: LeaseAgreementDialogProps) {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [terms, setTerms] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [leaseAgreement, setLeaseAgreement] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const minDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (open && applicationId) {
      loadExistingLease();
    }
  }, [open, applicationId]);

  const loadExistingLease = async () => {
    try {
      const lease = await apiClient.leaseAgreements.getByApplication(applicationId);
      setLeaseAgreement(lease);
      setStartDate(lease.startDate.split('T')[0]);
      setEndDate(lease.endDate.split('T')[0]);
      setTerms(typeof lease.terms === 'string' ? lease.terms : lease.terms?.description || '');
      setPdfUrl(lease.pdfUrl);
    } catch (error) {
      setLeaseAgreement(null);
    }
  };

  const handleCreateLease = async () => {
    if (!startDate || !endDate) {
      showToast('error', 'Please select start and end dates');
      return;
    }

    setIsCreating(true);
    try {
      const lease = await apiClient.leaseAgreements.create({
        applicationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        terms: terms || undefined,
      });
      setLeaseAgreement(lease);
      showToast('success', 'Lease agreement created successfully');
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create lease agreement');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!leaseAgreement) return;

    setIsGeneratingPdf(true);
    try {
      const response = await apiClient.leaseAgreements.generatePdf(leaseAgreement.id);
      setPdfUrl(response.pdfUrl);
      showToast('success', 'PDF generated successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSignatureSave = (data: string) => {
    setSignatureData(data);
  };

  const handleSignLease = async () => {
    if (!leaseAgreement || !signatureData) {
      showToast('error', 'Please provide your signature');
      return;
    }

    setIsSigning(true);
    try {
      const updateData: any = {};
      if (userRole === 'landlord') {
        updateData.landlordSignatureData = signatureData;
      } else {
        updateData.tenantSignatureData = signatureData;
      }

      const updatedLease = await apiClient.leaseAgreements.update(leaseAgreement.id, updateData);
      setLeaseAgreement(updatedLease);
      setSignatureData(null);
      showToast('success', 'Signature added successfully');

      if (updatedLease.landlordSigned && updatedLease.tenantSigned) {
        showToast('success', 'Lease agreement fully signed!');
        onSuccess?.();
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to sign lease agreement');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `lease-agreement-${applicationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    if (!isCreating && !isGeneratingPdf && !isSigning) {
      onOpenChange(false);
      setLeaseAgreement(null);
      setPdfUrl(null);
      setSignatureData(null);
    }
  };

  const canSign = userRole === 'landlord' ? !leaseAgreement?.landlordSigned : !leaseAgreement?.tenantSigned;
  const isFullySigned = leaseAgreement?.landlordSigned && leaseAgreement?.tenantSigned;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lease Agreement
          </DialogTitle>
          <DialogDescription>
            {propertyTitle ? `Lease agreement for ${propertyTitle}` : 'Create and sign lease agreement'}
          </DialogDescription>
        </DialogHeader>

        {!leaseAgreement ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lease Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      min={minDate}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      min={startDate || minDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="terms">Terms and Conditions (Optional)</Label>
                  <textarea
                    id="terms"
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[100px]"
                    placeholder="Enter any custom terms or conditions..."
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span className="font-medium">{rentAmount} ৳</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security Deposit:</span>
                    <span className="font-medium">{depositAmount} ৳</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Landlord:</span>
                    <span className="font-medium">{landlordName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenant:</span>
                    <span className="font-medium">{tenantName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lease Details</span>
                  {isFullySigned && <CheckCircle className="h-5 w-5 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <p className="font-medium">{formatDate(leaseAgreement.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <p className="font-medium">{formatDate(leaseAgreement.endDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rent:</span>
                    <p className="font-medium">{leaseAgreement.rentAmount} ৳/month</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deposit:</span>
                    <p className="font-medium">{leaseAgreement.depositAmount} ৳</p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{leaseAgreement.status.replace('_', ' ')}</p>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Landlord Signature:</span>
                    {leaseAgreement.landlordSigned ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground text-xs">Pending</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tenant Signature:</span>
                    {leaseAgreement.tenantSigned ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground text-xs">Pending</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {canSign && (
              <Card>
                <CardHeader>
                  <CardTitle>Sign Lease Agreement</CardTitle>
                </CardHeader>
                <CardContent>
                  <SignatureCanvas onSave={handleSignatureSave} />
                  <Button
                    onClick={handleSignLease}
                    disabled={!signatureData || isSigning}
                    className="w-full mt-4"
                  >
                    {isSigning ? 'Signing...' : 'Sign Lease Agreement'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!pdfUrl && (leaseAgreement.landlordSigned || leaseAgreement.tenantSigned) && (
              <Button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="w-full"
              >
                {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
              </Button>
            )}

            {pdfUrl && (
              <Button
                onClick={handleDownloadPdf}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          {!leaseAgreement ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLease}
                disabled={isCreating || !startDate || !endDate}
              >
                {isCreating ? 'Creating...' : 'Create Lease Agreement'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} disabled={isCreating || isGeneratingPdf || isSigning}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
