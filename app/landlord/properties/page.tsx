'use client';

export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Building2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { apiClient, clearCache } from '@/lib/api-client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { PhotoUpload } from '@/components/shared/photo-upload';
import { AmenitySelector } from '@/components/shared/amenity-selector';
import { Property } from '@/types';
import { LandlordRoute } from '@/features/auth/protected-route';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { PullToRefreshIndicator } from '@/components/shared/pull-to-refresh-indicator';

const LocationPicker = dynamicImport(() => import('@/components/shared/location-picker').then(mod => ({ default: mod.LocationPicker })), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-muted animate-pulse rounded-lg" />,
});

// Mobile e 16px font (iOS auto-zoom bondho), desktop e 14px
const inputMobileClass = 'text-base sm:text-sm';

const initialFormData = {
  title: '',
  description: '',
  propertyType: 'apartment',
  rent: '',
  deposit: '',
  bedrooms: '3',
  bathrooms: '2',
  size: '1400',
  address: '',
  area: '',
  city: 'Dhaka',
  lat: null as number | null,
  lng: null as number | null,
  availableFrom: new Date().toISOString().split('T')[0],
  amenityIds: [] as string[],
  status: 'available' as string,
  // Landlord Preferences
  allowedOccupation: 'ANY',
  allowedMaritalStatus: 'ANY',
  allowedFamilyType: 'ANY',
  maxFamilySize: '',
  maxOccupancy: '',
  minChildrenAge: '',
  maxChildrenAge: '',
  allowInfants: true,
  allowToddlers: true,
  allowSchoolAge: true,
  allowTeens: true,
  allowPets: false,
  allowSmoking: false,
  strictReturnTime: false,
  minReturnTime: '',
  quietHoursStart: '',
  quietHoursEnd: '',
  preferredGender: 'ANY',
};

function LandlordPropertiesContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState(initialFormData);

  const [propertyPhotos, setPropertyPhotos] = useState<any[]>([]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      clearCache();
      const liveList = await apiClient.properties.getMyProperties();
      setProperties(liveList);
    } catch (error) {
      showToast('error', 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: loadProperties,
    threshold: 80,
  });

  useEffect(() => {
    loadProperties();
  }, [user]);

  const handleEditProperty = async (propertyId: string) => {
    try {
      const property = await apiClient.properties.getById(propertyId);
      setFormData({
        title: property.title,
        description: property.description,
        propertyType: property.propertyType.toLowerCase(),
        rent: property.rent.toString(),
        deposit: property.deposit?.toString() || '',
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        size: property.size?.toString() || '1400',
        address: property.address,
        area: property.area,
        city: property.city || 'Dhaka',
        lat: property.lat || null,
        lng: property.lng || null,
        availableFrom: property.availableFrom ? new Date(property.availableFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amenityIds: property.amenities?.map((a: any) => a.id) || [],
        status: property.status,
        // Load preference fields
        allowedOccupation: property.allowedOccupation || 'ANY',
        allowedMaritalStatus: property.allowedMaritalStatus || 'ANY',
        allowedFamilyType: property.allowedFamilyType || 'ANY',
        maxFamilySize: property.maxFamilySize?.toString() || '',
        maxOccupancy: property.maxOccupancy?.toString() || '',
        minChildrenAge: property.minChildrenAge?.toString() || '',
        maxChildrenAge: property.maxChildrenAge?.toString() || '',
        allowInfants: property.allowInfants ?? true,
        allowToddlers: property.allowToddlers ?? true,
        allowSchoolAge: property.allowSchoolAge ?? true,
        allowTeens: property.allowTeens ?? true,
        allowPets: property.allowPets || false,
        allowSmoking: property.allowSmoking || false,
        strictReturnTime: property.strictReturnTime || false,
        minReturnTime: property.minReturnTime || '',
        quietHoursStart: property.quietHoursStart || '',
        quietHoursEnd: property.quietHoursEnd || '',
        preferredGender: property.preferredGender || 'ANY',
      });
      setPropertyPhotos(property.photos || []);
      setEditingPropertyId(propertyId);
      setIsDialogOpen(true);
    } catch (error) {
      showToast('error', 'Failed to load property details');
    }
  };

  useEffect(() => {
    const editPropertyId = searchParams.get('edit');
    if (editPropertyId && !isLoading && !isDialogOpen) {
      handleEditProperty(editPropertyId);
    }
  }, [searchParams, isLoading, isDialogOpen]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.rent || !formData.address || !formData.area) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }
    if (formData.lat === null || formData.lng === null) {
      showToast('error', 'Select the property location on the map before continuing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newProp = await apiClient.properties.create({
        title: formData.title,
        description: formData.description || 'Spacious rental unit in prime residential neighborhood.',
        propertyType: formData.propertyType,
        rentAmount: Number(formData.rent),
        depositAmount: formData.deposit ? Number(formData.deposit) : undefined,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        areaSqft: Number(formData.size),
        addressLine: formData.address,
        area: formData.area,
        lat: formData.lat,
        lng: formData.lng,
        status: 'draft',
        availableFrom: new Date(formData.availableFrom),
        amenityIds: formData.amenityIds,
        // Landlord Preferences
        allowedOccupation: formData.allowedOccupation !== 'ANY' ? formData.allowedOccupation : undefined,
        allowedMaritalStatus: formData.allowedMaritalStatus !== 'ANY' ? formData.allowedMaritalStatus : undefined,
        allowedFamilyType: formData.allowedFamilyType !== 'ANY' ? formData.allowedFamilyType : undefined,
        maxFamilySize: formData.maxFamilySize ? parseInt(formData.maxFamilySize) : undefined,
        maxOccupancy: formData.maxOccupancy ? parseInt(formData.maxOccupancy) : undefined,
        minChildrenAge: formData.minChildrenAge ? parseInt(formData.minChildrenAge) : undefined,
        maxChildrenAge: formData.maxChildrenAge ? parseInt(formData.maxChildrenAge) : undefined,
        allowInfants: formData.allowInfants,
        allowToddlers: formData.allowToddlers,
        allowSchoolAge: formData.allowSchoolAge,
        allowTeens: formData.allowTeens,
        allowPets: formData.allowPets,
        allowSmoking: formData.allowSmoking,
        strictReturnTime: formData.strictReturnTime,
        minReturnTime: formData.minReturnTime || undefined,
        quietHoursStart: formData.quietHoursStart || undefined,
        quietHoursEnd: formData.quietHoursEnd || undefined,
        preferredGender: formData.preferredGender !== 'ANY' ? formData.preferredGender : undefined,
      });

      setCreatedPropertyId(newProp.id);
      setProperties((prev) => [newProp, ...prev]);
      showToast('success', `Property created! Now upload photos.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteProperty = () => {
    setIsDialogOpen(false);
    setFormData({
      ...initialFormData,
      status: 'available',
    });
    setPropertyPhotos([]);
    setCreatedPropertyId(null);
    setEditingPropertyId(null);
    loadProperties();
    showToast('success', 'Property published successfully!');
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPropertyId || !formData.title || !formData.rent || !formData.address || !formData.area) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.properties.update(editingPropertyId, {
        title: formData.title,
        description: formData.description || 'Spacious rental unit in prime residential neighborhood.',
        propertyType: formData.propertyType,
        rentAmount: Number(formData.rent),
        depositAmount: formData.deposit ? Number(formData.deposit) : undefined,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        areaSqft: Number(formData.size),
        addressLine: formData.address,
        area: formData.area,
        lat: formData.lat,
        lng: formData.lng,
        availableFrom: new Date(formData.availableFrom),
        amenityIds: formData.amenityIds,
        photos: propertyPhotos,
        status: formData.status,
        // Landlord Preferences
        allowedOccupation: formData.allowedOccupation !== 'ANY' ? formData.allowedOccupation : undefined,
        allowedMaritalStatus: formData.allowedMaritalStatus !== 'ANY' ? formData.allowedMaritalStatus : undefined,
        allowedFamilyType: formData.allowedFamilyType !== 'ANY' ? formData.allowedFamilyType : undefined,
        maxFamilySize: formData.maxFamilySize ? parseInt(formData.maxFamilySize) : undefined,
        maxOccupancy: formData.maxOccupancy ? parseInt(formData.maxOccupancy) : undefined,
        minChildrenAge: formData.minChildrenAge ? parseInt(formData.minChildrenAge) : undefined,
        maxChildrenAge: formData.maxChildrenAge ? parseInt(formData.maxChildrenAge) : undefined,
        allowInfants: formData.allowInfants,
        allowToddlers: formData.allowToddlers,
        allowSchoolAge: formData.allowSchoolAge,
        allowTeens: formData.allowTeens,
        allowPets: formData.allowPets,
        allowSmoking: formData.allowSmoking,
        strictReturnTime: formData.strictReturnTime,
        minReturnTime: formData.minReturnTime || undefined,
        quietHoursStart: formData.quietHoursStart || undefined,
        quietHoursEnd: formData.quietHoursEnd || undefined,
        preferredGender: formData.preferredGender !== 'ANY' ? formData.preferredGender : undefined,
      });
      await loadProperties();
      setIsDialogOpen(false);
      setFormData({
        ...initialFormData,
        status: 'available',
      });
      setPropertyPhotos([]);
      setEditingPropertyId(null);
      showToast('success', 'Property updated successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update property.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="w-full max-w-full overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
              <Skeleton variant="text" className="h-8 sm:h-9 w-48 mb-2" />
              <Skeleton variant="text" className="h-5 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*]:min-w-0">
              {[1, 2, 3].map((i) => <PropertyCardSkeleton key={i} variant="landlord" />)}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <LandlordRoute>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        threshold={80}
      />
      <PageLayout>
        <div className="w-full max-w-full overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            {/* Page header: mobile e stack, desktop e side-by-side */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 break-words">
                  My Property Portfolio
                </h1>
                <p className="text-muted-foreground text-sm">
                  Manage your residential listings, review statuses, and track active tenant interest.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button variant="outline" size="sm" onClick={loadProperties} disabled={isLoading} className="hidden sm:flex">
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setIsDialogOpen(true)} className="flex-1 sm:flex-none">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>

            {properties.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                    No properties listed yet
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Start by adding your first property to reach verified prospective tenants
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Property
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*]:min-w-0">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} onEdit={handleEditProperty} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Property Modal */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setFormData({
              ...initialFormData,
              status: 'available',
            });
            setPropertyPhotos([]);
            setCreatedPropertyId(null);
            setEditingPropertyId(null);
          }
          setIsDialogOpen(open);
        }}>
          <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl max-h-[90dvh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {editingPropertyId ? (
              <>
                <DialogHeader className="text-left">
                  <DialogTitle>Edit Property</DialogTitle>
                  <DialogDescription>
                    Update property details and rent terms.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdateProperty} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Property Title *</Label>
                    <Input
                      id="title"
                      className={inputMobileClass}
                      placeholder="e.g. Modern 3-Bedroom Flat in Dhanmondi Road 8A"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="rent">Monthly Rent (৳) *</Label>
                      <Input
                        id="rent"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        placeholder="35000"
                        value={formData.rent}
                        onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="deposit">Security Deposit (৳)</Label>
                      <Input
                        id="deposit"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        placeholder="70000"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="availableFrom">Available From *</Label>
                    <Input
                      id="availableFrom"
                      type="date"
                      className={inputMobileClass}
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      When will this property be ready for tenants to move in?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0 col-span-2 sm:col-span-1">
                      <Label htmlFor="size">Size (sqft)</Label>
                      <Input
                        id="size"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="area">Area / Thana *</Label>
                      <Input
                        id="area"
                        className={inputMobileClass}
                        placeholder="e.g. Dhanmondi, Gulshan, Mirpur"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <select
                        id="propertyType"
                        value={formData.propertyType}
                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="apartment">Apartment</option>
                        <option value="flat">Flat</option>
                        <option value="house">House</option>
                        <option value="studio">Studio</option>
                        <option value="room">Room</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address Line *</Label>
                    <Input
                      id="address"
                      className={inputMobileClass}
                      placeholder="e.g. House 42, Road 8A, Dhanmondi"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Exact Location</Label>
                    <LocationPicker
                      onLocationSelect={(lat, lng, details) => {
                        setFormData((current) => ({
                          ...current,
                          lat,
                          lng,
                          ...(details?.area && !current.area ? { area: details.area } : {}),
                          ...(details?.address && !current.address ? { address: details.address } : {}),
                          ...(details?.city && !current.city ? { city: details.city } : {}),
                        }));
                      }}
                      initialLocation={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : undefined}
                      height="250px"
                      address={[formData.address, formData.area, formData.city || 'Dhaka', 'Bangladesh'].filter(Boolean).join(', ')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Property Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      className={inputMobileClass}
                      placeholder="Describe ventilation, daylight, balcony views, generator, lift..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <AmenitySelector
                    selectedIds={formData.amenityIds}
                    onChange={(ids) => setFormData({ ...formData, amenityIds: ids })}
                    disabled={isSubmitting}
                  />

                  <div className="space-y-1.5">
                    <Label htmlFor="status">Property Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="available">Available</option>
                      <option value="paused">Paused</option>
                      <option value="rented">Rented</option>
                      <option value="archived">Archived</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {formData.status === 'available' && 'Property is visible to tenants and can receive applications'}
                      {formData.status === 'paused' && 'Property is hidden from tenants but remains in your portfolio'}
                      {formData.status === 'rented' && 'Property is marked as rented and hidden from search'}
                      {formData.status === 'archived' && 'Property is archived and will not be shown anywhere'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Property Photos</Label>
                    <PhotoUpload
                      propertyId={editingPropertyId || ''}
                      existingPhotos={propertyPhotos}
                      onPhotosChange={setPropertyPhotos}
                      maxPhotos={20}
                    />
                  </div>

                  <DialogFooter className="pt-2 flex-col-reverse gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Property'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : createdPropertyId ? (
              <>
                <DialogHeader className="text-left">
                  <DialogTitle>Upload Property Photos</DialogTitle>
                  <DialogDescription>
                    Add photos to make your listing more attractive. Upload at least one photo to publish.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 min-w-0">
                  <PhotoUpload
                    propertyId={createdPropertyId}
                    existingPhotos={propertyPhotos}
                    onPhotosChange={setPropertyPhotos}
                    maxPhotos={20}
                  />

                  <DialogFooter className="pt-2 flex-col-reverse gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCompleteProperty}
                      className="w-full sm:w-auto"
                      disabled={propertyPhotos.length === 0}
                    >
                      Complete & Publish ({propertyPhotos.length} photos)
                    </Button>
                  </DialogFooter>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="text-left">
                  <DialogTitle>List a New Rental Property</DialogTitle>
                  <DialogDescription>
                    Provide property details and rent terms to create a draft listing.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateProperty} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Property Title *</Label>
                    <Input
                      id="title"
                      className={inputMobileClass}
                      placeholder="e.g. Modern 3-Bedroom Flat in Dhanmondi Road 8A"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="rent">Monthly Rent (৳) *</Label>
                      <Input
                        id="rent"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        placeholder="35000"
                        value={formData.rent}
                        onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="deposit">Security Deposit (৳)</Label>
                      <Input
                        id="deposit"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        placeholder="70000"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="availableFrom">Available From *</Label>
                    <Input
                      id="availableFrom"
                      type="date"
                      className={inputMobileClass}
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      When will this property be ready for tenants to move in?
                    </p>
                  </div>

                  {/* Mobile: bed + bath ek row, size niche full width. Desktop: 3 column */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0 col-span-2 sm:col-span-1">
                      <Label htmlFor="size">Size (sqft)</Label>
                      <Input
                        id="size"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputMobileClass}
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="area">Area / Thana *</Label>
                      <Input
                        id="area"
                        className={inputMobileClass}
                        placeholder="e.g. Dhanmondi, Gulshan, Mirpur"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <select
                        id="propertyType"
                        value={formData.propertyType}
                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="apartment">Apartment</option>
                        <option value="flat">Flat</option>
                        <option value="house">House</option>
                        <option value="studio">Studio</option>
                        <option value="room">Room</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address Line *</Label>
                    <Input
                      id="address"
                      className={inputMobileClass}
                      placeholder="e.g. House 42, Road 8A, Dhanmondi"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Property Location *</Label>
                    <LocationPicker
                      onLocationSelect={(lat, lng, details) => {
                        setFormData((current) => ({
                          ...current,
                          lat,
                          lng,
                          ...(details?.area && !current.area ? { area: details.area } : {}),
                          ...(details?.address && !current.address ? { address: details.address } : {}),
                          ...(details?.city && !current.city ? { city: details.city } : {}),
                        }));
                      }}
                      initialLocation={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : undefined}
                      height="250px"
                      address={[formData.address, formData.area, formData.city || 'Dhaka', 'Bangladesh'].filter(Boolean).join(', ')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Property Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      className={inputMobileClass}
                      placeholder="Describe ventilation, daylight, balcony views, generator, lift..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <AmenitySelector
                    selectedIds={formData.amenityIds}
                    onChange={(ids) => setFormData({ ...formData, amenityIds: ids })}
                    disabled={isSubmitting}
                  />

                  {/* Tenant Preferences */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-lg">Tenant Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Set preferences for tenants (optional - leave as "Any" for no restrictions)
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="allowedOccupation">Allowed Occupation</Label>
                        <Select
                          id="allowedOccupation"
                          value={formData.allowedOccupation}
                          onChange={(e) => setFormData({ ...formData, allowedOccupation: e.target.value })}
                        >
                          <option value="ANY">Any</option>
                          <option value="STUDENT">Student only</option>
                          <option value="WORKING">Working professional only</option>
                          <option value="BOTH">Student or Working</option>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowedMaritalStatus">Allowed Marital Status</Label>
                        <Select
                          id="allowedMaritalStatus"
                          value={formData.allowedMaritalStatus}
                          onChange={(e) => setFormData({ ...formData, allowedMaritalStatus: e.target.value })}
                        >
                          <option value="ANY">Any</option>
                          <option value="SINGLE">Single only</option>
                          <option value="MARRIED">Married only</option>
                          <option value="DIVORCED">Divorced only</option>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowedFamilyType">Family Type</Label>
                        <Select
                          id="allowedFamilyType"
                          value={formData.allowedFamilyType}
                          onChange={(e) => setFormData({ ...formData, allowedFamilyType: e.target.value })}
                        >
                          <option value="ANY">Any</option>
                          <option value="FAMILY">Family only</option>
                          <option value="BACHELOR">Bachelor only</option>
                          <option value="SUBLET">Sublet only</option>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxFamilySize">Max Family Size</Label>
                        <Input
                          id="maxFamilySize"
                          type="number"
                          min="1"
                          placeholder="e.g., 4"
                          value={formData.maxFamilySize}
                          onChange={(e) => setFormData({ ...formData, maxFamilySize: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                        <Input
                          id="maxOccupancy"
                          type="number"
                          min="1"
                          placeholder="Total people allowed (e.g., 5)"
                          value={formData.maxOccupancy}
                          onChange={(e) => setFormData({ ...formData, maxOccupancy: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Including children</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preferredGender">Preferred Gender</Label>
                        <Select
                          id="preferredGender"
                          value={formData.preferredGender}
                          onChange={(e) => setFormData({ ...formData, preferredGender: e.target.value })}
                        >
                          <option value="ANY">Any</option>
                          <option value="MALE">Male only</option>
                          <option value="FEMALE">Female only</option>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minReturnTime">Min Return Time</Label>
                        <Input
                          id="minReturnTime"
                          type="time"
                          value={formData.minReturnTime}
                          onChange={(e) => setFormData({ ...formData, minReturnTime: e.target.value })}
                          disabled={!formData.strictReturnTime}
                        />
                        <p className="text-xs text-muted-foreground">
                          Tenant must return by this time
                        </p>
                      </div>
                    </div>

                    {/* Children Age Preferences */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Children Age Restrictions</h4>
                      <p className="text-xs text-muted-foreground">
                        Set age restrictions for children (optional - leave empty for no restrictions)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minChildrenAge">Min Child Age</Label>
                          <Input
                            id="minChildrenAge"
                            type="number"
                            min="0"
                            placeholder="e.g., 2"
                            value={formData.minChildrenAge}
                            onChange={(e) => setFormData({ ...formData, minChildrenAge: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxChildrenAge">Max Child Age</Label>
                          <Input
                            id="maxChildrenAge"
                            type="number"
                            min="0"
                            placeholder="e.g., 17"
                            value={formData.maxChildrenAge}
                            onChange={(e) => setFormData({ ...formData, maxChildrenAge: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allowInfants"
                            checked={formData.allowInfants}
                            onChange={(e) => setFormData({ ...formData, allowInfants: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                          <Label htmlFor="allowInfants" className="text-sm">Infants (0-2)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allowToddlers"
                            checked={formData.allowToddlers}
                            onChange={(e) => setFormData({ ...formData, allowToddlers: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                          <Label htmlFor="allowToddlers" className="text-sm">Toddlers (2-5)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allowSchoolAge"
                            checked={formData.allowSchoolAge}
                            onChange={(e) => setFormData({ ...formData, allowSchoolAge: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                          <Label htmlFor="allowSchoolAge" className="text-sm">School Age (6-12)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allowTeens"
                            checked={formData.allowTeens}
                            onChange={(e) => setFormData({ ...formData, allowTeens: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                          <Label htmlFor="allowTeens" className="text-sm">Teens (13-17)</Label>
                        </div>
                      </div>
                    </div>

                    {/* Quiet Hours */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Quiet Hours</h4>
                      <p className="text-xs text-muted-foreground">
                        Set quiet hours when noise should be minimized (optional)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quietHoursStart">Quiet Hours Start</Label>
                          <Input
                            id="quietHoursStart"
                            type="time"
                            value={formData.quietHoursStart}
                            onChange={(e) => setFormData({ ...formData, quietHoursStart: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quietHoursEnd">Quiet Hours End</Label>
                          <Input
                            id="quietHoursEnd"
                            type="time"
                            value={formData.quietHoursEnd}
                            onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="allowPets"
                          checked={formData.allowPets}
                          onChange={(e) => setFormData({ ...formData, allowPets: e.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                        <Label htmlFor="allowPets">Allow pets</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="allowSmoking"
                          checked={formData.allowSmoking}
                          onChange={(e) => setFormData({ ...formData, allowSmoking: e.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                        <Label htmlFor="allowSmoking">Allow smoking</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="strictReturnTime"
                          checked={formData.strictReturnTime}
                          onChange={(e) => setFormData({ ...formData, strictReturnTime: e.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                        <Label htmlFor="strictReturnTime">Enforce return time</Label>
                      </div>
                    </div>
                  </div>

                  {/* Mobile e primary action upore, full width */}
                  <DialogFooter className="pt-2 flex-col-reverse gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? (editingPropertyId ? 'Updating...' : 'Creating...') : (editingPropertyId ? 'Update Property' : 'Create Draft')}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </PageLayout>
    </LandlordRoute>
  );
}

export default function LandlordPropertiesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LandlordPropertiesContent />
    </Suspense>
  );
}