import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Maximize, Heart, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { useState } from 'react';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    area: string;
    bedrooms: number;
    bathrooms: number;
    size?: number;
    rent: number;
    status: string;
    photos: Array<{ url: string; isPrimary?: boolean }>;
  };
  onRemoveFavourite?: () => void;
  showFavouriteButton?: boolean;
  isFavourited?: boolean;
  onEdit?: (id: string) => void;
}

export function PropertyCard({
  property,
  onRemoveFavourite,
  showFavouriteButton = true,
  isFavourited = false,
  onEdit,
}: PropertyCardProps) {
  const primaryPhoto = property.photos.find((p) => p.isPrimary) || property.photos[0];
  const [imageError, setImageError] = useState(false);

  const isLandlordView = !!onEdit;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {isLandlordView ? (
        <>
          <div className="relative h-48 bg-muted">
            {!imageError && primaryPhoto?.url ? (
              <img
                src={primaryPhoto.url}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <Badge
              variant={getStatusBadgeVariant(property.status)}
              className="absolute top-3 right-3"
            >
              {property.status}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
              {property.title}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              {property.area}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                {property.bedrooms} Beds
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                {property.bathrooms} Baths
              </div>
              <div className="flex items-center">
                <Maximize className="h-4 w-4 mr-1" />
                {property.size || 'N/A'} sqft
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-primary">
                {formatCurrency(property.rent)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/properties/${property.id}`}>
                  View
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit && onEdit(property.id)}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </>
      ) : (
        <Link href={`/properties/${property.id}`}>
          <div className="relative h-48 bg-muted">
            {!imageError && primaryPhoto?.url ? (
              <img
                src={primaryPhoto.url}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <ImageOff className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <Badge
              variant={getStatusBadgeVariant(property.status)}
              className="absolute top-3 right-3"
            >
              {property.status}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
              {property.title}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              {property.area}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                {property.bedrooms} Beds
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                {property.bathrooms} Baths
              </div>
              <div className="flex items-center">
                <Maximize className="h-4 w-4 mr-1" />
                {property.size || 'N/A'} sqft
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-primary">
                {formatCurrency(property.rent)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              {showFavouriteButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onRemoveFavourite) {
                      onRemoveFavourite();
                    }
                  }}
                >
                  <Heart
                    className={`h-5 w-5 ${isFavourited ? 'fill-current text-primary' : ''}`}
                  />
                </Button>
              )}
            </div>
          </CardContent>
        </Link>
      )}
    </Card>
  );
}
