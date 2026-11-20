'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Calendar, FileText, Plus, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { useVisits } from '@/features/visits/visit-service';
import { useApplications } from '@/features/applications/application-service';
import { apiClient } from '@/lib/api-client';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { useEffect, useState, useRef } from 'react';
import { LandlordRoute } from '@/features/auth/protected-route';

export default function LandlordDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { visits, fetchVisits } = useVisits(user?.id || '', 'landlord');
  const { applications, fetchApplications } = useApplications(user?.id || '', 'landlord');
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visitsWithProperties, setVisitsWithProperties] = useState<any[]>([]);
  const [applicationsWithProperties, setApplicationsWithProperties] = useState<any[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsLoading(true);
      Promise.all([
        apiClient.properties.getMyProperties()
          .then(setProperties)
          .catch(() => setProperties([])),
        fetchVisits(),
        fetchApplications(),
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user?.id, fetchVisits, fetchApplications]);

  // Fetch property details for visits
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const visitsWithProps = await Promise.all(
        visits.map(async (visit) => {
          try {
            const property = await apiClient.properties.getById(visit.propertyId);
            return { ...visit, property };
          } catch {
            return { ...visit, property: null };
          }
        })
      );
      setVisitsWithProperties(visitsWithProps);
    };

    if (visits.length > 0) {
      fetchPropertyDetails();
    }
  }, [visits]);

  // Fetch property details for applications
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const applicationsWithProps = await Promise.all(
        applications.map(async (app) => {
          try {
            const property = await apiClient.properties.getById(app.propertyId);
            return { ...app, property };
          } catch {
            return { ...app, property: null };
          }
        })
      );
      setApplicationsWithProperties(applicationsWithProps);
    };

    if (applications.length > 0) {
      fetchPropertyDetails();
    }
  }, [applications]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton variant="text" className="h-9 w-48 mb-2" />
            <Skeleton variant="text" className="h-5 w-72" />
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

  const availableProperties = properties.filter(p => p.status === 'available').length;
  const pendingVisits = visits.filter(v => v.status === 'pending').length;
  const pendingApplications = applications.filter(a => a.status === 'pending' || a.status === 'submitted' || a.status === 'under_review').length;

  return (
    <LandlordRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Landlord Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your properties and applications
            </p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Properties</p>
                  <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{properties.length}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Available Units</p>
                  <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{availableProperties}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Visit Requests</p>
                  <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{pendingVisits}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Applications</p>
                  <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{pendingApplications}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6" />
                </div>
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
                <Link href="/landlord/properties">
                  <Building2 className="h-6 w-6 mb-2" />
                  <span>My Properties</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/landlord/visits">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Visit Requests</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/landlord/applications">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Applications</span>
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
                  <Link href="/landlord/visits">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {visitsWithProperties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No visit requests yet
                </div>
              ) : (
                <div className="space-y-4">
                  {visitsWithProperties.slice(0, 3).map((visit) => (
                    <div key={visit.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm mb-1">
                          {visit.property?.title || `Property #${visit.propertyId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {visit.property?.address || 'Unknown location'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
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
                  <Link href="/landlord/applications">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsWithProperties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications yet
                </div>
              ) : (
                <div className="space-y-4">
                  {applicationsWithProperties.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm mb-1">
                          {app.property?.title || `Property #${app.propertyId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.property?.address || 'Unknown location'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
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

        {/* Add Property CTA */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  List a new property
                </h3>
                <p className="text-muted-foreground">
                  Add your property to reach thousands of potential tenants
                </p>
              </div>
              <Button size="lg" asChild>
                <Link href="/landlord/properties">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Property
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
    </LandlordRoute>
  );
}
