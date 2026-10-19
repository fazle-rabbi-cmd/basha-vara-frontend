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
import { getPropertiesByLandlord } from '@/mocks/data';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { useEffect, useState } from 'react';

export default function LandlordDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { visits, fetchVisits } = useVisits(user?.id || '', 'landlord');
  const { applications, fetchApplications } = useApplications(user?.id || '', 'landlord');
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const myProperties = getPropertiesByLandlord(user?.id || '');
    setProperties(myProperties);
    await Promise.all([
      fetchVisits(),
      fetchApplications(),
    ]);
    setIsLoading(false);
  };

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
  const pendingApplications = applications.filter(a => a.status === 'pending').length;

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Properties</p>
                  <p className="text-3xl font-bold text-foreground">{properties.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available</p>
                  <p className="text-3xl font-bold text-foreground">{availableProperties}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
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
                <Users className="h-8 w-8 text-primary" />
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
                  <Link href="/landlord/applications">View All</Link>
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
              <Button
                size="lg"
                onClick={() => showToast('info', 'Property creation form coming soon. This feature requires backend integration.')}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
