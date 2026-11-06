'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useProperties } from '@/features/properties/property-service';
import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { PropertySearchParams, Property } from '@/types';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';

function PropertiesPageContent() {
  const { properties, isLoading, fetchProperties, pagination } = useProperties();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [localSearchParams, setSearchParams] = useState<PropertySearchParams>(() => {
    const area = searchParams.get('area');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    return {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filters: (area || type) ? {
        area: area || undefined,
        propertyType: (type as any) || undefined,
      } : undefined,
      searchQuery: search || undefined,
    };
  });
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input updates to query params
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(prev => {
        const query = searchInput.trim() || undefined;
        if (prev.searchQuery === query) return prev;
        return {
          ...prev,
          page: 1,
          searchQuery: query,
        };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchProperties(localSearchParams);
  }, [localSearchParams, fetchProperties]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      searchQuery: searchInput.trim() || undefined,
    }));
  };

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, [key]: value || undefined },
    }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setSearchParams(prev => ({
      ...prev,
      sortBy: sortBy as 'createdAt' | 'rent' | 'bedrooms' | 'popularity',
      sortOrder: sortOrder as 'asc' | 'desc'
    }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filters: undefined,
      searchQuery: undefined,
    });
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Properties</h1>
          <p className="text-muted-foreground">
            Find your perfect rental home from our extensive listings
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by location, property type..."
                      className="pl-10"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full md:w-auto"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <Select
                    onChange={(e) => handleFilterChange('area', e.target.value)}
                    value={localSearchParams.filters?.area || ''}
                  >
                    <option value="">All Areas</option>
                    <option value="Dhanmondi">Dhanmondi</option>
                    <option value="Gulshan">Gulshan</option>
                    <option value="Banani">Banani</option>
                    <option value="Mirpur">Mirpur</option>
                    <option value="Uttara">Uttara</option>
                    <option value="Mohammadpur">Mohammadpur</option>
                  </Select>
                  <Select
                    onChange={(e) => handleFilterChange('propertyType', e.target.value as any)}
                    value={localSearchParams.filters?.propertyType || ''}
                  >
                    <option value="">Property Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="flat">Flat</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                    <option value="room">Room</option>
                  </Select>
                  <Select
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                    value={localSearchParams.filters?.bedrooms?.toString() || ''}
                  >
                    <option value="">Bedrooms</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </Select>
                  <Select
                    onChange={(e) => handleSortChange(e.target.value)}
                    value={`${localSearchParams.sortBy}-${localSearchParams.sortOrder}`}
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="rent-asc">Price: Low to High</option>
                    <option value="rent-desc">Price: High to Low</option>
                    <option value="popularity-desc">Most Popular</option>
                  </Select>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No properties found matching your criteria</div>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={(pagination.page || 1) === 1}
                    onClick={() => setSearchParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        onClick={() => setSearchParams(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    disabled={(pagination.page || 1) === (pagination.totalPages || 1)}
                    onClick={() => setSearchParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertiesPageContent />
    </Suspense>
  );
}
