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
  Heart,
  Share2,
  AlertCircle,
  Navigation,
  Edit,
  Trash2,
  FileText,
  Calendar as CalendarIcon,
  User,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useProperties } from '@/features/properties/property-service';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import { useToast } from '@/components/shared/toast';
import { AmenityDisplay } from '@/components/shared/amenity-display';
import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Property, Amenity } from '@/types';
import dynamic from 'next/dynamic';
import { PropertyStatusPill } from '@/components/shared/property-status-pill';
import { VisitRequestDialog } from '@/components/features/visit-request-dialog';
import { ApplicationDialog } from '@/components/features/application-dialog';
import { PropertyLockBadge } from '@/components/shared/property-lock-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

const PropertyMap = dynamic(() => import('@/components/shared/property-map').then(mod => ({ default: mod.PropertyMap })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

export function PropertyDetailContent({ propertyId }: { propertyId: string }) {
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verifiedVisitId, setVerifiedVisitId] = useState<string | null>(null);
  const [landlordProfile, setLandlordProfile] = useState<any>(null);
  const [isLoadingLandlord, setIsLoadingLandlord] = useState(false);

  const loadProperty = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchProperty(propertyId);
    setProperty(data);
    setIsLoading(false);

    if (data.landlordId) {
      setIsLoadingLandlord(true);
      try {
        const profile = await apiClient.users.getPublicProfile(data.landlordId);
        setLandlordProfile(profile);
      } catch (error) {
        console.error('Failed to fetch landlord profile', error);
      } finally {
        setIsLoadingLandlord(false);
      }
    }
  }, [fetchProperty, propertyId]);

  const fetchVerifiedVisit = async () => {
    try {
      const visits = await apiClient.visits.getMyVisits();
      const verifiedVisit = visits.find(
        (v) => v.propertyId === propertyId && v.status === 'completed' && v.visitVerifiedAt
      );
      setVerifiedVisitId(verifiedVisit?.id || null);
    } catch (error) {
      console.error('Failed to fetch verified visit', error);
    }
  };

  useEffect(() => {
    loadProperty();
    if (isAuthenticated && user?.id && user.role?.includes('tenant')) {
      fetchFavourites();
      fetchVerifiedVisit();
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

  const handleDeleteProperty = async () => {
    setIsDeleting(true);
    try {
      await apiClient.properties.delete(propertyId);
      showToast('success', 'Property deleted successfully');
      window.location.href = '/landlord/properties';
    } catch (error) {
      showToast('error', 'Failed to delete property');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
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
                    {/* Photo counter: user bujhe koyta photo ache, kon ta dekhche */}
                    {property.photos.length > 1 && !imageErrors.has(selectedPhoto) && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                        {selectedPhoto + 1} / {property.photos.length}
                      </span>
                    )}
                  </div>
                  {property.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto p-3 sm:p-4">
                      {property.photos.map((photo, index: number) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhoto(index)}
                          aria-label={`Show photo ${index + 1}`}
                          aria-current={selectedPhoto === index}
                          className={`relative h-16 w-24 sm:h-20 sm:w-28 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                            selectedPhoto === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
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
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl sm:text-2xl break-words flex-1 min-w-0">{property.title}</CardTitle>
                    <PropertyStatusPill status={property.status} className="mt-1" />
                  </div>
                  <div className="flex items-start text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1 mt-1 shrink-0" />
                    <span className="break-words min-w-0">{property.address}</span>
                  </div>
                  {/* Mobile e price sobar age dekhay (desktop e sidebar e ache) */}
                  <div className="lg:hidden pt-1 text-2xl font-bold text-primary">
                    {formatCurrency(property.rent)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-muted/50 border border-border rounded-xl">
                      <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted/50 border border-border rounded-xl">
                      <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted/50 border border-border rounded-xl">
                      <Maximize className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{property.size ?? 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Sq Ft</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted/50 border border-border rounded-xl">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm sm:text-base font-bold text-foreground leading-tight py-1">
                        {formatDate(property.availableFrom)}
                      </div>
                      {/* "Available" status pill er sathe confuse hoy, tai "Available from" */}
                      <div className="text-sm text-muted-foreground">Available from</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed break-words">{property.description}</p>
                  </div>

                  {/* Amenities */}
                  <AmenityDisplay amenities={property.amenities} />

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
                    <div className="flex justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Security deposit</span>
                      <span className="font-semibold text-foreground">{formatCurrency(property.deposit)}</span>
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

                  {/* Action Buttons */}
                  {user?.role?.includes('tenant') && property.status === 'available' && (
                    <>
                      <Button className="w-full" onClick={handleRequestVisit}>
                        Request Visit
                      </Button>
                      <Button className="w-full" variant="outline" onClick={handleApply}>
                        Apply Now
                      </Button>
                    </>
                  )}

                  {/* Landlord Actions */}
                  {user?.role?.includes('landlord') && property.landlordId === user.id && (
                    <div className="pt-4 border-t">
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline" asChild>
                          <Link href={`/landlord/properties/${propertyId}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          className="flex-1"
                          variant="destructive"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* View on Map */}
                  <Button className="w-full" variant="outline" asChild>
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Map */}
              {hasCoords && (
                <Card>
                  <CardContent className="p-0">
                    <div className="h-64 sm:h-80">
                      <PropertyMap lat={property.lat!} lng={property.lng!} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Landlord Profile */}
              {landlordProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Landlord
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isLoadingLandlord ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          {landlordProfile.avatarUrl ? (
                            <img
                              src={landlordProfile.avatarUrl}
                              alt={landlordProfile.fullName}
                              className="h-12 w-12 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground truncate">{landlordProfile.fullName}</div>
                            <div className="text-sm text-muted-foreground">Member since {landlordProfile.memberSince}</div>
                          </div>
                        </div>
                        {landlordProfile.landlordInfo && (
                          <div className="space-y-2 pt-2 border-t">
                            {landlordProfile.landlordInfo.businessName && (
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{landlordProfile.landlordInfo.businessName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">{landlordProfile.landlordInfo.propertyCount} {landlordProfile.landlordInfo.propertyCount === 1 ? 'property' : 'properties'} listed</span>
                            </div>
                            {landlordProfile.landlordInfo.bio && (
                              <p className="text-sm text-muted-foreground">{landlordProfile.landlordInfo.bio}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {property.documents && property.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {property.documents.map((doc: any) => (
                      <Button
                        key={doc.id}
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                      >
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          {doc.name}
                        </a>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <VisitRequestDialog
        open={isVisitDialogOpen}
        onOpenChange={setIsVisitDialogOpen}
        propertyId={propertyId}
        propertyTitle={property.title}
      />

      <ApplicationDialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
        propertyId={propertyId}
        propertyTitle={property.title}
        rent={property.rent}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProperty} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
