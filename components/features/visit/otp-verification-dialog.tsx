'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Phone, User, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
  propertyTitle: string;
  userRole: 'landlord' | 'tenant';
  onSuccess?: () => void;
}

export function OtpVerificationDialog({
  open,
  onOpenChange,
  visitId,
  propertyTitle,
  userRole,
  onSuccess,
}: OtpVerificationDialogProps) {
  const { showToast } = useToast();
  const [otp, setOtp] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleGenerateOtp = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.visits.generateOtp(visitId, { role: userRole });
      showToast('success', `OTP generated: ${response.otp}`);
      setOtpGenerated(true);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate OTP');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast('error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      await apiClient.visits.verifyOtp(visitId, { role: userRole, otp });
      setIsVerified(true);
      showToast('success', 'OTP verified successfully');
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'OTP verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating && !isVerifying) {
      onOpenChange(false);
      setOtp('');
      setOtpGenerated(false);
      setIsVerified(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Visit Verification
          </DialogTitle>
          <DialogDescription>
            {propertyTitle ? `Verify your visit for ${propertyTitle}` : 'Verify visit with OTP'}
          </DialogDescription>
        </DialogHeader>

        {!isVerified ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">OTP Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!otpGenerated ? (
                  <div className="text-center py-4">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a 6-digit OTP to verify your visit
                    </p>
                    <Button
                      onClick={handleGenerateOtp}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? 'Generating...' : 'Generate OTP'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm font-medium mb-2">Enter your OTP:</p>
                      <Input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={isVerifying || !otp || otp.length !== 6}
                      className="w-full"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify OTP'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleGenerateOtp}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      Regenerate OTP
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• OTP is valid for 15 minutes</p>
              <p>• Both landlord and tenant must verify OTP</p>
              <p>• Visit is marked complete after both verifications</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Visit Verified!</h3>
            <p className="text-muted-foreground mb-4">
              Your visit has been verified. You can now proceed with your application.
            </p>
          </div>
        )}

        <DialogFooter>
          {!isVerified && (
            <Button onClick={handleClose} disabled={isGenerating || isVerifying}>
              Close
            </Button>
          )}
          {isVerified && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
