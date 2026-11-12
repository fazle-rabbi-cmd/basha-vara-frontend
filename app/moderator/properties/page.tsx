'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Pause,
  MapPin,
  Calendar,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/shared/toast';
import { apiClient, clearCache } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { PropertyStatus } from '@/types';
import { ModeratorRoute } from '@/features/auth/protected-route';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { PullToRefreshIndicator } from '@/components/shared/pull-to-refresh-indicator';

export default function ModeratorPropertiesPage() {
  const { showToast } = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      clearCache();
      const data = await apiClient.admin.getProperties(
        statusFilter === 'all' ? undefined : (statusFilter as PropertyStatus),
        searchQuery || undefined,
      );
      setProperties(data);
    } catch (error) {
      showToast('error', 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: fetchProperties,
    threshold: 80,
  });

  useEffect(() => {
    fetchProperties();
  }, [statusFilter]);

  const handleUpdateStatus = async (propertyId: string, newStatus: PropertyStatus) => {
    try {
      await apiClient.admin.updatePropertyStatus(propertyId, newStatus);
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p)),
      );
      showToast('success', `Property status updated to ${newStatus}`);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update property status');
    }
  };

  const getStatusBadgeVariant = (status: PropertyStatus): 'error' | 'success' | 'default' | 'secondary' => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'PAUSED':
        return 'secondary';
      case 'DRAFT':
        return 'default';
      case 'RENTED':
        return 'success';
      case 'ARCHIVED':
        return 'error';
      default:
        return 'outline';
    }
  };

  return (
    <ModeratorRoute>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        threshold={80}
      />
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <a href="/moderator/dashboard" className="hover:text-primary transition-colors">
                  Moderator Console
                </a>
                <span>/</span>
                <span className="text-foreground font-medium">Property Moderation</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Property Moderation
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Review and manage property listings to ensure quality and compliance.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProperties} disabled={isLoading} className="hidden sm:flex">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="mb-8 border-border/70 shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, area, or address..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchProperties()}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="PAUSED">Paused</option>
                    <option value="RENTED">Rented</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-border/70 shadow-sm">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No properties found</p>
              </div>
            ) : (
              properties.map((property) => (
                <Card key={property.id} className="border-border/70 shadow-sm overflow-hidden">
                  {property.photos && property.photos.length > 0 && (
                    <div className="relative h-48 bg-muted">
                      <img
                        src={property.photos[0].url}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant={getStatusBadgeVariant(property.status)}>
                          {property.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{property.title}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{property.area}, {property.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(property.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {property.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUpdateStatus(property.id, 'PUBLISHED')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      )}
                      {property.status === 'PUBLISHED' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleUpdateStatus(property.id, 'PAUSED')}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleUpdateStatus(property.id, 'ARCHIVED')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        </>
                      )}
                      {property.status === 'PAUSED' && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUpdateStatus(property.id, 'PUBLISHED')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(`/properties/${property.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </PageLayout>
    </ModeratorRoute>
  );
}
