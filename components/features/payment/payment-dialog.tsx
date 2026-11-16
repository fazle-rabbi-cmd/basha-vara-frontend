'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';
import { EscrowStatusBadge } from '@/components/features/escrow/escrow-status-badge';
import { EscrowManagementDialog } from '@/components/features/escrow/escrow-management-dialog';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  propertyTitle: string;
  rentAmount: number;
  depositAmount: number;
  userRole: 'landlord' | 'tenant' | 'admin';
  onSuccess?: () => void;
}

type PaymentType = 'SECURITY_DEPOSIT' | 'FIRST_MONTH_RENT';

export function PaymentDialog({
  open,
  onOpenChange,
  applicationId,
  propertyTitle,
  rentAmount,
  depositAmount,
  userRole,
  onSuccess,
}: PaymentDialogProps) {
  const { showToast } = useToast();
  const [paymentType, setPaymentType] = useState<PaymentType>('SECURITY_DEPOSIT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [escrowStatus, setEscrowStatus] = useState<string | null>(null);
  const [escrowDialogOpen, setEscrowDialogOpen] = useState(false);

  const amount = paymentType === 'SECURITY_DEPOSIT' ? depositAmount : rentAmount;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await apiClient.payments.initiate(applicationId, { paymentType });
      setPaymentId(response.paymentId);

      showToast('success', 'Payment initiated successfully');

      setTimeout(async () => {
        try {
          const confirmedPayment = await apiClient.payments.confirm(response.paymentId);
          setPaymentCompleted(true);
          setEscrowStatus(confirmedPayment.escrowStatus);
          showToast('success', 'Payment completed successfully');
          onSuccess?.();
        } catch (error: any) {
          showToast('error', error.message || 'Payment confirmation failed');
        } finally {
          setIsProcessing(false);
        }
      }, 2000);
    } catch (error: any) {
      showToast('error', error.message || 'Payment initiation failed');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setPaymentCompleted(false);
      setPaymentId(null);
      setEscrowStatus(null);
    }
  };

  const getEscrowInfo = () => {
    if (!escrowStatus || escrowStatus === 'NOT_APPLICABLE') return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Escrow Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <EscrowStatusBadge escrowStatus={escrowStatus} />
          </div>
          {escrowStatus === 'HELD' && (
            <p className="text-sm text-muted-foreground">
              Your payment is held securely in escrow. It will be released to the landlord
              after lease conditions are met, or refunded if the application is rejected.
            </p>
          )}
          {escrowStatus === 'RELEASED' && (
            <p className="text-sm text-muted-foreground">
              Escrow has been released to the landlord. Platform fee has been deducted.
            </p>
          )}
          {escrowStatus === 'REFUNDED' && (
            <p className="text-sm text-muted-foreground">
              Your payment has been refunded to your account.
            </p>
          )}
          {escrowStatus === 'DISPUTED' && (
            <p className="text-sm text-muted-foreground">
              This payment is under dispute. Our team will review and resolve it.
            </p>
          )}
          {(escrowStatus === 'HELD' || escrowStatus === 'DISPUTED') && paymentId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEscrowDialogOpen(true)}
              className="w-full"
            >
              Manage Escrow
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment
          </DialogTitle>
          <DialogDescription>
            {propertyTitle ? `Payment for ${propertyTitle}` : 'Complete your payment'}
          </DialogDescription>
        </DialogHeader>

        {!paymentCompleted ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Type</label>
                  <div className="space-y-2">
                    <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentType === 'SECURITY_DEPOSIT' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}>
                      <div>
                        <div className="font-medium">Security Deposit</div>
                        <div className="text-sm text-muted-foreground">{depositAmount} ৳</div>
                      </div>
                      <input
                        type="radio"
                        name="paymentType"
                        value="SECURITY_DEPOSIT"
                        checked={paymentType === 'SECURITY_DEPOSIT'}
                        onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                        className="w-4 h-4"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentType === 'FIRST_MONTH_RENT' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}>
                      <div>
                        <div className="font-medium">First Month Rent</div>
                        <div className="text-sm text-muted-foreground">{rentAmount} ৳</div>
                      </div>
                      <input
                        type="radio"
                        name="paymentType"
                        value="FIRST_MONTH_RENT"
                        checked={paymentType === 'FIRST_MONTH_RENT'}
                        onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                        className="w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-2xl font-bold">{amount} ৳</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• Payment processed through secure gateway</p>
              <p>• Transaction fee: 2.9% + 30¢ (included)</p>
              <p>• Refundable within 7 days if lease not signed</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Your payment of {amount} ৳ has been processed successfully.
            </p>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p>Transaction ID: {paymentId}</p>
            </div>
            {getEscrowInfo()}
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
      {paymentId && escrowStatus && (escrowStatus === 'HELD' || escrowStatus === 'DISPUTED') && (
        <EscrowManagementDialog
          open={escrowDialogOpen}
          onOpenChange={setEscrowDialogOpen}
          paymentId={paymentId}
          paymentAmount={amount}
          userRole={userRole}
          onSuccess={() => {
            apiClient.escrow.getStatus(paymentId).then((escrow) => {
              setEscrowStatus(escrow.escrowStatus);
            });
          }}
        />
      )}
    </>
  );
}
