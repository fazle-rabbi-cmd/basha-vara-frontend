'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Check, X, Calendar as CalendarIcon, ImageOff, Phone, Mail, User, FileText, ChevronDown, ChevronUp, MessageSquare, Video, Shield, Lock, Users, CheckCircle2 } from 'lucide-react';
import { UserContactDisplay } from '@/components/shared/user-contact-display';
import { VideoCallDialog } from '@/components/features/video-call/video-call-dialog';
import { OtpVerificationDialog } from '@/components/features/visit/otp-verification-dialog';
import { PropertyLockBadge } from '@/components/shared/property-lock-badge';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useVisits } from '@/features/visits/visit-service';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { VisitRequest, Property } from '@/types';
import { useChatWidget } from '@/components/features/messaging/chat-widget-context';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
  phoneVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
}

interface TenantInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  emailVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
  phoneVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
  documents?: any[];
  tenantInfo?: {
    occupation?: string;
    householdSize?: number;
    bio?: string;
    budgetMin?: string;
    budgetMax?: string;
    religion?: string;
    nationality?: string;
  };
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
  const { openChat } = useChatWidget();
  const [visitDetails, setVisitDetails] = useState<Array<VisitRequest & { property?: Property; tenant?: TenantInfo }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [visitToDecline, setVisitToDecline] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [filterPropertyTitle, setFilterPropertyTitle] = useState<string | null>(null);
  const [expandedVisitIds, setExpandedVisitIds] = useState<Set<string>>(new Set());
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
          const [property, userProfile, documents] = await Promise.all([
            apiClient.properties.getById(v.propertyId),
            apiClient.users.getPublicProfile(v.tenantId),
            apiClient.userDocuments.getUserDocuments(v.tenantId).catch(() => []),
          ]);
          const tenant: TenantInfo = {
            id: userProfile.id,
            name: userProfile.fullName,
            email: userProfile.email,
            phone: userProfile.phone,
            emailVisibility: userProfile.emailVisibility,
            phoneVisibility: userProfile.phoneVisibility,
            documents,
            tenantInfo: userProfile.tenantInfo,
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
          <div className="space-y-4">
            {visitDetails.map((visit) => (
              <Card key={visit.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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

                          {/* Tenant Information Section */}
                          {visit.tenant && (
                            <div className="border-t border-border pt-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">Tenant Information</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">Name:</span> {visit.tenant.name}
                                </div>
                                {visit.tenant.tenantInfo?.occupation && (
                                  <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Occupation:</span> {visit.tenant.tenantInfo.occupation}
                                  </div>
                                )}
                                {visit.tenant.tenantInfo?.householdSize && (
                                  <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Household:</span> {visit.tenant.tenantInfo.householdSize} person(s)
                                  </div>
                                )}
                                {visit.tenant.tenantInfo?.religion && (
                                  <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Religion:</span> {visit.tenant.tenantInfo.religion}
                                  </div>
                                )}
                                {visit.tenant.tenantInfo?.nationality && (
                                  <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Nationality:</span> {visit.tenant.tenantInfo.nationality}
                                  </div>
                                )}
                                {visit.tenant.tenantInfo?.bio && (
                                  <div className="text-muted-foreground md:col-span-2">
                                    <span className="font-medium text-foreground">Bio:</span> {visit.tenant.tenantInfo.bio}
                                  </div>
                                )}
                              </div>
                              <div className="mt-2">
                                <UserContactDisplay
                                  user={{
                                    email: visit.tenant.email || '',
                                    phone: visit.tenant.phone,
                                    emailVisibility: visit.tenant.emailVisibility,
                                    phoneVisibility: visit.tenant.phoneVisibility,
                                  }}
                                  showContactButton={visit.status === 'accepted'}
                                />
                              </div>
                              {visit.tenant.documents && visit.tenant.documents.length > 0 && (
                                <button
                                  onClick={() => toggleExpandVisit(visit.id)}
                                  className="flex items-center gap-1 text-primary hover:underline mt-2 text-sm"
                                >
                                  <FileText className="h-4 w-4" />
                                  {expandedVisitIds.has(visit.id) ? 'Hide Documents' : `View Documents (${visit.tenant.documents.length})`}
                                  {expandedVisitIds.has(visit.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Documents Section */}
                          {expandedVisitIds.has(visit.id) && visit.tenant?.documents && visit.tenant.documents.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-sm font-medium text-foreground mb-2">Tenant Documents</p>
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

                          {/* Note */}
                          {visit.message && (
                            <div className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                              <span className="font-medium">Note:</span> {visit.message}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                          {visit.status?.toLowerCase() === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAcceptVisit(visit.id)}
                                disabled={isProcessing}
                                className="h-9 px-3 text-xs"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeclineClick(visit.id)}
                                disabled={isProcessing}
                                className="h-9 px-3 text-xs"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {visit.tenant && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openChat(visit.tenant!.id, visit.propertyId)}
                                className="h-9 px-3 text-xs"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
                              </Button>
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
                                    Check In Tenant
                                  </Button>
                                </div>
                              )}
                              {(visit.status?.toLowerCase() === 'completed' || visit.visitVerifiedAt) && (
                                <Badge variant="outline" className="h-9 px-3 text-xs flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  Tenant Verified ✓
                                </Badge>
                              )}
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-9 px-3 text-xs text-muted-foreground"
                          >
                            <Link href={`/properties/${visit.propertyId}`}>
                              Property
                            </Link>
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
          tenantName={selectedVisit.tenant?.name || selectedVisit.tenantName}
          visitDate={formatDate(selectedVisit.requestedDate)}
          visitTime={selectedVisit.requestedTime}
          initialTenantOtp={selectedVisit.tenantOtp}
          landlordOtpVerified={!!selectedVisit.landlordOtpVerifiedAt}
          tenantOtpVerified={!!selectedVisit.tenantOtpVerifiedAt}
          isCompleted={selectedVisit.status?.toLowerCase() === 'completed' || !!selectedVisit.visitVerifiedAt}
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
