'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, X, ImageOff, MessageSquare, Video, Lock, Shield } from 'lucide-react';
import { MessagingDialog } from '@/components/features/messaging/messaging-dialog';
import { VideoCallDialog } from '@/components/features/video-call/video-call-dialog';
import { TokenHoldDialog } from '@/components/features/visit/token-hold-dialog';
import { OtpVerificationDialog } from '@/components/features/visit/otp-verification-dialog';
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

export default function TenantVisitsPage() {
  const { user } = useAuth();
  const { visits, fetchVisits, cancelVisit } = useVisits(user?.id || '', 'tenant');
  const { showToast } = useToast();
  const [visitDetails, setVisitDetails] = useState<Array<VisitRequest & { property?: Property & { landlord?: { id: string; fullName: string } } }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [visitToCancel, setVisitToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [messagingDialogOpen, setMessagingDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [videoCallDialogOpen, setVideoCallDialogOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [tokenHoldDialogOpen, setTokenHoldDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

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
              fullName: landlordUser.fullName || landlordUser.name,
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
                fullName: landlordUser.fullName || landlordUser.name,
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
              <Card key={visit.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {!imageErrors.has(visit.id) && visit.property?.photos[0]?.url ? (
                            <img
                              src={visit.property.photos[0].url}
                              alt={visit.property?.title}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(visit.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageOff className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {visit.property?.title}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.property?.area}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(visit.requestedDate)}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {visit.requestedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={getStatusBadgeVariant(visit.status)}
                      >
                        {visit.status}
                      </Badge>
                      {visit.status === 'accepted' && visit.property?.landlord && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(visit.property!.landlord!.id);
                              setSelectedUserName(visit.property!.landlord!.fullName);
                              setSelectedPropertyId(visit.propertyId);
                              setMessagingDialogOpen(true);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                          {visit.visitType === 'VIDEO_CALL' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVisitId(visit.id);
                                setVideoCallDialogOpen(true);
                              }}
                              className="h-8 px-3 text-xs"
                            >
                              <Video className="h-3 w-3 mr-1" />
                              Video Call
                            </Button>
                          )}
                        </>
                      )}
                      {visit.status === 'accepted' && !visit.tokenHoldAmount && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVisit(visit);
                            setTokenHoldDialogOpen(true);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Token Hold
                        </Button>
                      )}
                      {visit.status === 'accepted' && visit.tokenHoldAmount && !visit.visitVerifiedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVisit(visit);
                            setOtpDialogOpen(true);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Verify Visit
                        </Button>
                      )}
                      {visit.status === 'accepted' && !visit.visitVerifiedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVisit(visit);
                            setOtpDialogOpen(true);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Verify Visit
                        </Button>
                      )}
                      {(visit.status === 'pending' || visit.status === 'accepted') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(visit.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${visit.propertyId}`}>View Property</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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

      {/* Messaging Dialog */}
      {selectedUserId && (
        <MessagingDialog
          open={messagingDialogOpen}
          onOpenChange={setMessagingDialogOpen}
          userId={selectedUserId}
          userName={selectedUserName || undefined}
          propertyId={selectedPropertyId || undefined}
        />
      )}

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
          onSuccess={() => {
            loadVisits();
          }}
        />
      )}
    </PageLayout>
    </TenantRoute>
  );
}
