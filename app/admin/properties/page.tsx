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
  CheckCircle2,
  Ban,
  Eye,
  Home,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { mockProperties } from '@/mocks/data';
import { useState, useEffect, useMemo } from 'react';
import { Property, ListingStatus } from '@/types';

export default function AdminPropertiesModerationPage() {
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.admin.getProperties();
      setProperties(data);
    } catch {
      setProperties(mockProperties);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const matchesSearch =
        prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true : prop.status === statusFilter;

      const matchesType =
        selectedType === 'all' ? true : prop.propertyType === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [properties, searchQuery, statusFilter, selectedType]);

  const handleApprove = async (id: string, title: string) => {
    try {
      await apiClient.admin.updatePropertyStatus(id, 'available');
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'available' as ListingStatus } : p)),
      );
      showToast('success', `Listing "${title}" approved & published to live catalog.`);
    } catch {
      showToast('error', 'Failed to approve listing.');
    }
  };

  const handleSuspend = async (id: string, title: string) => {
    try {
      await apiClient.admin.updatePropertyStatus(id, 'paused');
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'paused' as ListingStatus } : p)),
      );
      showToast('error', `Listing "${title}" has been suspended/paused.`);
    } catch {
      showToast('error', 'Failed to suspend listing.');
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb / Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/admin/dashboard" className="hover:text-primary transition-colors">
                Admin Console
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Property Moderation</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Property Moderation & Catalog
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Audit listings, verify safety and amenity representations, and govern live listings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchProperties} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="px-3 py-1 text-sm">
              Total Catalog: {properties.length}
            </Badge>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 border-border/70 shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, neighborhood (e.g. Dhanmondi, Gulshan)..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Moderation Statuses</option>
                  <option value="available">Available (Live)</option>
                  <option value="paused">Paused / Pending</option>
                  <option value="rented">Marked as Rented</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Property Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="flat">Flat</option>
                  <option value="house">House</option>
                  <option value="room">Room</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-24 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-semibold text-foreground">No listings match criteria</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search terms or filter selections.
              </p>
            </Card>
          ) : (
            filteredProperties.map((prop) => (
              <Card
                key={prop.id}
                className="overflow-hidden hover:border-primary/40 transition-all shadow-sm"
              >
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Property Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-20 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative border border-border">
                      {prop.photos && prop.photos.length > 0 ? (
                        <img
                          src={prop.photos[0].url}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Home className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-base sm:text-lg">
                          {prop.title}
                        </h3>
                        <Badge
                          variant={
                            prop.status === 'available'
                              ? 'success'
                              : prop.status === 'paused'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {prop.status}
                        </Badge>
                        <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {prop.propertyType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {prop.address}, {prop.area} • Floor {prop.floor || 'N/A'} of {prop.totalFloors || 'N/A'}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-medium text-foreground pt-1">
                        <span>Rent: ৳{prop.rent.toLocaleString()}/mo</span>
                        <span>Deposit: ৳{prop.deposit?.toLocaleString() || '0'}</span>
                        <span>{prop.bedrooms} Bed</span>
                        <span>{prop.bathrooms} Bath</span>
                        <span>{prop.size || 'N/A'} sqft</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${prop.id}`}>
                        <Eye className="h-4 w-4 mr-1.5" />
                        Preview
                      </Link>
                    </Button>

                    {prop.status === 'available' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSuspend(prop.id, prop.title)}
                      >
                        <Ban className="h-4 w-4 mr-1.5" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(prop.id, prop.title)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
