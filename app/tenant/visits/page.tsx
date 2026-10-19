'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, X, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useVisits } from '@/features/visits/visit-service';
import { useToast } from '@/components/shared/toast';
import { getPropertyById } from '@/mocks/data';
import { VisitRequest, Property } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';

export default function TenantVisitsPage() {
  const { user } = useAuth();
  const { visits, fetchVisits, cancelVisit } = useVisits(user?.id || '', 'tenant');
  const { showToast } = useToast();
  const [visitDetails, setVisitDetails] = useState<Array<VisitRequest & { property?: Property }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [visitToCancel, setVisitToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const loadVisits = useCallback(async () => {
    setIsLoading(true);
    await fetchVisits();
    const details = visits.map(v => ({
      ...v,
      property: getPropertyById(v.propertyId),
    })).filter(v => v.property);
    setVisitDetails(details);
    setIsLoading(false);
  }, [fetchVisits, visits, setVisitDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.id) {
      loadVisits();
    }
  }, [user, loadVisits]); // eslint-disable-line react-hooks/exhaustive-deps

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
      await loadVisits();
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
                      {(visit.status === 'pending' || visit.status === 'confirmed') && (
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
    </PageLayout>
  );
}
