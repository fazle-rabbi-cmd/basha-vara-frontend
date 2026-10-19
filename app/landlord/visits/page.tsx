'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Check, X, Calendar as CalendarIcon, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useVisits } from '@/features/visits/visit-service';
import { useToast } from '@/components/shared/toast';
import { getPropertyById } from '@/mocks/data';
import { VisitRequest, Property } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';

export default function LandlordVisitsPage() {
  const { user } = useAuth();
  const { visits, fetchVisits, acceptVisit, declineVisit } = useVisits(user?.id || '', 'landlord');
  const { showToast } = useToast();
  const [visitDetails, setVisitDetails] = useState<Array<VisitRequest & { property?: Property }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [visitToDecline, setVisitToDecline] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
  }, [fetchVisits, visits]);

  useEffect(() => {
    if (user?.id) {
      loadVisits();
    }
  }, [user, loadVisits]);

  const handleAcceptVisit = async (visitId: string) => {
    setIsProcessing(true);
    try {
      await acceptVisit(visitId);
      showToast('success', 'Visit request accepted');
      await loadVisits();
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
      await loadVisits();
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Visit Requests</h1>
          <p className="text-muted-foreground">
            Manage incoming property visit requests from tenants
          </p>
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
                          <div className="flex items-center gap-4 text-sm mb-2">
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(visit.requestedDate)}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {visit.requestedTime}
                            </div>
                          </div>
                          {visit.notes && (
                            <p className="text-sm text-muted-foreground">
                              Note: {visit.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={getStatusBadgeVariant(visit.status)}
                      >
                        {visit.status}
                      </Badge>
                      {visit.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcceptVisit(visit.id)}
                            disabled={isProcessing}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {isProcessing ? 'Processing...' : 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineClick(visit.id)}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </>
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
    </PageLayout>
  );
}
