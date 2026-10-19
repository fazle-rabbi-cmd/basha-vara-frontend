'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Calendar, FileText, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useVisits } from '@/features/visits/visit-service';
import { useApplications } from '@/features/applications/application-service';
import { useFavourites } from '@/features/favourites/favourite-service';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { useEffect, useState, useCallback } from 'react';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const { visits, fetchVisits } = useVisits(user?.id || '', 'tenant');
  const { applications, fetchApplications } = useApplications(user?.id || '', 'tenant');
  const { favourites, fetchFavourites } = useFavourites(user?.id || '');
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (user?.id) {
      await Promise.all([
        fetchVisits(),
        fetchApplications(),
        fetchFavourites(),
      ]);
      setIsLoading(false);
    }
  }, [user?.id, fetchVisits, fetchApplications, fetchFavourites]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton variant="text" className="h-9 w-64 mb-2" />
            <Skeleton variant="text" className="h-5 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton variant="text" className="h-5 w-24 mb-2" />
                  <Skeleton variant="text" className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  const pendingVisits = visits.filter(v => v.status === 'pending' || v.status === 'confirmed').length;
  const pendingApplications = applications.filter(a => a.status === 'pending' || a.status === 'shortlisted').length;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your rental journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saved Properties</p>
                  <p className="text-3xl font-bold text-foreground">{favourites.length}</p>
                </div>
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Visit Requests</p>
                  <p className="text-3xl font-bold text-foreground">{pendingVisits}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Applications</p>
                  <p className="text-3xl font-bold text-foreground">{pendingApplications}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Browse</p>
                  <p className="text-sm font-semibold text-primary">Find homes</p>
                </div>
                <Search className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/properties">
                  <Search className="h-6 w-6 mb-2" />
                  <span>Browse Properties</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/tenant/favourites">
                  <Heart className="h-6 w-6 mb-2" />
                  <span>View Saved</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/tenant/visits">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>My Visits</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Visit Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Visit Requests</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tenant/visits">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No visit requests yet
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.slice(0, 3).map((visit) => (
                    <div key={visit.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm mb-1">
                          Property #{visit.propertyId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(visit.requestedDate).toLocaleDateString()} at {visit.requestedTime}
                        </p>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(visit.status)}
                      >
                        {visit.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Applications</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tenant/applications">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications yet
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm mb-1">
                          Property #{app.propertyId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(app.status)}
                      >
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Browse CTA */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Ready to find your new home?
                </h3>
                <p className="text-muted-foreground">
                  Browse thousands of properties across Bangladesh
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/properties">
                  <MapPin className="h-5 w-5 mr-2" />
                  Browse Properties
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
