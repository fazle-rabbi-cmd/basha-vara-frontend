'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X, FilterX } from 'lucide-react';
import { useProperties } from '@/features/properties/property-service';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { Amenity, PropertySearchFilters, PropertySearchParams } from '@/types';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { apiClient } from '@/lib/api-client';

const PropertyCard = lazy(() => import('@/components/shared/property-card').then(m => ({ default: m.PropertyCard })));

const amenityCategories: Amenity['category'][] = ['essential', 'safety', 'utility', 'luxury'];

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
        propertyType: (type as PropertySearchFilters['propertyType']) || undefined,
      } : undefined,
      searchQuery: search || undefined,
    };
  });
  const [draftFilters, setDraftFilters] = useState<PropertySearchFilters>(() => ({
    ...localSearchParams.filters,
    amenities: localSearchParams.filters?.amenities ?? [],
  }));
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.properties.getAmenities()
      .then((items) => {
        if (active) setAmenities(items);
      })
      .finally(() => {
        if (active) setAmenitiesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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

  const handleFilterChange = <K extends keyof PropertySearchFilters>(
    key: K,
    value: PropertySearchFilters[K] | undefined,
  ) => {
    setDraftFilters((previous) => ({ ...previous, [key]: value }));
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setDraftFilters((previous) => {
      const selected = new Set(previous.amenities ?? []);
      if (checked) selected.add(amenityId);
      else selected.delete(amenityId);
      return { ...previous, amenities: Array.from(selected) };
    });
  };

  const handleApplyFilters = () => {
    if (
      draftFilters.minRent !== undefined &&
      draftFilters.maxRent !== undefined &&
      draftFilters.minRent > draftFilters.maxRent
    ) {
      return;
    }

    const filters = Object.fromEntries(
      Object.entries(draftFilters).filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : value !== undefined && value !== '',
      ),
    ) as PropertySearchFilters;

    setSearchParams((previous) => ({
      ...previous,
      page: 1,
      filters: Object.keys(filters).length ? filters : undefined,
    }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      sortBy: sortBy as PropertySearchParams['sortBy'],
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
    setDraftFilters({ amenities: [] });
  };

  const activeFilterCount = Object.values(localSearchParams.filters ?? {}).reduce(
    (count, value) => count + (Array.isArray(value) ? Number(value.length > 0) : Number(value !== undefined)),
    0,
  );
  const priceRangeInvalid = draftFilters.minRent !== undefined &&
    draftFilters.maxRent !== undefined &&
    draftFilters.minRent > draftFilters.maxRent;

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

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      <FilterX className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Area */}
                  <div className="space-y-2">
                    <label htmlFor="filter-area" className="text-sm font-medium">Area</label>
                    <Input
                      id="filter-area"
                      placeholder="e.g. Dhanmondi"
                      value={draftFilters.area ?? ''}
                      onChange={(event) => handleFilterChange('area', event.target.value || undefined)}
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label htmlFor="filter-city" className="text-sm font-medium">City</label>
                    <Input
                      id="filter-city"
                      placeholder="e.g. Dhaka"
                      value={draftFilters.city ?? ''}
                      onChange={(event) => handleFilterChange('city', event.target.value || undefined)}
                    />
                  </div>

                  {/* Property Type */}
                  <div className="space-y-2">
                    <label htmlFor="property-type" className="text-sm font-medium">Property type</label>
                    <Select
                      id="property-type"
                      value={draftFilters.propertyType ?? ''}
                      onChange={(event) => handleFilterChange('propertyType', (event.target.value || undefined) as PropertySearchFilters['propertyType'])}
                    >
                      <option value="">Any type</option>
                      <option value="apartment">Apartment</option>
                      <option value="flat">Flat</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="room">Room</option>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range (BDT)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Min"
                        value={draftFilters.minRent ?? ''}
                        onChange={(event) => handleFilterChange('minRent', event.target.value ? Number(event.target.value) : undefined)}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Max"
                        value={draftFilters.maxRent ?? ''}
                        onChange={(event) => handleFilterChange('maxRent', event.target.value ? Number(event.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div className="space-y-2">
                    <label htmlFor="bedrooms" className="text-sm font-medium">Bedrooms</label>
                    <Select
                      id="bedrooms"
                      value={draftFilters.bedrooms?.toString() ?? ''}
                      onChange={(event) => handleFilterChange('bedrooms', event.target.value ? Number(event.target.value) : undefined)}
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}{count === 5 ? '+' : ''}</option>)}
                    </Select>
                  </div>

                  {/* Bathrooms */}
                  <div className="space-y-2">
                    <label htmlFor="bathrooms" className="text-sm font-medium">Bathrooms</label>
                    <Select
                      id="bathrooms"
                      value={draftFilters.bathrooms?.toString() ?? ''}
                      onChange={(event) => handleFilterChange('bathrooms', event.target.value ? Number(event.target.value) : undefined)}
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}{count === 4 ? '+' : ''}</option>)}
                    </Select>
                  </div>

                  {/* Amenities */}
                  <section className="space-y-3" aria-labelledby="amenity-filter-title">
                    <h2 id="amenity-filter-title" className="text-sm font-semibold">Amenities</h2>
                    {amenitiesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading amenities...</p>
                    ) : amenities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Amenities are unavailable right now.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {amenities.map((amenity) => (
                          <label key={amenity.id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={draftFilters.amenities?.includes(amenity.id) ?? false}
                              onChange={(event) => handleAmenityChange(amenity.id, event.target.checked)}
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{amenity.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </section>

                  {priceRangeInvalid && (
                    <p className="text-sm text-destructive" role="alert">Minimum rent must not exceed maximum rent.</p>
                  )}

                  <Button onClick={handleApplyFilters} disabled={priceRangeInvalid} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <form onSubmit={handleSearch} className="flex gap-4">
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
                  <Button type="submit">Search</Button>
                </form>
              </CardContent>
            </Card>

            {/* Results Header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {isLoading ? 'Updating results...' : `${pagination.total} properties found`}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sort-properties" className="whitespace-nowrap text-sm text-muted-foreground">Sort by</label>
                <Select
                  id="sort-properties"
                  value={`${localSearchParams.sortBy}-${localSearchParams.sortOrder}`}
                  onChange={(event) => handleSortChange(event.target.value)}
                  className="w-full sm:w-56"
                >
                  <option value="createdAt-desc">Newest first</option>
                  <option value="createdAt-asc">Oldest first</option>
                  <option value="rent-asc">Rent: low to high</option>
                  <option value="rent-desc">Rent: high to low</option>
                  <option value="bedrooms-desc">Most bedrooms</option>
                  <option value="viewCount-desc">Most viewed</option>
                  <option value="favouriteCount-desc">Most saved</option>
                </Select>
              </div>
            </div>

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
                    <Suspense key={property.id} fallback={<PropertyCardSkeleton />}>
                      <PropertyCard property={property} />
                    </Suspense>
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
        </div>
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
