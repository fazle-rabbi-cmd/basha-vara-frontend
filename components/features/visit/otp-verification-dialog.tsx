'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  QrCode,
  KeyRound,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Home,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
  propertyTitle?: string;
  userRole: 'landlord' | 'tenant';
  tenantName?: string;
  visitDate?: string;
  visitTime?: string;
  initialTenantOtp?: string;
  onSuccess?: () => void;
  onApply?: () => void;
  landlordOtpVerified?: boolean;
  tenantOtpVerified?: boolean;
  isCompleted?: boolean;
}

export function OtpVerificationDialog({
  open,
  onOpenChange,
  visitId,
  propertyTitle,
  userRole,
  tenantName,
  visitDate,
  visitTime,
  initialTenantOtp,
  onSuccess,
  onApply,
  landlordOtpVerified = false,
  tenantOtpVerified = false,
  isCompleted = false,
}: OtpVerificationDialogProps) {
  const { showToast } = useToast();

  // Mode: Tenant shows their pass, Landlord enters tenant's code to verify
  const [tenantPasscode, setTenantPasscode] = useState<string | null>(initialTenantOtp || null);
  const [inputOtp, setInputOtp] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(isCompleted || (landlordOtpVerified && tenantOtpVerified));
  const [copied, setCopied] = useState(false);

  // Sync initial tenant passcode if props update
  useEffect(() => {
    if (initialTenantOtp) setTenantPasscode(initialTenantOtp);
  }, [initialTenantOtp]);

  // Sync completion status
  useEffect(() => {
    if (isCompleted || (landlordOtpVerified && tenantOtpVerified)) {
      setIsVerified(true);
    }
  }, [isCompleted, landlordOtpVerified, tenantOtpVerified]);

  // Fetch or generate tenant passcode if not present
  useEffect(() => {
    if (!open) return;

    if (userRole === 'tenant' && !tenantPasscode && !isVerified) {
      loadOrGeneratePasscode();
    }
  }, [open, userRole, tenantPasscode, isVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrGeneratePasscode = async () => {
    setIsLoadingCode(true);
    try {
      const response = await apiClient.visits.generateOtp(visitId, { role: 'tenant' });
      setTenantPasscode(response.otp);
    } catch (err: any) {
      console.warn('Could not auto-generate passcode:', err?.message);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const handleCopyCode = (code: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('success', 'Passcode copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyOtp = async () => {
    const code = inputOtp.trim();
    if (!code || code.length !== 6) {
      showToast('error', 'Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      await apiClient.visits.verifyOtp(visitId, { role: userRole, otp: code });
      setIsVerified(true);
      showToast('success', 'Visit check-in verified successfully!');
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Verification failed. Please check the 6-digit code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    if (!isVerifying && !isLoadingCode) {
      onOpenChange(false);
      setInputOtp('');
    }
  };

  const displayPasscode = tenantPasscode;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  In-Person Visit Check-In
                  <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                    {userRole === 'tenant' ? 'Visitor Pass' : 'Host Verification'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate max-w-[260px]">
                  {propertyTitle || 'Property Inspection'}
                </DialogDescription>
              </div>
            </div>
          </div>

          {(visitDate || visitTime) && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
              {visitDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>{visitDate}</span>
                </div>
              )}
              {visitTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{visitTime}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5">
          {!isVerified ? (
            <div className="space-y-4">


              {/* TENANT VIEW: DIGITAL VISIT PASS (only view) */}
              {userRole === 'tenant' && (
                <div className="space-y-4">
                  <Card className="border border-primary/20 bg-gradient-to-b from-primary/[0.04] to-transparent shadow-sm overflow-hidden">
                    <CardContent className="p-5 text-center space-y-4">
                      {/* Stylized QR representation */}
                      <div className="relative mx-auto w-32 h-32 bg-white rounded-xl p-2.5 shadow-sm border border-border/50 flex flex-col items-center justify-between">
                        <div className="w-full h-full flex flex-col justify-between">
                          <div className="flex justify-between w-full">
                            <div className="w-6 h-6 border-2 border-foreground rounded-sm flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-foreground rounded-xs" />
                            </div>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-foreground" />
                              <div className="w-2 h-2 bg-foreground" />
                            </div>
                            <div className="w-6 h-6 border-2 border-foreground rounded-sm flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-foreground rounded-xs" />
                            </div>
                          </div>
                          <div className="flex justify-center items-center py-1">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                              <Home className="h-3.5 w-3.5 text-primary" />
                            </div>
                          </div>
                          <div className="flex justify-between w-full">
                            <div className="w-6 h-6 border-2 border-foreground rounded-sm flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-foreground rounded-xs" />
                            </div>
                            <div className="flex gap-1 items-end">
                              <div className="w-2 h-2 bg-foreground" />
                              <div className="w-2 h-2 bg-foreground" />
                            </div>
                            <div className="w-6 h-6 border-2 border-foreground rounded-sm flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-foreground rounded-xs" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 6-Digit Monospace Passcode */}
                      <div>
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Visitor Check-In Passcode
                        </div>

                        {isLoadingCode ? (
                          <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Generating secure pass...
                          </div>
                        ) : displayPasscode ? (
                          <div className="inline-flex items-center gap-3 bg-muted/80 px-4 py-2 rounded-xl border border-border">
                            <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-primary">
                              {displayPasscode.slice(0, 3)} {displayPasscode.slice(3)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyCode(displayPasscode)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Copy Passcode"
                            >
                              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadOrGeneratePasscode}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            Generate Passcode
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                        Show this passcode or QR to the landlord upon arriving at the property. The landlord will enter it to verify attendance.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}



              {/* LANDLORD VIEW: CHECK IN VISITOR */}
              {userRole === 'landlord' && (
                <div className="space-y-4">
                  <div className="text-center py-2 space-y-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {tenantName ? `Check In: ${tenantName}` : 'Check In Prospective Tenant'}
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Ask the tenant for the 6-digit Visitor Passcode displayed on their phone screen.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="text-center text-2xl font-mono tracking-widest h-12 rounded-xl font-bold border-primary/40 focus-visible:ring-primary"
                      />
                      <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                        Enter the 6 digits from the tenant's digital pass
                      </p>
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={isVerifying || inputOtp.length !== 6}
                      className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Verifying Check-In...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Verify Attendance & Check In
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Security Footnote */}
              <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground flex items-start gap-2 border border-border/50">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  Check-in verification proves physical attendance and unlocks priority <strong>Verified Visitor</strong> status for rental applications.
                </p>
              </div>
            </div>
          ) : (
            /* SUCCESS STATE CELEBRATION */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs px-2.5 py-0.5">
                  Verified Attendance ✓
                </Badge>
                <h3 className="text-xl font-bold text-foreground">Visit Check-In Confirmed!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Physical attendance at the property has been verified. The visit status is now marked as <strong>Completed</strong>.
                </p>
              </div>

              {userRole === 'tenant' ? (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-left space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Sparkles className="h-4 w-4" />
                    Priority Application Unlocked
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    As a verified visitor, your rental application will carry the green <strong>Verified Visit ✓</strong> badge and appear at the top of the landlord's review queue.
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        handleClose();
                        onApply?.();
                      }}
                      className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 text-xs"
                    >
                      Apply Now with Verified Status
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground">
                  The prospective tenant has been verified. You can now review their submitted rental application or communicate via chat.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/60">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isVerifying}
            className="w-full h-9 text-xs"
          >
            {isVerified ? 'Done' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
