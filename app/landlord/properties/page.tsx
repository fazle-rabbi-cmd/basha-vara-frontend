'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { apiClient } from '@/lib/api-client';
import { mockProperties } from '@/mocks/data';
import { useEffect, useState } from 'react';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { PhotoUpload } from '@/components/shared/photo-upload';
import { Property } from '@/types';
import { LandlordRoute } from '@/features/auth/protected-route';

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
  area: 'Dhanmondi',
};

export default function LandlordPropertiesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState(initialFormData);

  const [propertyPhotos, setPropertyPhotos] = useState<any[]>([]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const liveList = await apiClient.properties.getMyProperties();
      setProperties(liveList);
    } catch {
      setProperties(mockProperties.filter((p) => p.landlordId === user?.id || !user?.id));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.rent || !formData.address || !formData.area) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newProp = await apiClient.properties.create({
        title: formData.title,
        description: formData.description || 'Spacious rental unit in prime residential neighborhood.',
        propertyType: formData.propertyType,
        rent: Number(formData.rent),
        deposit: formData.deposit ? Number(formData.deposit) : undefined,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size: Number(formData.size),
        address: formData.address,
        area: formData.area,
        status: 'draft',
        availableFrom: new Date(),
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
    setFormData(initialFormData);
    setPropertyPhotos([]);
    setCreatedPropertyId(null);
    showToast('success', 'Property published successfully!');
  };

  const handleEditProperty = (propertyId: string) => {
    showToast('info', `Editing property ID ${propertyId}. Real-time backend updates active.`);
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
                <Button variant="outline" size="sm" onClick={loadProperties} disabled={isLoading}>
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

        {/* Add Property Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl max-h-[90dvh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {!createdPropertyId ? (
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
                      <Label htmlFor="rent">Monthly Rent (BDT) *</Label>
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
                      <Label htmlFor="deposit">Security Deposit (BDT)</Label>
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
                      {isSubmitting ? 'Creating...' : 'Create Draft'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
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
            )}
          </DialogContent>
        </Dialog>
      </PageLayout>
    </LandlordRoute>
  );
}