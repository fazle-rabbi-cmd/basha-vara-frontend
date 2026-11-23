'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, X, ImageOff, MessageSquare, Video, Lock, Shield, Pencil, Users, CheckCircle2, Sparkles } from 'lucide-react';
import { VideoCallDialog } from '@/components/features/video-call/video-call-dialog';
import { TokenHoldDialog } from '@/components/features/visit/token-hold-dialog';
import { OtpVerificationDialog } from '@/components/features/visit/otp-verification-dialog';
import { ApplicationDialog } from '@/components/features/application-dialog';
import { EditVisitDialog } from '@/components/features/edit-visit-dialog';
import { PropertyLockBadge } from '@/components/shared/property-lock-badge';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useVisits } from '@/features/visits/visit-service';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { VisitRequest, Property } from '@/types';
import { useEffect, useState, useRef } from 'react';
import { formatDate } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { TenantRoute } from '@/features/auth/protected-route';
import { useChatWidget } from '@/components/features/messaging/chat-widget-context';

export default function TenantVisitsPage() {
  const { user } = useAuth();
  const { visits, fetchVisits, cancelVisit } = useVisits(user?.id || '', 'tenant');
  const { showToast } = useToast();
  const { openChat } = useChatWidget();
  const [visitDetails, setVisitDetails] = useState<Array<VisitRequest & { property?: Property & { landlord?: { id: string; fullName: string } } }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [visitToCancel, setVisitToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [videoCallDialogOpen, setVideoCallDialogOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [tokenHoldDialogOpen, setTokenHoldDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState<VisitRequest | null>(null);
  const [visitToEditDetails, setVisitToEditDetails] = useState<any>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [applicationVisit, setApplicationVisit] = useState<any>(null);

  const handleApplyWithVisit = (visit: any) => {
    setApplicationVisit(visit);
    setApplicationDialogOpen(true);
  };

  const loadVisits = async () => {
    setIsLoading(true);
    await fetchVisits();
    // Fetch property details for each visit
    const details = await Promise.all(
      visits.map(async (v) => {
        try {
          const property = await apiClient.properties.getById(v.propertyId);
          // Try to get landlord info
          let landlord = null;
          try {
            const landlordUser = await apiClient.users.getById(property.landlordId);
            landlord = {
              id: landlordUser.id,
              fullName: landlordUser.name,
            };
          } catch {
            landlord = null;
          }
          return { ...v, property: { ...property, landlord } };
        } catch {
          return { ...v, property: undefined };
        }
      })
    );
    setVisitDetails(details.filter(v => v.property));
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadVisits();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update visitDetails when visits change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      Promise.all(
        visits.map(async (v) => {
          try {
            const property = await apiClient.properties.getById(v.propertyId);
            // Try to get landlord info
            let landlord = null;
            try {
              const landlordUser = await apiClient.users.getById(property.landlordId);
              landlord = {
                id: landlordUser.id,
                fullName: landlordUser.name,
              };
            } catch {
              landlord = null;
            }
            return { ...v, property: { ...property, landlord } };
          } catch {
            return { ...v, property: undefined };
          }
        })
      ).then((details) => {
        setVisitDetails(details.filter(v => v.property));
      });
    }
  }, [visits]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelClick = (visitId: string) => {
    setVisitToCancel(visitId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!visitToCancel) return;

    setIsCancelling(true);
    try {
      await cancelVisit(visitToCancel);
      showToast('success', 'Visit request cancelled successfully');
      await fetchVisits();
    } catch {
      showToast('error', 'Failed to cancel visit request');
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setVisitToCancel(null);
    }
  };

  const handleImageError = (visitId: string) => {
    setImageErrors(prev => new Set([...prev, visitId]));
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton variant="text" className="h-9 w-48 mb-2" />
            <Skeleton variant="text" className="h-5 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton variant="rectangular" className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-5 w-3/4" />
                      <Skeleton variant="text" className="h-4 w-1/2" />
                      <div className="flex gap-4">
                        <Skeleton variant="text" className="h-4 w-24" />
                        <Skeleton variant="text" className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <TenantRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Visit Requests</h1>
            <p className="text-muted-foreground">
              Track your property visits and scheduled appointments
            </p>
          </div>

        {visitDetails.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No visit requests yet</h2>
              <p className="text-muted-foreground mb-6">
                Browse properties and request visits to see them in person
              </p>
              <Button asChild>
                <Link href="/properties">Browse Properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visitDetails.map((visit) => (
              <Card key={visit.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Property Image */}
                    <div className="md:w-48 h-32 md:h-auto bg-muted overflow-hidden flex-shrink-0">
                      {!imageErrors.has(visit.id) && visit.property?.photos[0]?.url ? (
                        <img
                          src={visit.property.photos[0].url}
                          alt={visit.property?.title}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(visit.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Property Title & Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground text-lg truncate">
                              {visit.property?.title}
                            </h3>
                            <Badge
                              variant={getStatusBadgeVariant(visit.status)}
                              className="shrink-0"
                            >
                              {visit.status}
                            </Badge>
                          </div>

                          {/* Location */}
                          <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.property?.area}
                          </div>

                          {/* Visit Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-primary" />
                              <div>
                                <div className="text-xs text-muted-foreground">Date</div>
                                <div className="font-medium">{formatDate(visit.requestedDate)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-primary" />
                              <div>
                                <div className="text-xs text-muted-foreground">Time</div>
                                <div className="font-medium">{visit.requestedTime}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Video className="h-4 w-4 text-primary" />
                              <div>
                                <div className="text-xs text-muted-foreground">Type</div>
                                <div className="font-medium">{visit.visitType === 'IN_PERSON' ? 'In-Person' : 'Video Call'}</div>
                              </div>
                            </div>
                            {visit.visitType === 'IN_PERSON' && (
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-primary" />
                                <div>
                                  <div className="text-xs text-muted-foreground">Guests</div>
                                  <div className="font-medium">{visit.guestCount || 1}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Additional Info */}
                          {visit.message && (
                            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                              <span className="font-medium">Note:</span> {visit.message}
                            </div>
                          )}

                          {/* Verified Visit Priority Application Banner */}
                          {(visit.status?.toLowerCase() === 'completed' || visit.visitVerifiedAt) && (
                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-300">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                <span>Visit physically verified! You are eligible for priority application review.</span>
                              </div>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white shrink-0 font-medium h-8 text-xs"
                                onClick={() => handleApplyWithVisit(visit)}
                              >
                                <Sparkles className="h-3.5 w-3.5 mr-1" />
                                Apply with Verified Visit
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                          {(visit.status?.toLowerCase() === 'completed' || visit.visitVerifiedAt) && (
                            <Button
                              size="sm"
                              onClick={() => handleApplyWithVisit(visit)}
                              className="h-9 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" />
                              Apply Now
                            </Button>
                          )}
                          {visit.property?.landlord && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openChat(visit.property!.landlord!.id, visit.propertyId)}
                              className="h-9 px-3 text-xs"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          )}
                          {visit.status?.toLowerCase() === 'accepted' && visit.visitType === 'VIDEO_CALL' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVisitId(visit.id);
                                setVideoCallDialogOpen(true);
                              }}
                              className="h-9 px-3 text-xs"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Video Call
                            </Button>
                          )}
                          {visit.status?.toLowerCase() === 'accepted' && !visit.tokenHoldAmount && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedVisit(visit);
                                setTokenHoldDialogOpen(true);
                              }}
                              className="h-9 px-3 text-xs"
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Token Hold
                            </Button>
                          )}
                          {visit.status?.toLowerCase() === 'accepted' && !visit.visitVerifiedAt && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedVisit(visit);
                                  setOtpDialogOpen(true);
                                }}
                                className="h-9 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                              >
                                <Shield className="h-4 w-4 mr-1.5" />
                                Visit Pass & Check-In
                              </Button>
                              {visit.tenantOtp && (
                                <Badge variant="secondary" className="font-mono text-xs font-bold text-primary px-2 py-1">
                                  Pass: {visit.tenantOtp.slice(0, 3)} {visit.tenantOtp.slice(3)}
                                </Badge>
                              )}
                            </div>
                          )}
                          {visit.status?.toLowerCase() === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVisitToEdit(visit);
                                setVisitToEditDetails(visitDetails.find(v => v.id === visit.id) || null);
                                setEditDialogOpen(true);
                              }}
                              className="h-9 px-3 text-xs"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {(visit.status?.toLowerCase() === 'pending' || visit.status?.toLowerCase() === 'accepted') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClick(visit.id)}
                              className="h-9 px-3 text-xs"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild className="h-9 px-3 text-xs">
                            <Link href={`/properties/${visit.propertyId}`}>View Property</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Visit Dialog */}
      <EditVisitDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        visit={visitToEdit}
        propertyTitle={visitToEditDetails?.property?.title}
        onSuccess={() => {
          loadVisits();
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Visit Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this visit request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Call Dialog */}
      {selectedVisitId && (
        <VideoCallDialog
          open={videoCallDialogOpen}
          onOpenChange={setVideoCallDialogOpen}
          visitId={selectedVisitId}
          propertyTitle={visitDetails.find(v => v.id === selectedVisitId)?.property?.title}
        />
      )}

      {/* Token Hold Dialog */}
      {selectedVisit && (
        <TokenHoldDialog
          open={tokenHoldDialogOpen}
          onOpenChange={setTokenHoldDialogOpen}
          visitId={selectedVisit.id}
          propertyTitle={selectedVisit.property?.title}
          amount={500}
          onSuccess={() => {
            loadVisits();
          }}
        />
      )}

      {/* OTP Verification Dialog */}
      {selectedVisit && (
        <OtpVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          visitId={selectedVisit.id}
          propertyTitle={selectedVisit.property?.title}
          userRole="tenant"
          visitDate={formatDate(selectedVisit.requestedDate)}
          visitTime={selectedVisit.requestedTime}
          initialTenantOtp={selectedVisit.tenantOtp}
          landlordOtpVerified={!!selectedVisit.landlordOtpVerifiedAt}
          tenantOtpVerified={!!selectedVisit.tenantOtpVerifiedAt}
          isCompleted={selectedVisit.status?.toLowerCase() === 'completed' || !!selectedVisit.visitVerifiedAt}
          onSuccess={() => {
            loadVisits();
          }}
          onApply={() => {
            handleApplyWithVisit(selectedVisit);
          }}
        />
      )}

      {/* Application Dialog */}
      {applicationVisit && (
        <ApplicationDialog
          open={applicationDialogOpen}
          onOpenChange={setApplicationDialogOpen}
          propertyId={applicationVisit.propertyId}
          propertyTitle={applicationVisit.property?.title || 'Property'}
          propertyRent={applicationVisit.property?.rentAmount || applicationVisit.property?.rent || 0}
          verifiedVisitId={applicationVisit.id}
          onSuccess={() => {
            loadVisits();
          }}
        />
      )}
    </PageLayout>
    </TenantRoute>
  );
}
