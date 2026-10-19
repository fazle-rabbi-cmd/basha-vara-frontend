'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import { getPropertyById } from '@/mocks/data';
import { Property } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';

export default function TenantFavouritesPage() {
  const { user } = useAuth();
  const { favourites, fetchFavourites, toggleFavourite } = useFavourites(user?.id || '');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavourites = useCallback(async () => {
    setIsLoading(true);
    await fetchFavourites();
    const favProperties = favourites
      .map(f => getPropertyById(f.propertyId))
      .filter((p): p is Property => p !== undefined);
    setProperties(favProperties);
    setIsLoading(false);
  }, [fetchFavourites, favourites]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.id) {
      loadFavourites();
    }
  }, [user, loadFavourites]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveFavourite = async (propertyId: string) => {
    await toggleFavourite(propertyId);
    await loadFavourites();
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
            {[1, 2, 3].map((i) => <PropertyCardSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Saved Properties</h1>
          <p className="text-muted-foreground">
            {properties.length} properties saved
          </p>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No saved properties yet</h2>
              <p className="text-muted-foreground mb-6">
                Start browsing and save properties you&apos;re interested in
              </p>
              <Button asChild>
                <Link href="/properties">
                  Browse Properties
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onRemoveFavourite={() => handleRemoveFavourite(property.id)}
                isFavourited={true}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
