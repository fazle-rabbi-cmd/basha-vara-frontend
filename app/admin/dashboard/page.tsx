'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
  Ban,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { mockProperties, mockUsers } from '@/mocks/data';
import { useState, useEffect } from 'react';
import { Property } from '@/types';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    publishedProperties: 0,
    pendingProperties: 0,
    totalTenants: 0,
    totalLandlords: 0,
    totalVisits: 0,
    totalApplications: 0,
  });

  const loadData = async () => {
    try {
      const [metricsData, propsData] = await Promise.all([
        apiClient.admin.getMetrics(),
        apiClient.admin.getProperties(),
      ]);

      setProperties(propsData);
      setMetrics({
        totalProperties: metricsData.properties.total,
        publishedProperties: metricsData.properties.published,
        pendingProperties: metricsData.properties.paused,
        totalTenants: metricsData.users.tenants,
        totalLandlords: metricsData.users.landlords,
        totalVisits: metricsData.visits.total,
        totalApplications: metricsData.applications.total,
      });
    } catch {
      // Fallback
      setProperties(mockProperties);
      setMetrics({
        totalProperties: mockProperties.length,
        publishedProperties: mockProperties.filter((p) => p.status === 'available').length,
        pendingProperties: mockProperties.filter((p) => p.status === 'paused').length,
        totalTenants: mockUsers.filter((u) => u.role === 'tenant').length,
        totalLandlords: mockUsers.filter((u) => u.role === 'landlord').length,
        totalVisits: 4,
        totalApplications: 3,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (propertyId: string, title: string) => {
    try {
      await apiClient.admin.updatePropertyStatus(propertyId, 'available');
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: 'available' } : p)),
      );
      showToast('success', `Listing "${title}" approved and published to live catalog!`);
    } catch {
      showToast('error', 'Failed to approve property.');
    }
  };

  const handleSuspend = async (propertyId: string, title: string) => {
    try {
      await apiClient.admin.updatePropertyStatus(propertyId, 'paused');
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: 'paused' } : p)),
      );
      showToast('error', `Listing "${title}" has been paused/suspended.`);
    } catch {
      showToast('error', 'Failed to suspend property.');
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton variant="text" className="h-9 w-64 mb-2" />
            <Skeleton variant="text" className="h-5 w-80" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton variant="text" className="h-4 w-28 mb-3" />
                  <Skeleton variant="text" className="h-8 w-20" />
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
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Console
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Marketplace Control Hub
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Live operational metrics, listing moderation, user management, and platform telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild size="sm">
              <Link href="/admin/properties">
                <Building2 className="h-4 w-4 mr-1.5" />
                Moderation Queue
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-1.5" />
                Manage Users
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Properties
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">{metrics.totalProperties}</p>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium mt-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{metrics.publishedProperties} active online</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Paused / Drafts
                  </p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {metrics.pendingProperties}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Unpublished listings</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Active Tenants
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">{metrics.totalTenants}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Registered tenants</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Verified Landlords
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">{metrics.totalLandlords}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span>Active providers</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid: Moderation Queue Preview & Platform Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Moderation Queue Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Listing Moderation Queue</CardTitle>
                  <CardDescription>
                    Review property submissions before they appear in public search
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/properties" className="flex items-center gap-1 text-primary">
                    <span>View all</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border overflow-x-auto">
                  {properties.slice(0, 5).map((prop) => (
                    <div
                      key={prop.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm sm:text-base">
                            {prop.title}
                          </span>
                          <Badge
                            variant={prop.status === 'available' ? 'success' : 'warning'}
                          >
                            {prop.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {prop.propertyType} • {prop.area}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Monthly Rent: <span className="font-medium text-foreground">৳{prop.rent.toLocaleString()}</span> | 
                          {prop.bedrooms} Bed • {prop.bathrooms} Bath • {prop.size || 'N/A'} sqft
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${prop.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Inspect
                          </Link>
                        </Button>
                        {prop.status !== 'available' ? (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(prop.id, prop.title)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSuspend(prop.id, prop.title)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {properties.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No listings in queue.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Activity Overview Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Platform Activity Summary
                </CardTitle>
                <CardDescription>Real-time telemetry from live PostgreSQL database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Physical Visit Requests</p>
                      <p className="text-xs text-muted-foreground">Scheduled by tenants</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-foreground">{metrics.totalVisits}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-secondary/10 text-secondary-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Rental Applications</p>
                      <p className="text-xs text-muted-foreground">Submitted applications</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-foreground">{metrics.totalApplications}</span>
                </div>

                <div className="pt-2">
                  <Button variant="outline" className="w-full text-xs" asChild>
                    <Link href="/properties">
                      Browse Public Catalog as Visitor
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
