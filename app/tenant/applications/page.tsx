'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, Calendar, DollarSign, ImageOff, Upload, X, MessageSquare, CreditCard, FileSignature } from 'lucide-react';
import { MessagingDialog } from '@/components/features/messaging/messaging-dialog';
import { PaymentDialog } from '@/components/features/payment/payment-dialog';
import { LeaseAgreementDialog } from '@/components/features/lease-agreement/lease-agreement-dialog';
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

export default function TenantApplicationsPage() {
  const { user } = useAuth();
  const { applications, fetchApplications, cancelApplication } = useApplications(user?.id || '', 'tenant');
  const { showToast } = useToast();
  const [applicationDetails, setApplicationDetails] = useState<Array<RentalApplication & { property?: Property & { landlord?: { id: string; fullName: string } } }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appToCancel, setAppToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [messagingDialogOpen, setMessagingDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [leaseAgreementDialogOpen, setLeaseAgreementDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const loadApplications = async () => {
    setIsLoading(true);
    await fetchApplications();
    // Fetch property details for each application
    const details = await Promise.all(
      applications.map(async (a) => {
        try {
          const property = await apiClient.properties.getById(a.propertyId);
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
                fullName: landlordUser.fullName || landlordUser.name,
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
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {app.property?.title}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {app.property?.area}
                          </div>
                          <div className="flex items-center gap-4 text-sm mb-2">
                            <div className="flex items-center text-muted-foreground">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatCurrency(app.property?.rent || 0)}/month
                            </div>
                            {app.moveInDate && (
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                Move-in: {formatDate(app.moveInDate)}
                              </div>
                            )}
                          </div>
                          {app.coverLetter && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {app.coverLetter}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={getStatusBadgeVariant(app.status)}
                      >
                        {app.status}
                      </Badge>
                      {(app.status === 'submitted' || app.status === 'under_review' || app.status === 'shortlisted') && app.property?.landlord && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(app.property!.landlord!.id);
                            setSelectedUserName(app.property!.landlord!.fullName);
                            setSelectedPropertyId(app.propertyId);
                            setMessagingDialogOpen(true);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      )}
                      {(app.status === 'submitted' || app.status === 'under_review' || app.status === 'shortlisted') && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href="/tenant/profile-documents">
                            <Upload className="h-3 w-3 mr-1" />
                            Manage Docs
                          </Link>
                        </Button>
                      )}
                      {app.status === 'submitted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(app.id)}
                          disabled={isCancelling}
                        >
                          Cancel
                        </Button>
                      )}
                      {app.status === 'selected' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setPaymentDialogOpen(true);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Payment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setLeaseAgreementDialogOpen(true);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <FileSignature className="h-3 w-3 mr-1" />
                            Lease Agreement
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${app.propertyId}`}>View Property</Link>
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
          tenantName={user?.fullName || ''}
          landlordName={selectedApplication.property?.landlord?.fullName || ''}
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
