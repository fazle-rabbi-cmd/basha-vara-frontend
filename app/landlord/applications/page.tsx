'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, DollarSign, Check, X, Star, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useApplications } from '@/features/applications/application-service';
import { useToast } from '@/components/shared/toast';
import { getPropertyById } from '@/mocks/data';
import { RentalApplication, Property } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';

export default function LandlordApplicationsPage() {
  const { user } = useAuth();
  const { applications, fetchApplications, shortlistApplication, acceptApplication, declineApplication } = useApplications(user?.id || '', 'landlord');
  const { showToast } = useToast();
  const [applicationDetails, setApplicationDetails] = useState<Array<RentalApplication & { property?: Property }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [appToDecline, setAppToDecline] = useState<string | null>(null);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    await fetchApplications();
    const details = applications.map(a => ({
      ...a,
      property: getPropertyById(a.propertyId),
    })).filter(a => a.property);
    setApplicationDetails(details);
    setIsLoading(false);
  }, [fetchApplications, applications]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.id) {
      loadApplications();
    }
  }, [user, loadApplications]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShortlist = async (applicationId: string) => {
    setProcessingAppId(applicationId);
    setProcessingAction('shortlist');
    try {
      await shortlistApplication(applicationId);
      showToast('success', 'Application shortlisted');
      await loadApplications();
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
      await loadApplications();
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
      await loadApplications();
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
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rental Applications</h1>
          <p className="text-muted-foreground">
            Review and manage applications from prospective tenants
          </p>
        </div>

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
          <div className="space-y-4">
            {applicationDetails.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
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
                            {app.proposedRent && (
                              <div className="flex items-center text-muted-foreground">
                                <span>Proposed: {formatCurrency(app.proposedRent)}</span>
                              </div>
                            )}
                          </div>
                          {app.coverLetter && (
                            <div className="bg-muted p-3 rounded-lg mb-2">
                              <p className="text-sm text-muted-foreground">
                                {app.coverLetter}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <Badge
                        variant={getStatusBadgeVariant(app.status)}
                      >
                        {app.status}
                      </Badge>
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShortlist(app.id)}
                            disabled={processingAppId === app.id}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {processingAppId === app.id && processingAction === 'shortlist' ? 'Processing...' : 'Shortlist'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccept(app.id)}
                            disabled={processingAppId === app.id}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {processingAppId === app.id && processingAction === 'accept' ? 'Processing...' : 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineClick(app.id)}
                            disabled={processingAppId === app.id}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}
                      {app.status === 'shortlisted' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccept(app.id)}
                            disabled={processingAppId === app.id}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {processingAppId === app.id && processingAction === 'accept' ? 'Processing...' : 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineClick(app.id)}
                            disabled={processingAppId === app.id}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
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
    </PageLayout>
  );
}
