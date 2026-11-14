'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Check, X, Calendar as CalendarIcon, ImageOff, Phone, Mail, User, FileText, ChevronDown, ChevronUp, MessageSquare, Video, Shield, Lock } from 'lucide-react';
import { UserContactDisplay } from '@/components/shared/user-contact-display';
import { MessagingDialog } from '@/components/features/messaging/messaging-dialog';
import { VideoCallDialog } from '@/components/features/video-call/video-call-dialog';
import { OtpVerificationDialog } from '@/components/features/visit/otp-verification-dialog';
import { PropertyLockBadge } from '@/components/shared/property-lock-badge';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useVisits } from '@/features/visits/visit-service';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { VisitRequest, Property } from '@/types';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface TenantInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  emailVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
  phoneVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
  documents?: any[];
}
import { useEffect, useState, useRef, Suspense } from 'react';
import { formatDate } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { LandlordRoute } from '@/features/auth/protected-route';
import { useSearchParams } from 'next/navigation';

function LandlordVisitsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const propertyIdFilter = searchParams.get('propertyId');
  const { visits, fetchVisits, acceptVisit, declineVisit } = useVisits(user?.id || '', 'landlord');
  const { showToast } = useToast();
  const [visitDetails, setVisitDetails] = useState<Array<VisitRequest & { property?: Property; tenant?: TenantInfo }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [visitToDecline, setVisitToDecline] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [filterPropertyTitle, setFilterPropertyTitle] = useState<string | null>(null);
  const [expandedVisitIds, setExpandedVisitIds] = useState<Set<string>>(new Set());
  const [messagingDialogOpen, setMessagingDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [videoCallDialogOpen, setVideoCallDialogOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  const loadVisits = async () => {
    setIsLoading(true);
    await fetchVisits();

    if (propertyIdFilter) {
      try {
        const property = await apiClient.properties.getById(propertyIdFilter);
        setFilterPropertyTitle(property.title);
      } catch {
        setFilterPropertyTitle(null);
      }
    } else {
      setFilterPropertyTitle(null);
    }

    // Fetch property and tenant details for each visit
    const details = await Promise.all(
      visits.map(async (v) => {
        try {
          const [property, user, documents] = await Promise.all([
            apiClient.properties.getById(v.propertyId),
            apiClient.users.getById(v.tenantId) as Promise<UserInfo>,
            apiClient.userDocuments.getUserDocuments(v.tenantId).catch(() => []),
          ]);
          const tenant: TenantInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            emailVisibility: user.emailVisibility,
            phoneVisibility: user.phoneVisibility,
            documents,
          };
          return { ...v, property, tenant };
        } catch {
          return { ...v, property: undefined, tenant: undefined };
        }
      })
    );
    const filteredDetails = details.filter(v => v.property);
    setVisitDetails(propertyIdFilter ? filteredDetails.filter(v => v.propertyId === propertyIdFilter) : filteredDetails);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadVisits();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasLoadedRef.current) {
      loadVisits();
    }
  }, [propertyIdFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update visitDetails when visits change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      Promise.all(
        visits.map(async (v) => {
          try {
            const [property, user, documents] = await Promise.all([
              apiClient.properties.getById(v.propertyId),
              apiClient.users.getById(v.tenantId) as Promise<UserInfo>,
              apiClient.userDocuments.getUserDocuments(v.tenantId).catch(() => []),
            ]);
            const tenant: TenantInfo = {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              emailVisibility: user.emailVisibility,
              phoneVisibility: user.phoneVisibility,
              documents,
            };
            return { ...v, property, tenant };
          } catch {
            return { ...v, property: undefined, tenant: undefined };
          }
        })
      ).then((details) => {
        const filteredDetails = details.filter(v => v.property);
        setVisitDetails(propertyIdFilter ? filteredDetails.filter(v => v.propertyId === propertyIdFilter) : filteredDetails);
      });
    }
  }, [visits, propertyIdFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAcceptVisit = async (visitId: string) => {
    setIsProcessing(true);
    try {
      await acceptVisit(visitId);
      showToast('success', 'Visit request accepted');
      await fetchVisits();
    } catch (error) {
      showToast('error', 'Failed to accept visit request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineClick = (visitId: string) => {
    setVisitToDecline(visitId);
    setDeclineDialogOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!visitToDecline) return;

    setIsProcessing(true);
    try {
      await declineVisit(visitToDecline);
      showToast('success', 'Visit request declined');
      await fetchVisits();
    } catch (error) {
      showToast('error', 'Failed to decline visit request');
    } finally {
      setIsProcessing(false);
      setDeclineDialogOpen(false);
      setVisitToDecline(null);
    }
  };

  const handleImageError = (visitId: string) => {
    setImageErrors(prev => new Set([...prev, visitId]));
  };

  const toggleExpandVisit = (visitId: string) => {
    setExpandedVisitIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitId)) {
        newSet.delete(visitId);
      } else {
        newSet.add(visitId);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    <LandlordRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {filterPropertyTitle ? `Visit Requests: ${filterPropertyTitle}` : 'Visit Requests'}
            </h1>
            <p className="text-muted-foreground">
              {filterPropertyTitle
                ? `Visit requests for this specific property`
                : 'Manage incoming property visit requests from tenants'}
            </p>
            {filterPropertyTitle && (
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link href="/landlord/visits">View All Visit Requests</Link>
              </Button>
            )}
          </div>

        {visitDetails.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No visit requests yet</h2>
              <p className="text-muted-foreground mb-6">
                Visit requests from interested tenants will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visitDetails.map((visit) => (
              <Card key={visit.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {!imageErrors.has(visit.id) && visit.property?.photos[0]?.url ? (
                          <img
                            src={visit.property.photos[0].url}
                            alt={visit.property?.title}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(visit.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {visit.property?.title}
                          </h3>
                          <Badge
                            variant={getStatusBadgeVariant(visit.status)}
                            className="text-xs shrink-0"
                          >
                            {visit.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{visit.property?.area}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(visit.requestedDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{visit.requestedTime}</span>
                          </div>
                        </div>
                        {visit.tenant && (
                          <div className="flex flex-col gap-1 text-xs mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-primary" />
                              <span className="font-medium text-foreground">{visit.tenant.name}</span>
                            </div>
                            <UserContactDisplay
                              user={{
                                email: visit.tenant.email || '',
                                phone: visit.tenant.phone,
                                emailVisibility: visit.tenant.emailVisibility,
                                phoneVisibility: visit.tenant.phoneVisibility,
                              }}
                              showContactButton={visit.status === 'ACCEPTED'}
                            />
                            {visit.tenant.documents && visit.tenant.documents.length > 0 && (
                              <button
                                onClick={() => toggleExpandVisit(visit.id)}
                                className="flex items-center gap-1 text-primary hover:underline mt-1"
                              >
                                <FileText className="h-3 w-3" />
                                {expandedVisitIds.has(visit.id) ? 'Hide Documents' : `View Documents (${visit.tenant.documents.length})`}
                                {expandedVisitIds.has(visit.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        )}

                        {expandedVisitIds.has(visit.id) && visit.tenant?.documents && visit.tenant.documents.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-foreground mb-2">Tenant Documents</p>
                            <div className="space-y-2">
                              {visit.tenant.documents.map((doc: any) => (
                                <a
                                  key={doc.id}
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                                >
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{doc.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {visit.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            Note: {visit.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:border-l sm:pl-3">
                      {visit.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcceptVisit(visit.id)}
                            disabled={isProcessing}
                            className="h-8 px-3 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineClick(visit.id)}
                            disabled={isProcessing}
                            className="h-8 px-3 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                      {visit.tenant && visit.status === 'ACCEPTED' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(visit.tenant!.id);
                              setSelectedUserName(visit.tenant!.name);
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
                          {!visit.visitVerifiedAt && (
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
                          {visit.visitVerifiedAt && (
                            <Badge variant="success" className="h-8 px-3 text-xs">
                              Verified
                            </Badge>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 px-3 text-xs text-muted-foreground"
                      >
                        <Link href={`/properties/${visit.propertyId}`}>
                          Property
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Visit Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this visit request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineDialogOpen(false)}
              disabled={isProcessing}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDecline}
              disabled={isProcessing}
            >
              {isProcessing ? 'Declining...' : 'Decline Request'}
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

      {/* OTP Verification Dialog */}
      {selectedVisit && (
        <OtpVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          visitId={selectedVisit.id}
          propertyTitle={selectedVisit.property?.title}
          userRole="landlord"
          onSuccess={() => {
            loadVisits();
          }}
        />
      )}
    </PageLayout>
    </LandlordRoute>
  );
}

export default function LandlordVisitsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LandlordVisitsContent />
    </Suspense>
  );
}
