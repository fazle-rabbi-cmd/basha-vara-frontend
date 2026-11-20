'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RangeSlider } from '@/components/shared/range-slider';
import { Search, SlidersHorizontal, X, FilterX, Map, List, MapPin, Building2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useProperties } from '@/features/properties/property-service';
import { useFavourites } from '@/features/favourites/favourite-service';
import { useAuth } from '@/features/auth/auth-context';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { Amenity, PropertySearchFilters, PropertySearchParams } from '@/types';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { apiClient } from '@/lib/api-client';
import { usePlatform } from '@/lib/platform/platform-context';
import { formatCurrency } from '@/lib/utils';

const PropertyCard = lazy(() => import('@/components/shared/property-card').then(m => ({ default: m.PropertyCard })));
const PropertyMap = lazy(() => import('@/components/shared/property-map').then(m => ({ default: m.PropertyMap })));

const amenityCategories: Amenity['category'][] = ['essential', 'safety', 'utility', 'luxury'];

function PropertiesPageContent() {
  const { properties, isLoading, fetchProperties, pagination } = useProperties();
  const { user, isAuthenticated } = useAuth();
  const { toggleFavourite, isFavourited } = useFavourites(user?.id || '', user?.role || '');
  const { isMobile, triggerHaptic } = usePlatform();
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rentRange, setRentRange] = useState({ min: 0, max: 500000 });

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

  // Calculate rent range from properties
  useEffect(() => {
    if (properties.length > 0) {
      const rents = properties.map(p => p.rent);
      const minRent = Math.min(...rents);
      const maxRent = Math.max(...rents);
      setRentRange({
        min: Math.floor(minRent / 1000) * 1000, // Round down to nearest 1000
        max: Math.ceil(maxRent / 1000) * 1000,   // Round up to nearest 1000
      });
    }
  }, [properties]);

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

  const minRentOutOfRange = draftFilters.minRent !== undefined &&
    (draftFilters.minRent < rentRange.min || draftFilters.minRent > rentRange.max);

  const maxRentOutOfRange = draftFilters.maxRent !== undefined &&
    (draftFilters.maxRent < rentRange.min || draftFilters.maxRent > rentRange.max);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Browse Properties</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Find your perfect rental home from our extensive listings
          </p>
        </div>

        {!isMobile ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            {isFilterOpen && (
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
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Price Range (৳)</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={rentRange.min}
                            max={rentRange.max}
                            step="1000"
                            placeholder={`Min (${formatCurrency(rentRange.min)})`}
                            value={draftFilters.minRent ?? ''}
                            onChange={(event) => handleFilterChange('minRent', event.target.value ? Number(event.target.value) : undefined)}
                            className={minRentOutOfRange ? 'border-destructive' : ''}
                          />
                          <Input
                            type="number"
                            min={rentRange.min}
                            max={rentRange.max}
                            step="1000"
                            placeholder={`Max (${formatCurrency(rentRange.max)})`}
                            value={draftFilters.maxRent ?? ''}
                            onChange={(event) => handleFilterChange('maxRent', event.target.value ? Number(event.target.value) : undefined)}
                            className={maxRentOutOfRange ? 'border-destructive' : ''}
                          />
                        </div>
                        {(minRentOutOfRange || maxRentOutOfRange) && (
                          <p className="text-xs text-destructive">
                            Price must be between {formatCurrency(rentRange.min)} and {formatCurrency(rentRange.max)}
                          </p>
                        )}
                        <RangeSlider
                          min={rentRange.min}
                          max={rentRange.max}
                          step={1000}
                          value={{
                            min: draftFilters.minRent ?? rentRange.min,
                            max: draftFilters.maxRent ?? rentRange.max,
                          }}
                          onChange={(range) => {
                            setDraftFilters(prev => ({
                              ...prev,
                              minRent: range.min === rentRange.min ? undefined : range.min,
                              maxRent: range.max === rentRange.max ? undefined : range.max,
                            }));
                          }}
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

                    {/* Available By */}
                    <div className="space-y-2">
                      <label htmlFor="availableBy" className="text-sm font-medium">Available By</label>
                      <Input
                        id="availableBy"
                        type="date"
                        value={draftFilters.availableBy ?? ''}
                        onChange={(event) => handleFilterChange('availableBy', event.target.value || undefined)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Show properties available on or before this date
                      </p>
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
            )}

            {/* Main Content - Desktop */}
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
                    <Button
                      type="button"
                      variant={isFilterOpen ? "default" : "outline"}
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-2 bg-primary-foreground text-primary text-xs px-2 py-0.5 rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
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
                        <PropertyCard
                          property={property}
                          onToggleFavourite={isAuthenticated && user?.role === 'tenant' ? toggleFavourite : undefined}
                          isFavourited={isFavourited(property.id)}
                        />
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
        ) : (
          <div className="relative pb-24">
            {/* Search Bar - Mobile */}
            <div className="mb-3 flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search location, area..."
                  className="pl-10 pr-4 h-11 rounded-2xl bg-muted/40 border-border/80 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </form>
              <Button
                type="button"
                variant={activeFilterCount > 0 ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  triggerHaptic();
                  setIsFilterOpen(true);
                }}
                className="relative h-11 w-11 rounded-2xl shrink-0"
                aria-label="Open filter options"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Quick Filter Chips Rail - Mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 text-xs">
              {[
                { label: 'All', active: !localSearchParams.filters?.propertyType && !localSearchParams.filters?.area, onClick: handleClearFilters },
                { label: 'Apartment', active: localSearchParams.filters?.propertyType === 'apartment', onClick: () => {
                  triggerHaptic();
                  const nextType = localSearchParams.filters?.propertyType === 'apartment' ? undefined : 'apartment';
                  handleFilterChange('propertyType', nextType as any);
                  setSearchParams(prev => ({ ...prev, page: 1, filters: { ...prev.filters, propertyType: nextType as any } }));
                }},
                { label: 'Flat', active: localSearchParams.filters?.propertyType === 'flat', onClick: () => {
                  triggerHaptic();
                  const nextType = localSearchParams.filters?.propertyType === 'flat' ? undefined : 'flat';
                  handleFilterChange('propertyType', nextType as any);
                  setSearchParams(prev => ({ ...prev, page: 1, filters: { ...prev.filters, propertyType: nextType as any } }));
                }},
                { label: 'Dhanmondi', active: localSearchParams.filters?.area === 'Dhanmondi', onClick: () => {
                  triggerHaptic();
                  const nextArea = localSearchParams.filters?.area === 'Dhanmondi' ? undefined : 'Dhanmondi';
                  handleFilterChange('area', nextArea);
                  setSearchParams(prev => ({ ...prev, page: 1, filters: { ...prev.filters, area: nextArea } }));
                }},
                { label: 'Gulshan', active: localSearchParams.filters?.area === 'Gulshan', onClick: () => {
                  triggerHaptic();
                  const nextArea = localSearchParams.filters?.area === 'Gulshan' ? undefined : 'Gulshan';
                  handleFilterChange('area', nextArea);
                  setSearchParams(prev => ({ ...prev, page: 1, filters: { ...prev.filters, area: nextArea } }));
                }},
                { label: 'Uttara', active: localSearchParams.filters?.area === 'Uttara', onClick: () => {
                  triggerHaptic();
                  const nextArea = localSearchParams.filters?.area === 'Uttara' ? undefined : 'Uttara';
                  handleFilterChange('area', nextArea);
                  setSearchParams(prev => ({ ...prev, page: 1, filters: { ...prev.filters, area: nextArea } }));
                }},
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onClick}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full font-medium transition-all active:scale-95 ${
                    chip.active
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'bg-muted/70 text-foreground hover:bg-muted border border-border/60'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Filter Bottom-Sheet Dialog - Mobile */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogContent className="space-y-4 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-lg font-bold">Search Filters</DialogTitle>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs text-muted-foreground h-8 px-2">
                        <FilterX className="h-3.5 w-3.5 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </DialogHeader>

                  <div className="space-y-4">
                    {/* Area */}
                    <div className="space-y-2">
                      <label htmlFor="filter-area-mobile" className="text-sm font-medium">Area</label>
                      <Input
                        id="filter-area-mobile"
                        placeholder="e.g. Dhanmondi"
                        value={draftFilters.area ?? ''}
                        onChange={(event) => handleFilterChange('area', event.target.value || undefined)}
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <label htmlFor="filter-city-mobile" className="text-sm font-medium">City</label>
                      <Input
                        id="filter-city-mobile"
                        placeholder="e.g. Dhaka"
                        value={draftFilters.city ?? ''}
                        onChange={(event) => handleFilterChange('city', event.target.value || undefined)}
                      />
                    </div>

                    {/* Property Type */}
                    <div className="space-y-2">
                      <label htmlFor="property-type-mobile" className="text-sm font-medium">Property type</label>
                      <Select
                        id="property-type-mobile"
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
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Price Range (৳)</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={rentRange.min}
                            max={rentRange.max}
                            step="1000"
                            placeholder={`Min (${formatCurrency(rentRange.min)})`}
                            value={draftFilters.minRent ?? ''}
                            onChange={(event) => handleFilterChange('minRent', event.target.value ? Number(event.target.value) : undefined)}
                            className={minRentOutOfRange ? 'border-destructive' : ''}
                          />
                          <Input
                            type="number"
                            min={rentRange.min}
                            max={rentRange.max}
                            step="1000"
                            placeholder={`Max (${formatCurrency(rentRange.max)})`}
                            value={draftFilters.maxRent ?? ''}
                            onChange={(event) => handleFilterChange('maxRent', event.target.value ? Number(event.target.value) : undefined)}
                            className={maxRentOutOfRange ? 'border-destructive' : ''}
                          />
                        </div>
                        {(minRentOutOfRange || maxRentOutOfRange) && (
                          <p className="text-xs text-destructive">
                            Price must be between {formatCurrency(rentRange.min)} and {formatCurrency(rentRange.max)}
                          </p>
                        )}
                        <RangeSlider
                          min={rentRange.min}
                          max={rentRange.max}
                          step={1000}
                          value={{
                            min: draftFilters.minRent ?? rentRange.min,
                            max: draftFilters.maxRent ?? rentRange.max,
                          }}
                          onChange={(range) => {
                            setDraftFilters(prev => ({
                              ...prev,
                              minRent: range.min === rentRange.min ? undefined : range.min,
                              maxRent: range.max === rentRange.max ? undefined : range.max,
                            }));
                          }}
                        />
                      </div>
                    </div>

                    {/* Bedrooms */}
                    <div className="space-y-2">
                      <label htmlFor="bedrooms-mobile" className="text-sm font-medium">Bedrooms</label>
                      <Select
                        id="bedrooms-mobile"
                        value={draftFilters.bedrooms?.toString() ?? ''}
                        onChange={(event) => handleFilterChange('bedrooms', event.target.value ? Number(event.target.value) : undefined)}
                      >
                        <option value="">Any</option>
                        {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}{count === 5 ? '+' : ''}</option>)}
                      </Select>
                    </div>

                    {/* Bathrooms */}
                    <div className="space-y-2">
                      <label htmlFor="bathrooms-mobile" className="text-sm font-medium">Bathrooms</label>
                      <Select
                        id="bathrooms-mobile"
                        value={draftFilters.bathrooms?.toString() ?? ''}
                        onChange={(event) => handleFilterChange('bathrooms', event.target.value ? Number(event.target.value) : undefined)}
                      >
                        <option value="">Any</option>
                        {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}{count === 4 ? '+' : ''}</option>)}
                      </Select>
                    </div>

                    {/* Available By */}
                    <div className="space-y-2">
                      <label htmlFor="availableBy-mobile" className="text-sm font-medium">Available By</label>
                      <Input
                        id="availableBy-mobile"
                        type="date"
                        value={draftFilters.availableBy ?? ''}
                        onChange={(event) => handleFilterChange('availableBy', event.target.value || undefined)}
                      />
                    </div>

                    {/* Amenities */}
                    <section className="space-y-3" aria-labelledby="amenity-filter-title-mobile">
                      <h2 id="amenity-filter-title-mobile" className="text-sm font-semibold">Amenities</h2>
                      {amenitiesLoading ? (
                        <p className="text-sm text-muted-foreground">Loading amenities...</p>
                      ) : amenities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Amenities are unavailable right now.</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
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

                    <DialogFooter className="pt-2">
                      <Button
                        onClick={() => {
                          triggerHaptic();
                          handleApplyFilters();
                          setIsFilterOpen(false);
                        }}
                        disabled={priceRangeInvalid}
                        className="w-full h-11 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Show Properties
                      </Button>
                    </DialogFooter>
                  </div>
              </DialogContent>
            </Dialog>

            {/* Results Header - Mobile */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `${pagination.total} properties`}
              </p>
              <Select
                value={`${localSearchParams.sortBy}-${localSearchParams.sortOrder}`}
                onChange={(event) => {
                  const [sortBy, sortOrder] = event.target.value.split('-');
                  setSearchParams(prev => ({
                    ...prev,
                    sortBy: sortBy as any,
                    sortOrder: sortOrder as any,
                    page: 1,
                  }));
                }}
                className="w-32"
              >
                <option value="createdAt-desc">Newest</option>
                <option value="createdAt-asc">Oldest</option>
                <option value="rent-asc">Rent ↑</option>
                <option value="rent-desc">Rent ↓</option>
                <option value="bedrooms-desc">Beds</option>
              </Select>
            </div>

            {/* Content: Map View or List View */}
            {mobileView === 'map' ? (
              <div className="h-[calc(100vh-270px)] rounded-2xl overflow-hidden border border-border/80 shadow-inner mt-2">
                <PropertyMap properties={properties} height="100%" />
              </div>
            ) : (
              <div>
                {/* Results - Mobile */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <PropertyCardSkeleton key={i} />
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/80 my-4">
                    <div className="text-base font-semibold text-foreground mb-1">No properties found</div>
                    <p className="text-xs text-muted-foreground mb-4">Try relaxing your search terms or filters</p>
                    <Button variant="outline" size="sm" onClick={handleClearFilters} className="rounded-xl">
                      Reset Filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <Suspense key={property.id} fallback={<PropertyCardSkeleton />}>
                        <PropertyCard
                          property={property}
                          onToggleFavourite={isAuthenticated && user?.role === 'tenant' ? toggleFavourite : undefined}
                          isFavourited={isFavourited(property.id)}
                        />
                      </Suspense>
                    ))}
                  </div>
                )}

                {/* Pagination - Mobile */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(pagination.page || 1) === 1}
                        onClick={() => setSearchParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(pagination.page || 1) === (pagination.totalPages || 1)}
                        onClick={() => setSearchParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating Map/List View Toggle Pill */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setMobileView(mobileView === 'list' ? 'map' : 'list');
                }}
                className="flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md active:scale-95 transition-all"
              >
                {mobileView === 'list' ? (
                  <>
                    <Map className="h-4 w-4" />
                    <span>Map View</span>
                  </>
                ) : (
                  <>
                    <List className="h-4 w-4" />
                    <span>List View</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
