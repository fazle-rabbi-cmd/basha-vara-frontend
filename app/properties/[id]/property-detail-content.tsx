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
  Clock,
  Moon,
  Users,
  Home,
  Briefcase,
  HeartHandshake,
  Baby,
  CheckCircle2,
  XCircle,
  Ban,
  PawPrint,
  Cigarette,
  CigaretteOff,
  ShieldCheck,
  Layers,
  Sparkles,
  Sun,
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

function formatFloor(floor?: number | null, total?: number | null): string {
  if (floor === null || floor === undefined) return '';
  const suffix = (n: number) => {
    if (n === 0) return 'Ground Floor';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]) + ' Floor';
  };
  const floorName = suffix(floor);
  if (total) {
    return `${floorName} (out of ${total})`;
  }
  return floorName;
}

function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const h = parseInt(hoursStr, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const m = minutesStr || '00';
  return `${h12}:${m} ${ampm}`;
}

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
  const [pendingVisitRequest, setPendingVisitRequest] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(false);

  // Validate UUID format
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const loadProperty = useCallback(async () => {
    // Skip loading if invalid UUID (placeholder)
    if (!isValidUUID(propertyId)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const data = await fetchProperty(propertyId);
    setProperty(data);
    setIsLoading(false);

    if (data?.landlordId) {
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

  const fetchVerifiedVisit = async (retryCount = 0) => {
    try {
      console.log('Fetching visits for property:', propertyId, 'Retry:', retryCount);
      console.log('Current user ID:', user?.id);
      const visits = await apiClient.visits.getMyVisits();
      console.log('All visits:', visits);
      console.log('Number of visits:', visits.length);

      const verifiedVisit = visits.find(
        (v) => v.propertyId === propertyId && (v.status?.toLowerCase() === 'completed' || !!v.visitVerifiedAt)
      );
      setVerifiedVisitId(verifiedVisit?.id || null);

      // Check for pending visit request
      const pendingVisit = visits.find(
        (v) => v.propertyId === propertyId && v.status?.toLowerCase() === 'pending'
      );
      console.log('Pending visit for this property:', pendingVisit);
      console.log('Pending visit found:', !!pendingVisit);

      // If no pending visit found and we haven't retried yet, retry after a short delay
      if (!pendingVisit && retryCount < 2) {
        console.log('No pending visit found, retrying in 500ms...');
        setTimeout(() => fetchVerifiedVisit(retryCount + 1), 500);
        return;
      }

      setPendingVisitRequest(!!pendingVisit);
      console.log('Set pendingVisitRequest to:', !!pendingVisit);
    } catch (error) {
      console.error('Failed to fetch verified visit', error);
      console.error('Error details:', error);
    }
  };

  const fetchApplicationStatus = async () => {
    try {
      const applications = await apiClient.applications.getMyApplications();
      const pendingApp = applications.find(
        (a) => a.propertyId === propertyId && a.status !== 'withdrawn' && a.status !== 'rejected'
      );
      setPendingApplication(!!pendingApp);
    } catch (error) {
      console.error('Failed to fetch application status', error);
    }
  };

  useEffect(() => {
    loadProperty();
    if (isAuthenticated && user?.id && user.role?.includes('tenant')) {
      fetchFavourites();
      fetchVerifiedVisit();
      fetchApplicationStatus();
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
    if (pendingApplication) {
      showToast('warning', 'You already have a pending application for this property');
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

  const activeLandlord = landlordProfile || (property.landlord ? {
    fullName: property.landlord.fullName || 'Landlord',
    avatarUrl: property.landlord.avatarUrl,
    memberSince: property.createdAt ? new Date(property.createdAt).getFullYear().toString() : '2026',
    landlordInfo: null,
  } : null);

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
                  {/* Primary Key Stats */}
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
                      <div className="text-sm text-muted-foreground">Available from</div>
                    </div>
                  </div>

                  {/* Building & Unit Specifications Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-muted/30 border border-border/80 rounded-xl text-sm">
                    {property.floor !== undefined && property.floor !== null && (
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-background border shrink-0">
                          <Layers className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground truncate">Floor Level</div>
                          <div className="font-semibold text-foreground truncate">
                            {formatFloor(property.floor, property.totalFloors)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-background border shrink-0">
                        <Home className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground truncate">Property Type</div>
                        <div className="font-semibold text-foreground capitalize truncate">
                          {property.propertyType || 'Apartment'}
                        </div>
                      </div>
                    </div>

                    {property.balconyCount !== undefined && property.balconyCount !== null && (
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-background border shrink-0">
                          <Sun className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground truncate">Balconies</div>
                          <div className="font-semibold text-foreground truncate">
                            {property.balconyCount} {property.balconyCount === 1 ? 'balcony' : 'balconies'}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                      <div className="p-2 rounded-lg bg-background border shrink-0">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground truncate">Security Deposit</div>
                        <div className="font-semibold text-foreground truncate">
                          {property.deposit ? formatCurrency(property.deposit) : 'Negotiable / None'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed break-words">{property.description}</p>
                  </div>

                  {/* Tenant Eligibility & Preferences */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground text-base sm:text-lg">Tenant Eligibility & Criteria</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Family / Tenant Type */}
                      <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                        <div className="text-xs text-muted-foreground">Tenant Category</div>
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          {property.allowedFamilyType === 'FAMILY' && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">Family Only</Badge>
                          )}
                          {property.allowedFamilyType === 'BACHELOR' && (
                            <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-medium">Bachelors Welcome</Badge>
                          )}
                          {property.allowedFamilyType === 'SUBLET' && (
                            <Badge className="bg-sky-600 hover:bg-sky-700 text-white font-medium">Sublet Only</Badge>
                          )}
                          {(!property.allowedFamilyType || property.allowedFamilyType === 'ANY') && (
                            <Badge variant="outline" className="font-medium text-foreground">Open to All (Family / Bachelor)</Badge>
                          )}
                        </div>
                      </div>

                      {/* Occupation */}
                      <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                        <div className="text-xs text-muted-foreground">Allowed Occupation</div>
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {property.allowedOccupation === 'WORKING' && 'Job Holders / Professionals Only'}
                            {property.allowedOccupation === 'STUDENT' && 'Students Only'}
                            {property.allowedOccupation === 'BOTH' && 'Students or Professionals'}
                            {(!property.allowedOccupation || property.allowedOccupation === 'ANY') && 'Any Occupation'}
                          </span>
                        </div>
                      </div>

                      {/* Marital Status */}
                      <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                        <div className="text-xs text-muted-foreground">Marital Status</div>
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <HeartHandshake className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {property.allowedMaritalStatus === 'MARRIED' && 'Married Couples Only'}
                            {property.allowedMaritalStatus === 'SINGLE' && 'Single Tenants Only'}
                            {property.allowedMaritalStatus === 'DIVORCED' && 'Divorced'}
                            {(!property.allowedMaritalStatus || property.allowedMaritalStatus === 'ANY') && 'Any Marital Status'}
                          </span>
                        </div>
                      </div>

                      {/* Preferred Gender */}
                      {property.preferredGender && property.preferredGender !== 'ANY' && (
                        <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                          <div className="text-xs text-muted-foreground">Preferred Gender</div>
                          <div className="font-semibold text-foreground text-sm">
                            {property.preferredGender === 'MALE' ? 'Male Tenants Only' : property.preferredGender === 'FEMALE' ? 'Female Tenants Only' : 'Any Gender'}
                          </div>
                        </div>
                      )}

                      {/* Max Occupancy */}
                      {property.maxOccupancy ? (
                        <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                          <div className="text-xs text-muted-foreground">Maximum Total Occupancy</div>
                          <div className="font-semibold text-foreground text-sm">
                            Up to {property.maxOccupancy} persons
                          </div>
                        </div>
                      ) : null}

                      {/* Max Family Size */}
                      {property.maxFamilySize ? (
                        <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                          <div className="text-xs text-muted-foreground">Max Family Members</div>
                          <div className="font-semibold text-foreground text-sm">
                            Up to {property.maxFamilySize} members
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* House Rules & Timing Guidelines */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground text-base sm:text-lg">House Rules & Timings</h3>
                    </div>

                    {/* Strict Return Time / Curfew */}
                    {property.strictReturnTime && property.minReturnTime ? (
                      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                            Gate Closes at {formatTime12h(property.minReturnTime)} (Strict Return Enforced)
                          </div>
                          <div className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            Building main gate is locked at this time. Tenants must return within this schedule.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border bg-card/60 flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>No strict gate-closing curfew / 24/7 entry permitted</span>
                      </div>
                    )}

                    {/* Quiet Hours */}
                    {property.quietHoursStart && property.quietHoursEnd && (
                      <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/20 flex items-start gap-3">
                        <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-indigo-950 dark:text-indigo-200 text-sm">
                            Quiet Hours: {formatTime12h(property.quietHoursStart)} – {formatTime12h(property.quietHoursEnd)}
                          </div>
                          <div className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                            Please maintain low noise levels and respect neighbors during these hours.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pet & Smoking Policies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        property.allowPets ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card/60'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <PawPrint className={`h-4 w-4 ${property.allowPets ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium text-foreground">Pet Policy</span>
                        </div>
                        <Badge variant={property.allowPets ? 'default' : 'secondary'} className={property.allowPets ? 'bg-emerald-600 text-white' : ''}>
                          {property.allowPets ? 'Pets Allowed' : 'No Pets'}
                        </Badge>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        property.allowSmoking ? 'border-amber-500/30 bg-amber-500/5' : 'border-rose-500/30 bg-rose-500/5'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          {property.allowSmoking ? (
                            <Cigarette className="h-4 w-4 text-amber-600" />
                          ) : (
                            <CigaretteOff className="h-4 w-4 text-rose-600" />
                          )}
                          <span className="text-sm font-medium text-foreground">Smoking Policy</span>
                        </div>
                        <Badge variant={property.allowSmoking ? 'secondary' : 'error'} className={!property.allowSmoking ? 'bg-rose-600 text-white' : ''}>
                          {property.allowSmoking ? 'Smoking Permitted' : 'No Smoking Indoors'}
                        </Badge>
                      </div>
                    </div>

                    {/* Children & Age Guidelines */}
                    <div className="p-3.5 rounded-xl border bg-card/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Baby className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Children & Family Age Guidelines</span>
                        </div>
                        {(property.minChildrenAge !== undefined || property.maxChildrenAge !== undefined) && (
                          <span className="text-xs text-muted-foreground">
                            Age: {property.minChildrenAge ?? 0}–{property.maxChildrenAge ?? '17+'} yrs
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className={`p-2 rounded-lg border flex items-center justify-between ${
                          property.allowInfants !== false ? 'bg-muted/40 border-border text-foreground' : 'bg-muted/20 border-dashed text-muted-foreground line-through'
                        }`}>
                          <span>Infants (&lt; 2y)</span>
                          {property.allowInfants !== false ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                        </div>

                        <div className={`p-2 rounded-lg border flex items-center justify-between ${
                          property.allowToddlers !== false ? 'bg-muted/40 border-border text-foreground' : 'bg-muted/20 border-dashed text-muted-foreground line-through'
                        }`}>
                          <span>Toddlers (2-5y)</span>
                          {property.allowToddlers !== false ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                        </div>

                        <div className={`p-2 rounded-lg border flex items-center justify-between ${
                          property.allowSchoolAge !== false ? 'bg-muted/40 border-border text-foreground' : 'bg-muted/20 border-dashed text-muted-foreground line-through'
                        }`}>
                          <span>School (6-12y)</span>
                          {property.allowSchoolAge !== false ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                        </div>

                        <div className={`p-2 rounded-lg border flex items-center justify-between ${
                          property.allowTeens !== false ? 'bg-muted/40 border-border text-foreground' : 'bg-muted/20 border-dashed text-muted-foreground line-through'
                        }`}>
                          <span>Teens (13-17y)</span>
                          {property.allowTeens !== false ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="pt-2 border-t">
                    <AmenityDisplay amenities={property.amenities} />
                  </div>

                  {/* Custom Rules */}
                  {property.rules && property.rules.length > 0 && (
                    <div className="pt-2 border-t">
                      <h3 className="font-semibold text-foreground mb-3">Additional Rules</h3>
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

                  {/* Custom Preferences */}
                  {property.preferences && property.preferences.length > 0 && (
                    <div className="pt-2 border-t">
                      <h3 className="font-semibold text-foreground mb-3">Additional Preferences</h3>
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
                      <Button
                        className="w-full"
                        onClick={handleRequestVisit}
                        disabled={pendingVisitRequest}
                      >
                        {pendingVisitRequest ? 'Already Requested' : 'Request Visit'}
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleApply}
                        disabled={pendingApplication}
                      >
                        {pendingApplication ? 'Already Applied' : 'Apply Now'}
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
                      <PropertyMap
                        properties={[property]}
                        center={[property.lat!, property.lng!]}
                        height="100%"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Landlord Profile */}
              {activeLandlord && (
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
                          {activeLandlord.avatarUrl ? (
                            <img
                              src={activeLandlord.avatarUrl}
                              alt={activeLandlord.fullName}
                              className="h-12 w-12 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground truncate">{activeLandlord.fullName}</div>
                            <div className="text-sm text-muted-foreground">Member since {activeLandlord.memberSince}</div>
                          </div>
                        </div>
                        {activeLandlord.landlordInfo && (
                          <div className="space-y-2 pt-2 border-t">
                            {activeLandlord.landlordInfo.businessName && (
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{activeLandlord.landlordInfo.businessName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">{activeLandlord.landlordInfo.propertyCount} {activeLandlord.landlordInfo.propertyCount === 1 ? 'property' : 'properties'} listed</span>
                            </div>
                            {activeLandlord.landlordInfo.bio && (
                              <p className="text-sm text-muted-foreground">{activeLandlord.landlordInfo.bio}</p>
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

      {/* Mobile Sticky Floating Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-3 shadow-2xl lg:hidden">
        <div className="min-w-0">
          <div className="text-xl font-black text-teal-600 dark:text-teal-400 leading-none truncate">
            {formatCurrency(property.rent)}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
            {property.deposit ? `Deposit: ${formatCurrency(property.deposit)}` : 'per month'}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user?.role?.includes('tenant') && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavourite}
              disabled={isTogglingFavourite}
              className="h-11 w-11 rounded-xl shrink-0"
              aria-label="Save property"
            >
              <Heart className={`h-4 w-4 ${isFavourited(propertyId) ? 'fill-rose-500 text-rose-500' : ''}`} />
            </Button>
          )}

          {user?.role?.includes('tenant') && property.status === 'available' ? (
            <Button
              onClick={handleRequestVisit}
              disabled={pendingVisitRequest}
              className="h-11 px-5 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md text-sm"
            >
              {pendingVisitRequest ? 'Already Requested' : 'Request Visit'}
            </Button>
          ) : user?.role?.includes('landlord') && property.landlordId === user.id ? (
            <Button
              asChild
              className="h-11 px-5 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md text-sm"
            >
              <Link href={`/landlord/properties/${propertyId}/edit`}>Edit</Link>
            </Button>
          ) : !isAuthenticated ? (
            <Button
              asChild
              className="h-11 px-5 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md text-sm"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Dialogs */}
      <VisitRequestDialog
        open={isVisitDialogOpen}
        onOpenChange={setIsVisitDialogOpen}
        propertyId={propertyId}
        propertyTitle={property.title}
        landlordId={property.landlordId}
        onSuccess={async () => {
          // Always refresh the visit status to get the actual state
          await fetchVerifiedVisit();
        }}
      />

      <ApplicationDialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
        propertyId={propertyId}
        propertyTitle={property.title}
        propertyRent={property.rent}
        verifiedVisitId={verifiedVisitId || undefined}
        onSuccess={() => {
          fetchApplicationStatus();
        }}
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
