'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/shared/toast';
import { apiClient, clearCache } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { ModeratorRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';

export default function ModeratorDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      clearCache();
      const data = await apiClient.admin.getMetrics();
      setMetrics(data);
    } catch (error) {
      showToast('error', 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <ModeratorRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>Moderation Console</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Moderator Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Monitor and moderate platform content to ensure quality and compliance.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{metrics?.properties?.total || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Published
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="text-2xl font-bold">{metrics?.properties?.published || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <span className="text-2xl font-bold">{metrics?.properties?.paused || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                      <span className="text-2xl font-bold">{metrics?.users?.total || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Property Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Review and moderate property listings to ensure they meet platform standards.
                </p>
                <Link href="/moderator/properties">
                  <Button className="w-full">
                    Moderate Properties
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Flagged Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Review user-reported content and take appropriate moderation actions.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Properties Published</p>
                      <p className="text-xs text-muted-foreground">Last 7 days</p>
                    </div>
                  </div>
                  <Badge variant="success">{metrics?.properties?.published || 0}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New Properties</p>
                      <p className="text-xs text-muted-foreground">Last 7 days</p>
                    </div>
                  </div>
                  <Badge variant="default">{metrics?.properties?.total || 0}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pending Reviews</p>
                      <p className="text-xs text-muted-foreground">Awaiting action</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{metrics?.properties?.paused || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ModeratorRoute>
  );
}
