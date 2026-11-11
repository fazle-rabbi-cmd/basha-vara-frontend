'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Check,
  Heart,
  Share2,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { useProperties } from '@/features/properties/property-service';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import { useToast } from '@/components/shared/toast';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { Property, Amenity } from '@/types';
import dynamic from 'next/dynamic';
import { VisitRequestDialog } from '@/components/features/visit-request-dialog';
import { ApplicationDialog } from '@/components/features/application-dialog';

const PropertyMap = dynamic(() => import('@/components/shared/property-map').then(mod => ({ default: mod.PropertyMap })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

function PropertyDetailContent() {
  const params = useParams();
  const propertyId = params.id as string;
  const { fetchProperty } = useProperties();
  const { user, isAuthenticated } = useAuth();
  const { toggleFavourite, isFavourited, fetchFavourites } = useFavourites(user?.id || '', user?.role || '');
  const { showToast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);

  const loadProperty = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchProperty(propertyId);
    setProperty(data);
    setIsLoading(false);
  }, [fetchProperty, propertyId]);

  useEffect(() => {
    loadProperty();
    if (isAuthenticated && user?.id && user.role?.includes('tenant')) {
      fetchFavourites();
    }
  }, [loadProperty, isAuthenticated, user?.id, user?.role, fetchFavourites]);

  const handleToggleFavourite = async () => {
    if (!isAuthenticated) {
      showToast('warning', 'Please sign in to save properties');
      return;
    }
    setIsTogglingFavourite(true);
    try {
      const wasFavourited = isFavourited(propertyId);
      await toggleFavourite(propertyId);
      showToast('success', wasFavourited ? 'Removed from favourites' : 'Added to favourites');
    } catch (error) {
      showToast('error', 'Failed to update favourites');
    } finally {
      setIsTogglingFavourite(false);
    }
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set([...prev, index]));
  };

  const handleRequestVisit = () => {
    if (!isAuthenticated) {
      showToast('warning', 'Please sign in to request a visit');
      return;
    }
    setIsVisitDialogOpen(true);
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      showToast('warning', 'Please sign in to apply');
      return;
    }
    setIsApplicationDialogOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('success', 'Link copied to clipboard');
    } catch {
      // User share sheet cancel korle kichu korar nai
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="w-full max-w-full overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="mb-6">
              <Skeleton variant="text" className="h-5 w-1/2 sm:w-1/4" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-6 min-w-0">
                <Card>
                  <CardContent className="p-0">
                    <Skeleton variant="rectangular" className="w-full h-64 sm:h-96" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    <Skeleton variant="text" className="h-8 w-3/4" />
                    <Skeleton variant="text" className="h-4 w-1/2" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center p-4 bg-muted rounded-lg">
                          <Skeleton variant="circular" className="h-6 w-6 mx-auto mb-2" />
                          <Skeleton variant="text" className="h-6 w-8 mx-auto" />
                          <Skeleton variant="text" className="h-4 w-16 mx-auto" />
                        </div>
                      ))}
                    </div>
                    <Skeleton variant="text" className="h-5 w-1/4" />
                    <Skeleton variant="text" className="h-4 w-full" />
                    <Skeleton variant="text" className="h-4 w-full" />
                    <Skeleton variant="text" className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton variant="text" className="h-8 w-1/2" />
                    <Skeleton variant="text" className="h-4 w-1/4" />
                    <Skeleton variant="rectangular" className="h-10 w-full" />
                    <Skeleton variant="rectangular" className="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!property) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Property Not Found</h2>
            <p className="text-muted-foreground mb-4">The property you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button asChild>
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const primaryPhoto = property.photos.find((p) => p.isPrimary) || property.photos[0];
  const hasCoords = property.lat !== undefined && property.lng !== undefined;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${property.lat},${property.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.area}`)}`;

  return (
    <PageLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Mobile e bottom bar er jonno extra padding (pb-28), desktop e normal */}
        <div className="container mx-auto px-4 py-6 sm:py-8 pb-28 lg:pb-8">
          {/* Breadcrumb: lomba title truncate hobe, layout bhangbe na */}
          <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 flex items-center text-sm text-muted-foreground min-w-0">
            <Link href="/" className="shrink-0 hover:text-primary">Home</Link>
            <span className="mx-2 shrink-0">/</span>
            <Link href="/properties" className="shrink-0 hover:text-primary">Properties</Link>
            <span className="mx-2 shrink-0">/</span>
            <span className="text-foreground truncate min-w-0">{property.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Photo Gallery */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    {property.photos.length === 0 || imageErrors.has(selectedPhoto) ? (
                      <div className="w-full h-64 sm:h-96 bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                          <p>Image not available</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={property.photos[selectedPhoto]?.url || primaryPhoto?.url}
                        alt={property.title}
                        className="w-full h-64 sm:h-96 object-cover"
                        onError={() => handleImageError(selectedPhoto)}
                      />
                    )}
                    <Badge
                      variant={getStatusBadgeVariant(property.status)}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4"
                    >
                      {property.status}
                    </Badge>
                  </div>
                  {property.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto p-3 sm:p-4">
                      {property.photos.map((photo, index: number) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhoto(index)}
                          aria-label={`Show photo ${index + 1}`}
                          className={`relative h-16 w-24 sm:h-20 sm:w-28 shrink-0 rounded overflow-hidden border-2 transition-colors ${
                            selectedPhoto === index ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          {!imageErrors.has(index) ? (
                            <img
                              src={photo.url}
                              alt={photo.caption}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(index)}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <AlertCircle className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl break-words">{property.title}</CardTitle>
                  <div className="flex items-start text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1 mt-1 shrink-0" />
                    <span className="break-words min-w-0">{property.address}</span>
                  </div>
                  {/* Mobile e price sobar age dekhay (desktop e sidebar e ache) */}
                  <div className="lg:hidden pt-2 text-2xl font-bold text-primary">
                    {formatCurrency(property.rent)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                      <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                      <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                      <Maximize className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{property.size}</div>
                      <div className="text-sm text-muted-foreground">Sq Ft</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-bold text-foreground">
                        {formatDate(property.availableFrom)}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed break-words">{property.description}</p>
                  </div>

                  {/* Amenities */}
                  {property.amenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Amenities</h3>
                      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-2">
                        {property.amenities.map((amenity: Amenity) => (
                          <div key={amenity.id} className="flex items-center text-sm text-muted-foreground min-w-0">
                            <Check className="h-4 w-4 mr-2 shrink-0 text-primary" />
                            <span className="break-words min-w-0">{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rules */}
                  {property.rules && property.rules.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Property Rules</h3>
                      <ul className="space-y-2">
                        {property.rules.map((rule: string, index: number) => (
                          <li key={index} className="flex items-start text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-warning" />
                            <span className="break-words min-w-0">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preferences */}
                  {property.preferences && property.preferences.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Landlord Preferences</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.preferences.map((pref: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar: price + location + similar. Sticky sudhu boro (950px+ height) desktop screen e, jate kokhono overlap na kore */}
            <aside className="min-w-0 space-y-6 lg:self-start lg:[@media(min-height:950px)]:sticky lg:[@media(min-height:950px)]:top-24">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {formatCurrency(property.rent)}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>

                  {property.deposit && (
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Deposit</span>
                      <span className="font-medium text-foreground">{formatCurrency(property.deposit)}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {user?.role?.includes('tenant') && (
                      <Button
                        variant={isFavourited(propertyId) ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleToggleFavourite}
                        className="flex-1"
                        disabled={isTogglingFavourite}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isFavourited(propertyId) ? 'fill-current' : ''}`} />
                        {isTogglingFavourite ? 'Saving...' : (isFavourited(propertyId) ? 'Saved' : 'Save')}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleShare} aria-label="Share this property">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border">
                    <Button className="w-full" size="lg" onClick={handleRequestVisit}>
                      Request a Visit
                    </Button>
                    <Button className="w-full" variant="outline" size="lg" onClick={handleApply}>
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {/* Location: right sidebar e, price card er niche */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-sm">
                      <div className="font-medium text-foreground break-words">{property.area}</div>
                      <div className="text-muted-foreground break-words">{property.address}</div>
                    </div>
                  </div>

                  {/*
                    relative + z-0 + isolate: Leaflet er internal z-index (400-1000) ei box er vitore bondho thake,
                    tai navbar, sticky card ba modal er upor uthe ashbe na.
                  */}
                  <div className="relative z-0 isolate h-56 sm:h-64 lg:h-52 overflow-hidden rounded-lg border border-border bg-muted">
                    <PropertyMap
                      properties={[property]}
                      height="100%"
                      center={hasCoords ? [property.lat as number, property.lng as number] : undefined}
                      zoom={hasCoords ? 16 : 13}
                    />
                  </div>

                  {!hasCoords && (
                    <p className="text-xs text-muted-foreground">
                      Exact pin is not available for this listing. The map shows the approximate area.
                    </p>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" className="w-full">
                      <a href={directionsUrl} target="_blank" rel="noreferrer">
                        <Navigation className="h-4 w-4 mr-2" />
                        Get directions
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Related Properties */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center py-4">
                    More properties like this coming soon
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>

        {/* Mobile sticky action bar (lg e hide). Map er z-index er niche na, tai z-40 */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-bold text-primary leading-tight truncate">
                {formatCurrency(property.rent)}
              </div>
              <div className="text-xs text-muted-foreground">per month</div>
            </div>
            <Button size="lg" onClick={handleRequestVisit} className="shrink-0">
              Request a Visit
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <VisitRequestDialog
        open={isVisitDialogOpen}
        onOpenChange={setIsVisitDialogOpen}
        propertyId={propertyId}
        propertyTitle={property.title}
        onSuccess={loadProperty}
      />
      <ApplicationDialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
        propertyId={propertyId}
        propertyTitle={property.title}
        propertyRent={property.rent}
        onSuccess={loadProperty}
      />
    </PageLayout>
  );
}

export default function PropertyDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyDetailContent />
    </Suspense>
  );
}