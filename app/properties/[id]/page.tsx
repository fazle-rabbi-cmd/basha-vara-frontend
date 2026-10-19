'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Bed, Bath, Maximize, Calendar, Check, Heart, Share2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useProperties } from '@/features/properties/property-service';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import { useToast } from '@/components/shared/toast';
import { useState, useEffect, Suspense } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { Property, PropertyPhoto, Amenity } from '@/types';

function PropertyDetailContent() {
  const params = useParams();
  const propertyId = params.id as string;
  const { fetchProperty } = useProperties();
  const { user, isAuthenticated } = useAuth();
  const { toggleFavourite, isFavourited, fetchFavourites } = useFavourites(user?.id || '');
  const { showToast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProperty();
    if (isAuthenticated && user?.id) {
      fetchFavourites();
    }
  }, [propertyId, isAuthenticated, user]);

  const loadProperty = async () => {
    setIsLoading(true);
    const data = await fetchProperty(propertyId);
    setProperty(data);
    setIsLoading(false);
  };

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
    // Navigate to visit request page
    showToast('info', 'Visit request feature coming soon');
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      showToast('warning', 'Please sign in to apply');
      return;
    }
    // Navigate to application page
    showToast('info', 'Application feature coming soon');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton variant="text" className="h-5 w-1/4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-0">
                  <Skeleton variant="rectangular" className="w-full h-96" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-6">
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
            <p className="text-muted-foreground mb-4">The property you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const primaryPhoto = property.photos.find((p) => p.isPrimary) || property.photos[0];

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/properties" className="hover:text-primary">Properties</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{property.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  {!imageErrors.has(selectedPhoto) ? (
                    <img
                      src={property.photos[selectedPhoto]?.url || primaryPhoto?.url}
                      alt={property.title}
                      className="w-full h-96 object-cover"
                      onError={() => handleImageError(selectedPhoto)}
                    />
                  ) : (
                    <div className="w-full h-96 bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                        <p>Image not available</p>
                      </div>
                    </div>
                  )}
                  <Badge
                    variant={getStatusBadgeVariant(property.status)}
                    className="absolute top-4 right-4"
                  >
                    {property.status}
                  </Badge>
                </div>
                {property.photos.length > 1 && (
                  <div className="p-4 grid grid-cols-4 gap-2">
                    {property.photos.map((photo, index: number) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhoto(index)}
                        className={`relative h-20 rounded overflow-hidden border-2 transition-colors ${
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
                <CardTitle className="text-2xl">{property.title}</CardTitle>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.address}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-foreground">{property.bedrooms}</div>
                    <div className="text-sm text-muted-foreground">Bedrooms</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-foreground">{property.bathrooms}</div>
                    <div className="text-sm text-muted-foreground">Bathrooms</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Maximize className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-foreground">{property.size}</div>
                    <div className="text-sm text-muted-foreground">Sq Ft</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
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
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                </div>

                {/* Amenities */}
                {property.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {property.amenities.map((amenity: Amenity) => (
                        <div key={amenity.id} className="flex items-center text-sm text-muted-foreground">
                          <Check className="h-4 w-4 mr-2 text-primary" />
                          {amenity.name}
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
                          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-warning" />
                          {rule}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(property.rent)}
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>

                {property.deposit && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit</span>
                    <span className="font-medium text-foreground">{formatCurrency(property.deposit)}</span>
                  </div>
                )}

                <div className="flex gap-2">
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
                  <Button variant="outline" size="sm">
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

                <div className="text-xs text-muted-foreground text-center pt-2">
                  <p>Prototype: This is a demo. No real bookings will be made.</p>
                </div>
              </CardContent>
            </Card>

            {/* Location Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{property.area}</div>
                      <div className="text-muted-foreground">{property.address}</div>
                    </div>
                  </div>
                </div>
                {/* Placeholder for map */}
                <div className="mt-4 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Map view available in production</p>
                  </div>
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
          </div>
        </div>
      </div>
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
