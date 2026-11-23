'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, Calendar, DollarSign, ImageOff, Upload, X, MessageSquare, CreditCard, FileSignature, Pencil, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { ApplicationPipelineStepper } from '@/components/features/application-pipeline-stepper';
import { PaymentDialog } from '@/components/features/payment/payment-dialog';
import { LeaseAgreementDialog } from '@/components/features/lease-agreement/lease-agreement-dialog';
import { EditApplicationDialog } from '@/components/features/edit-application-dialog';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useApplications } from '@/features/applications/application-service';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { RentalApplication, Property } from '@/types';
import { useEffect, useState, useRef } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { TenantRoute } from '@/features/auth/protected-route';
import { useChatWidget } from '@/components/features/messaging/chat-widget-context';

export default function TenantApplicationsPage() {
  const { user } = useAuth();
  const { applications, fetchApplications, cancelApplication } = useApplications(user?.id || '', 'tenant');
  const { showToast } = useToast();
  const { openChat } = useChatWidget();
  const [applicationDetails, setApplicationDetails] = useState<Array<RentalApplication & { property?: Property & { landlord?: any } }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appToCancel, setAppToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [leaseAgreementDialogOpen, setLeaseAgreementDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [applicationToEdit, setApplicationToEdit] = useState<RentalApplication | null>(null);
  const [applicationToEditDetails, setApplicationToEditDetails] = useState<any>(null);

  const loadApplications = async () => {
    setIsLoading(true);
    await fetchApplications();
    // Fetch property details for each application
    const details = await Promise.all(
      applications.map(async (a) => {
        try {
          const property = await apiClient.properties.getById(a.propertyId);
          // Try to get landlord public profile
          let landlord = null;
          try {
            const landlordProfile = await apiClient.users.getPublicProfile(property.landlordId);
            landlord = landlordProfile;
          } catch {
            landlord = null;
          }
          return { ...a, property: { ...property, landlord } };
        } catch {
          return { ...a, property: undefined };
        }
      })
    );
    setApplicationDetails(details.filter(a => a.property));
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadApplications();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update applicationDetails when applications change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      Promise.all(
        applications.map(async (a) => {
          try {
            const property = await apiClient.properties.getById(a.propertyId);
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
            return { ...a, property: { ...property, landlord } };
          } catch {
            return { ...a, property: undefined };
          }
        })
      ).then((details) => {
        setApplicationDetails(details.filter(a => a.property));
      });
    }
  }, [applications]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelClick = (applicationId: string) => {
    setAppToCancel(applicationId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appToCancel) return;

    setIsCancelling(true);
    try {
      await cancelApplication(appToCancel);
      showToast('success', 'Application cancelled successfully');
      await fetchApplications();
    } catch (error) {
      showToast('error', 'Failed to cancel application');
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setAppToCancel(null);
    }
  };

  const handleImageError = (appId: string) => {
    setImageErrors(prev => new Set([...prev, appId]));
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
            <h1 className="text-3xl font-bold text-foreground mb-2">My Applications</h1>
            <p className="text-muted-foreground">
              Track your rental applications and their status
            </p>
          </div>

        {applicationDetails.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No applications yet</h2>
              <p className="text-muted-foreground mb-6">
                Browse properties and submit applications to rent
              </p>
              <Button asChild>
                <Link href="/properties">Browse Properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applicationDetails.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {!imageErrors.has(app.id) && app.property?.photos[0]?.url ? (
                            <img
                              src={app.property.photos[0].url}
                              alt={app.property?.title}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(app.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageOff className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground text-base truncate">
                              {app.property?.title}
                            </h3>
                            {app.verifiedVisitId && (
                              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                Verified Visitor
                              </Badge>
                            )}
                            <Badge
                              variant={getStatusBadgeVariant(app.status)}
                              className="text-xs shrink-0 capitalize"
                            >
                              {app.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4 mr-1 shrink-0" />
                            <span className="truncate">{app.property?.area}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs mb-3">
                            <div className="font-medium text-foreground">
                              {formatCurrency(app.property?.rent || 0)}/month
                            </div>
                            {app.proposedRent && app.proposedRent !== app.property?.rent && (
                              <div className="text-primary font-medium">
                                Proposed: {formatCurrency(app.proposedRent)}/mo
                              </div>
                            )}
                            {app.moveInDate && (
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                Move-in: {formatDate(app.moveInDate)}
                              </div>
                            )}
                          </div>

                          {/* Visual Application Stepper */}
                          <ApplicationPipelineStepper status={app.status} className="my-3 max-w-xl" />

                          {/* Contextual Pipeline Highlights */}
                          {app.status?.toLowerCase() === 'shortlisted' && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 my-2">
                              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                              <span>
                                <strong>Shortlisted!</strong> Landlord has shortlisted your application. Direct contact info has been unlocked for your interview.
                              </span>
                            </div>
                          )}

                          {app.status?.toLowerCase() === 'selected' && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-800 dark:text-green-200 flex items-center justify-between gap-3 my-2">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-green-600 shrink-0" />
                                <span>
                                  <strong>Congratulations!</strong> You have been selected as the new tenant. Proceed with lease signing and escrow deposit.
                                </span>
                              </div>
                            </div>
                          )}

                          {app.coverNote && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2 bg-muted/40 p-2 rounded-md">
                              <span className="font-medium text-foreground">Cover Note:</span> {app.coverNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(app.status?.toLowerCase() === 'submitted' || app.status?.toLowerCase() === 'under_review' || app.status?.toLowerCase() === 'shortlisted') && app.property?.landlord && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openChat(app.property!.landlord!.id, app.propertyId)}
                          className="h-8 px-3 text-xs"
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          Message
                        </Button>
                      )}
                      {(app.status?.toLowerCase() === 'submitted' || app.status?.toLowerCase() === 'under_review') && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 px-3 text-xs"
                        >
                          <Link href="/tenant/profile-documents">
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            Manage Docs
                          </Link>
                        </Button>
                      )}
                      {app.status?.toLowerCase() === 'submitted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setApplicationToEdit(app);
                            setApplicationToEditDetails(applicationDetails.find(a => a.id === app.id) || null);
                            setEditDialogOpen(true);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                      {(app.status?.toLowerCase() === 'submitted' || app.status?.toLowerCase() === 'under_review' || app.status?.toLowerCase() === 'shortlisted') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(app.id)}
                          disabled={isCancelling}
                          className="h-8 px-3 text-xs"
                        >
                          Withdraw
                        </Button>
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
                            Review Lease
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(app);
                              setPaymentDialogOpen(true);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Escrow Deposit
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs">
                        <Link href={`/properties/${app.propertyId}`}>Property</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Application Dialog */}
      <EditApplicationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        application={applicationToEdit}
        propertyRent={applicationToEditDetails?.property?.rent || 0}
        propertyTitle={applicationToEditDetails?.property?.title}
        onSuccess={() => {
          loadApplications();
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this rental application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Application
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Application'}
            </Button>
          </DialogFooter>
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
          userRole="tenant"
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
          tenantName={user?.name || ''}
          landlordName={selectedApplication.property?.landlord?.fullName || selectedApplication.property?.landlord?.name || ''}
          userRole="tenant"
          onSuccess={() => {
            loadApplications();
          }}
        />
      )}
    </PageLayout>
    </TenantRoute>
  );
}
