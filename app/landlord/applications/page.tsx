'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, DollarSign, Check, X, Star, ImageOff, Phone, Mail, User, Filter, FileText as FileIcon, Image as LucideImage, ChevronDown, ChevronUp, MessageSquare, CreditCard, FileSignature, Shield, CheckCircle2, Eye } from 'lucide-react';
import { ApplicationPipelineStepper } from '@/components/features/application-pipeline-stepper';
import { UserContactDisplay } from '@/components/shared/user-contact-display';
import { PaymentDialog } from '@/components/features/payment/payment-dialog';
import { LeaseAgreementDialog } from '@/components/features/lease-agreement/lease-agreement-dialog';
import { PoliceVerificationDialog } from '@/components/features/police-verification/police-verification-dialog';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useApplications } from '@/features/applications/application-service';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { RentalApplication, Property } from '@/types';
import { useChatWidget } from '@/components/features/messaging/chat-widget-context';

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
import { formatCurrency } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { LandlordRoute } from '@/features/auth/protected-route';
import { useSearchParams } from 'next/navigation';

function LandlordApplicationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const propertyIdFilter = searchParams.get('propertyId');
  const { applications, fetchApplications, shortlistApplication, reviewApplication, acceptApplication, declineApplication } = useApplications(user?.id || '', 'landlord');
  const { showToast } = useToast();
  const { openChat } = useChatWidget();
  const [applicationDetails, setApplicationDetails] = useState<Array<RentalApplication & { property?: Property; tenant?: TenantInfo }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [appToDecline, setAppToDecline] = useState<string | null>(null);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [filterPropertyTitle, setFilterPropertyTitle] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'under_review' | 'shortlisted' | 'selected'>('all');
  const [expandedAppIds, setExpandedAppIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [leaseAgreementDialogOpen, setLeaseAgreementDialogOpen] = useState(false);
  const [policeVerificationDialogOpen, setPoliceVerificationDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const loadApplications = async () => {
    setIsLoading(true);
    await fetchApplications();

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

    // Fetch property and tenant details for each application
    const details = await Promise.all(
      applications.map(async (a) => {
        try {
          const [property, userProfile, documents] = await Promise.all([
            apiClient.properties.getById(a.propertyId),
            apiClient.users.getPublicProfile(a.tenantId),
            apiClient.userDocuments.getUserDocuments(a.tenantId).catch(() => []),
          ]);
          const tenant: TenantInfo = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            documents,
            tenantInfo: userProfile.tenantInfo,
          };
          return { ...a, property, tenant };
        } catch {
          return { ...a, property: undefined, tenant: undefined };
        }
      })
    );
    const filteredDetails = details.filter(a => a.property);
    const statusFiltered = filteredDetails.filter(a => {
      if (statusFilter === 'all') return true;
      return a.status?.toLowerCase() === statusFilter;
    });
    setApplicationDetails(propertyIdFilter ? statusFiltered.filter(a => a.propertyId === propertyIdFilter) : statusFiltered);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadApplications();
    }
  }, [user?.id, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasLoadedRef.current) {
      loadApplications();
    }
  }, [propertyIdFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update applicationDetails when applications change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      Promise.all(
        applications.map(async (a) => {
          try {
            const [property, user, documents] = await Promise.all([
              apiClient.properties.getById(a.propertyId),
              apiClient.users.getById(a.tenantId) as Promise<UserInfo>,
              apiClient.userDocuments.getUserDocuments(a.tenantId).catch(() => []),
            ]);
            const tenant: TenantInfo = {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              documents,
            };
            return { ...a, property, tenant };
          } catch {
            return { ...a, property: undefined, tenant: undefined };
          }
        })
      ).then((details) => {
        const filteredDetails = details.filter(a => a.property);
        const statusFiltered = filteredDetails.filter(a => {
          if (statusFilter === 'all') return true;
          return a.status?.toLowerCase() === statusFilter;
        });
        setApplicationDetails(propertyIdFilter ? statusFiltered.filter(a => a.propertyId === propertyIdFilter) : statusFiltered);
      });
    }
  }, [applications, propertyIdFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = async (applicationId: string) => {
    setProcessingAppId(applicationId);
    setProcessingAction('review');
    try {
      await reviewApplication(applicationId);
      showToast('success', 'Application marked as under review');
      await fetchApplications();
    } catch (error) {
      showToast('error', 'Failed to update application status');
    } finally {
      setProcessingAppId(null);
      setProcessingAction(null);
    }
  };

  const handleShortlist = async (applicationId: string) => {
    setProcessingAppId(applicationId);
    setProcessingAction('shortlist');
    try {
      await shortlistApplication(applicationId);
      showToast('success', 'Application shortlisted');
      await fetchApplications();
    } catch (error) {
      showToast('error', 'Failed to shortlist application');
    } finally {
      setProcessingAppId(null);
      setProcessingAction(null);
    }
  };

  const handleAccept = async (applicationId: string) => {
    setProcessingAppId(applicationId);
    setProcessingAction('accept');
    try {
      await acceptApplication(applicationId);
      showToast('success', 'Application accepted');
      await fetchApplications();
    } catch (error) {
      showToast('error', 'Failed to accept application');
    } finally {
      setProcessingAppId(null);
      setProcessingAction(null);
    }
  };

  const handleDeclineClick = (applicationId: string) => {
    setAppToDecline(applicationId);
    setDeclineDialogOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!appToDecline) return;

    setProcessingAppId(appToDecline);
    setProcessingAction('decline');
    try {
      await declineApplication(appToDecline);
      showToast('success', 'Application declined');
      await fetchApplications();
    } catch (error) {
      showToast('error', 'Failed to decline application');
    } finally {
      setProcessingAppId(null);
      setProcessingAction(null);
      setDeclineDialogOpen(false);
      setAppToDecline(null);
    }
  };

  const handleImageError = (appId: string) => {
    setImageErrors(prev => new Set([...prev, appId]));
  };

  const toggleExpandApp = (appId: string) => {
    setExpandedAppIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const handleDocumentClick = (document: any) => {
    if (document.mimeType === 'application/pdf') {
      window.open(document.fileUrl, '_blank');
    } else if (document.mimeType?.startsWith('image/')) {
      setPreviewImage(document.fileUrl);
    }
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
              {filterPropertyTitle ? `Applications: ${filterPropertyTitle}` : 'Rental Applications'}
            </h1>
            <p className="text-muted-foreground">
              {filterPropertyTitle
                ? `Applications for this specific property`
                : 'Review and manage applications from prospective tenants'}
            </p>
            {filterPropertyTitle && (
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link href="/landlord/applications">View All Applications</Link>
              </Button>
            )}
          </div>

          {/* Status Filter */}
          {!filterPropertyTitle && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Filter:</span>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({applications.length})
              </Button>
              <Button
                variant={statusFilter === 'submitted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('submitted')}
              >
                Submitted ({applications.filter(a => a.status?.toLowerCase() === 'submitted').length})
              </Button>
              <Button
                variant={statusFilter === 'under_review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('under_review')}
              >
                Under Review ({applications.filter(a => a.status?.toLowerCase() === 'under_review').length})
              </Button>
              <Button
                variant={statusFilter === 'shortlisted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('shortlisted')}
              >
                <Star className="h-3 w-3 mr-1" />
                Shortlisted ({applications.filter(a => a.status?.toLowerCase() === 'shortlisted').length})
              </Button>
              <Button
                variant={statusFilter === 'selected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('selected')}
              >
                Selected ({applications.filter(a => a.status?.toLowerCase() === 'selected').length})
              </Button>
            </div>
          )}

        {applicationDetails.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No applications yet</h2>
              <p className="text-muted-foreground mb-6">
                Applications from interested tenants will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {applicationDetails.map((app) => (
              <Card key={app.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {!imageErrors.has(app.id) && app.property?.photos[0]?.url ? (
                          <img
                            src={app.property.photos[0].url}
                            alt={app.property?.title}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(app.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {app.property?.title}
                          </h3>
                          {app.verifiedVisitId && (
                            <Badge variant="outline" className="text-[11px] bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 gap-1 font-semibold">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Verified Visitor ✓
                            </Badge>
                          )}
                          <Badge
                            variant={getStatusBadgeVariant(app.status)}
                            className="text-xs shrink-0 capitalize"
                          >
                            {app.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{app.property?.area}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{formatCurrency(app.property?.rent || 0)}/mo</span>
                          </div>
                          {app.proposedRent && (
                            <div className="flex items-center gap-1 text-primary">
                              <span>Proposed: {formatCurrency(app.proposedRent)}</span>
                            </div>
                          )}
                        </div>

                        {/* Pipeline Stepper */}
                        <ApplicationPipelineStepper status={app.status} className="my-2 max-w-md" />

                        {app.tenant && (
                          <div className="flex flex-col gap-1 text-xs mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-primary" />
                              <span className="font-medium text-foreground">{app.tenant.name}</span>
                            </div>
                            {app.tenant.tenantInfo && (
                              <div className="space-y-1 pt-1">
                                {app.tenant.tenantInfo.occupation && (
                                  <div className="text-muted-foreground">Occupation: {app.tenant.tenantInfo.occupation}</div>
                                )}
                                {app.tenant.tenantInfo.householdSize && (
                                  <div className="text-muted-foreground">Household: {app.tenant.tenantInfo.householdSize} person(s)</div>
                                )}
                                {app.tenant.tenantInfo.religion && (
                                  <div className="text-muted-foreground">Religion: {app.tenant.tenantInfo.religion}</div>
                                )}
                                {app.tenant.tenantInfo.nationality && (
                                  <div className="text-muted-foreground">Nationality: {app.tenant.tenantInfo.nationality}</div>
                                )}
                                {app.tenant.tenantInfo.bio && (
                                  <div className="text-muted-foreground truncate">{app.tenant.tenantInfo.bio}</div>
                                )}
                              </div>
                            )}
                            <UserContactDisplay
                              user={{
                                email: app.tenant.email || '',
                                phone: app.tenant.phone,
                                emailVisibility: app.tenant.emailVisibility,
                                phoneVisibility: app.tenant.phoneVisibility,
                              }}
                              showContactButton={app.status?.toLowerCase() === 'shortlisted' || app.status?.toLowerCase() === 'selected'}
                            />
                            {(app.status?.toLowerCase() === 'submitted' || app.status?.toLowerCase() === 'under_review') && (
                              <p className="text-[11px] text-muted-foreground italic">
                                🔒 Direct phone and email unlock when applicant is shortlisted.
                              </p>
                            )}
                            {app.tenant.documents && app.tenant.documents.length > 0 && (
                              <button
                                onClick={() => toggleExpandApp(app.id)}
                                className="flex items-center gap-1 text-primary hover:underline mt-1"
                              >
                                <FileText className="h-3 w-3" />
                                {expandedAppIds.has(app.id) ? 'Hide Documents' : `View Documents (${app.tenant.documents.length})`}
                                {expandedAppIds.has(app.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        )}

                        {expandedAppIds.has(app.id) && app.tenant?.documents && app.tenant.documents.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-foreground mb-2">Tenant Documents</p>
                            <div className="space-y-2">
                              {app.tenant.documents.map((doc: any) => (
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
                        {app.coverLetter && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {app.coverLetter}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 sm:border-l sm:pl-3">
                      {app.status?.toLowerCase() === 'submitted' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReview(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShortlist(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs text-amber-700 dark:text-amber-300"
                          >
                            <Star className="h-3.5 w-3.5 mr-1" />
                            Shortlist
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccept(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs text-green-700 dark:text-green-300"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Select
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineClick(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs text-red-600"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                      {app.status?.toLowerCase() === 'under_review' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShortlist(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs text-amber-700 dark:text-amber-300"
                          >
                            <Star className="h-3.5 w-3.5 mr-1" />
                            Shortlist
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccept(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs text-green-700 dark:text-green-300"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Select
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineClick(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs text-red-600"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                      {app.status?.toLowerCase() === 'shortlisted' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Select Tenant
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineClick(app.id)}
                            disabled={processingAppId === app.id}
                            className="h-8 px-2.5 text-xs text-red-600"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                      {app.status?.toLowerCase() === 'selected' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setLeaseAgreementDialogOpen(true);
                            }}
                            className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <FileSignature className="h-3.5 w-3.5 mr-1" />
                            Lease
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setPoliceVerificationDialogOpen(true);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            Police Verify
                          </Button>
                        </>
                      )}
                      {app.tenant && (app.status === 'submitted' || app.status === 'shortlisted') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openChat(app.tenant!.id, app.propertyId)}
                          className="h-8 px-3 text-xs"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 px-3 text-xs text-muted-foreground"
                      >
                        <Link href={`/properties/${app.propertyId}`}>
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
            <DialogTitle>Decline Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this rental application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineDialogOpen(false)}
              disabled={processingAppId === appToDecline}
            >
              Keep Application
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDecline}
              disabled={processingAppId === appToDecline}
            >
              {processingAppId === appToDecline ? 'Declining...' : 'Decline Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Document preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {selectedApplication && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          applicationId={selectedApplication.id}
          propertyTitle={selectedApplication.property?.title}
          rentAmount={selectedApplication.property?.rent || 0}
          depositAmount={selectedApplication.property?.deposit || 0}
          userRole="landlord"
          onSuccess={() => {
            loadApplications();
          }}
        />
      )}

      {/* Lease Agreement Dialog */}
      {selectedApplication && (
        <LeaseAgreementDialog
          open={leaseAgreementDialogOpen}
          onOpenChange={setLeaseAgreementDialogOpen}
          applicationId={selectedApplication.id}
          propertyTitle={selectedApplication.property?.title}
          rentAmount={selectedApplication.property?.rent || 0}
          depositAmount={selectedApplication.property?.deposit || 0}
          tenantName={selectedApplication.tenant?.name || ''}
          landlordName={user?.name || ''}
          userRole="landlord"
          onSuccess={() => {
            loadApplications();
          }}
        />
      )}

      {/* Police Verification Dialog */}
      {selectedApplication && (
        <PoliceVerificationDialog
          open={policeVerificationDialogOpen}
          onOpenChange={setPoliceVerificationDialogOpen}
          tenantId={selectedApplication.tenantId}
          propertyId={selectedApplication.propertyId}
          applicationId={selectedApplication.id}
          tenantName={selectedApplication.tenant?.name || ''}
          propertyTitle={selectedApplication.property?.title || ''}
          onSuccess={() => {
            loadApplications();
          }}
        />
      )}
    </PageLayout>
    </LandlordRoute>
  );
}

export default function LandlordApplicationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LandlordApplicationsContent />
    </Suspense>
  );
}
