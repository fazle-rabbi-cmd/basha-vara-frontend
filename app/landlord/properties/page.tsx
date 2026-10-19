'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Building2 } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { getPropertiesByLandlord } from '@/mocks/data';
import { useEffect, useState } from 'react';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { Property } from '@/types';

export default function LandlordPropertiesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProperties = () => {
    const myProperties = getPropertiesByLandlord(user?.id || '');
    setProperties(myProperties);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      loadProperties();
    }
  }, [user]);

  const handleAddProperty = () => {
    showToast('info', 'Property creation form coming soon. This feature requires backend integration.');
  };

  const handleEditProperty = (propertyId: string) => {
    showToast('info', 'Property editing coming soon. This feature requires backend integration.');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton variant="text" className="h-9 w-48 mb-2" />
            <Skeleton variant="text" className="h-5 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <PropertyCardSkeleton key={i} variant="landlord" />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Properties</h1>
            <p className="text-muted-foreground">
              {properties.length} properties listed
            </p>
          </div>
          <Button onClick={handleAddProperty}>
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </Button>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No properties listed yet</h2>
              <p className="text-muted-foreground mb-6">
                Start by adding your first property to reach potential tenants
              </p>
              <Button onClick={handleAddProperty}>
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} onEdit={handleEditProperty} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
