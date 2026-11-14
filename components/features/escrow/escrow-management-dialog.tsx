'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, DollarSign, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface EscrowManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  paymentAmount: number;
  userRole: 'landlord' | 'tenant' | 'admin';
  onSuccess?: () => void;
}

export function EscrowManagementDialog({
  open,
  onOpenChange,
  paymentId,
  paymentAmount,
  userRole,
  onSuccess,
}: EscrowManagementDialogProps) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<'release' | 'refund' | 'dispute' | null>(null);
  const [reason, setReason] = useState('');
  const [splitPercentage, setSplitPercentage] = useState(50);

  const handleAction = async () => {
    if (!action) return;

    setIsProcessing(true);
    try {
      if (action === 'release') {
        await apiClient.escrow.release(paymentId, { releaseReason: reason });
        showToast('success', 'Escrow released successfully');
      } else if (action === 'refund') {
        await apiClient.escrow.refund(paymentId, { refundReason: reason });
        showToast('success', 'Escrow refunded successfully');
      } else if (action === 'dispute') {
        await apiClient.escrow.dispute(paymentId, { disputeReason: reason });
        showToast('success', 'Escrow disputed successfully');
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      showToast('error', error.message || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setAction(null);
      setReason('');
      setSplitPercentage(50);
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    if (userRole === 'landlord') {
      buttons.push(
        <Button
          key="release"
          onClick={() => setAction('release')}
          disabled={isProcessing}
          className="flex-1"
        >
          <Shield className="h-4 w-4 mr-2" />
          Release to Me
        </Button>
      );
    }

    if (userRole === 'tenant' || userRole === 'admin') {
      buttons.push(
        <Button
          key="refund"
          variant="outline"
          onClick={() => setAction('refund')}
          disabled={isProcessing}
          className="flex-1"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Request Refund
        </Button>
      );
    }

    buttons.push(
      <Button
        key="dispute"
        variant="destructive"
        onClick={() => setAction('dispute')}
        disabled={isProcessing}
        className="flex-1"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Dispute
      </Button>
    );

    return buttons;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Escrow Management
          </DialogTitle>
          <DialogDescription>
            Manage escrow payment of {paymentAmount} ৳
          </DialogDescription>
        </DialogHeader>

        {!action ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Escrow Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {getActionButtons()}
                </div>
              </CardContent>
            </Card>

            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• Release: Transfer funds to landlord</p>
              <p>• Refund: Return funds to tenant</p>
              <p>• Dispute: Flag for admin review</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {action === 'release' && 'Release Escrow'}
                  {action === 'refund' && 'Request Refund'}
                  {action === 'dispute' && 'Dispute Escrow'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    {action === 'release' && 'Release Reason (Optional)'}
                    {action === 'refund' && 'Refund Reason (Optional)'}
                    {action === 'dispute' && 'Dispute Reason'}
                  </Label>
                  <textarea
                    id="reason"
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder={
                      action === 'release'
                        ? 'Reason for releasing escrow...'
                        : action === 'refund'
                        ? 'Reason for refund...'
                        : 'Describe the dispute...'
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required={action === 'dispute'}
                  />
                </div>

                {action === 'dispute' && userRole === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="splitPercentage">Split Percentage to Landlord</Label>
                    <Input
                      id="splitPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={splitPercentage}
                      onChange={(e) => setSplitPercentage(Number(e.target.value))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {!action ? (
            <Button onClick={handleClose} disabled={isProcessing}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={handleAction}
                disabled={isProcessing || (action === 'dispute' && !reason)}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
