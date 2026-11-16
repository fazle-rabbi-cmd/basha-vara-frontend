'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Clock, CreditCard, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface TokenHoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
  propertyTitle: string;
  amount: number;
  onSuccess?: () => void;
}

export function TokenHoldDialog({
  open,
  onOpenChange,
  visitId,
  propertyTitle,
  amount,
  onSuccess,
}: TokenHoldDialogProps) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await apiClient.payments.initiateBookingDeposit(visitId, amount);
      showToast('success', 'Token hold payment initiated successfully');
      setPaymentCompleted(true);
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setPaymentCompleted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Property Token Hold
          </DialogTitle>
          <DialogDescription>
            {propertyTitle ? `Secure your visit slot for ${propertyTitle}` : 'Lock property for 48 hours'}
          </DialogDescription>
        </DialogHeader>

        {!paymentCompleted ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Token Hold Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Token Hold Amount:</span>
                  <span className="text-2xl font-bold">{amount} ৳</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lock Duration:</span>
                  <span className="font-medium">48 hours</span>
                </div>
                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-muted-foreground">
                      Property will be locked exclusively for you for 48 hours
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-muted-foreground">
                      Deposit refunded if no application submitted within 48 hours
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500 mt-0.5" />
                    <p className="text-muted-foreground">
                      Payment processed securely through platform
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Token Hold Confirmed!</h3>
            <p className="text-muted-foreground mb-4">
              Property has been locked for 48 hours. You can now proceed with your visit.
            </p>
          </div>
        )}

        <DialogFooter>
          {!paymentCompleted && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ${amount} ৳`}
              </Button>
            </>
          )}
          {paymentCompleted && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
