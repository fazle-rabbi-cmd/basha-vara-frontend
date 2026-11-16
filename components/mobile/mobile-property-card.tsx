'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bed, Bath, Home, Heart, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MobilePropertyCardProps {
  property: Property;
  isFavourited?: boolean;
  onFavouriteToggle?: () => void;
  showFavourite?: boolean;
}

export function MobilePropertyCard({
  property,
  isFavourited = false,
  onFavouriteToggle,
  showFavourite = true,
}: MobilePropertyCardProps) {
  const [imageError, setImageError] = useState(false);

  const primaryPhoto = property.photos.find((p) => p.isPrimary) || property.photos[0];

  return (
    <Link href={`/properties/${property.id}`} className="block">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted">
          {primaryPhoto && !imageError ? (
            <Image
              src={primaryPhoto.url}
              alt={primaryPhoto.caption || property.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant={property.status === 'available' ? 'default' : 'secondary'}>
              {property.status === 'available' ? 'Available' : property.status}
            </Badge>
          </div>

          {/* Favourite Button */}
          {showFavourite && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavouriteToggle?.();
              }}
            >
              <Heart className={cn('h-4 w-4', isFavourited && 'fill-red-500 text-red-500')} />
            </Button>
          )}

          {/* Photo Count */}
          {property.photos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
              {property.photos.length} photos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold text-primary">{formatCurrency(property.rent)}</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            {property.deposit && (
              <span className="text-xs text-muted-foreground">
                Deposit: {formatCurrency(property.deposit)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">
              {property.address}, {property.area}
            </span>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms} Bed</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms} Bath</span>
            </div>
            {property.size && (
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>{property.size} sqft</span>
              </div>
            )}
          </div>

          {/* Property Type */}
          <div className="mt-3 pt-3 border-t border-border">
            <Badge variant="outline" className="text-xs">
              {property.propertyType}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
