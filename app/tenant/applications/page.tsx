'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, Calendar, DollarSign, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useApplications } from '@/features/applications/application-service';
import { useToast } from '@/components/shared/toast';
import { getPropertyById } from '@/mocks/data';
import { RentalApplication, Property } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';

export default function TenantApplicationsPage() {
  const { user } = useAuth();
  const { applications, fetchApplications, cancelApplication } = useApplications(user?.id || '', 'tenant');
  const { showToast } = useToast();
  const [applicationDetails, setApplicationDetails] = useState<Array<RentalApplication & { property?: Property }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appToCancel, setAppToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
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
      await loadApplications();
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
                      {app.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(app.id)}
                          disabled={isCancelling}
                        >
                          Cancel
                        </Button>
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
    </PageLayout>
  );
}
