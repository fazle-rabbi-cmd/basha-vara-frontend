'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Maximize, Heart, ImageOff, Camera, Pencil, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PropertyStatusPill } from '@/components/shared/property-status-pill';
import { formatCurrency } from '@/lib/utils';
import { useState, memo } from 'react';

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
  onToggleFavourite?: (propertyId: string) => void;
  showFavouriteButton?: boolean;
  isFavourited?: boolean;
  onEdit?: (id: string) => void;
}

export const PropertyCard = memo(function PropertyCard({
  property,
  onToggleFavourite,
  showFavouriteButton = true,
  isFavourited = false,
  onEdit,
}: PropertyCardProps) {
  const primaryPhoto = property.photos.find((p) => p.isPrimary) || property.photos[0];
  const [imageError, setImageError] = useState(false);
  const hasPhoto = !!primaryPhoto?.url && !imageError;
  const photoCount = property.photos.length;

  const isLandlordView = !!onEdit;
  const detailsHref = `/properties/${property.id}`;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/40">
      {/* Media */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {hasPhoto ? (
          <>
            <Image
              src={primaryPhoto.url}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
            {/* Soft gradient: chip gulo bright photo te-o readable rakhe */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-10 w-10" />
            <span className="text-xs font-medium">No photo available</span>
          </div>
        )}

        {/* Favourite (tenant view). Link er baire, tai valid HTML ar click conflict nai */}
        {!isLandlordView && showFavouriteButton && (
          <button
            type="button"
            aria-label={isFavourited ? 'Remove from favourites' : 'Save to favourites'}
            aria-pressed={isFavourited}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavourite?.(property.id);
            }}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Heart className={`h-[18px] w-[18px] ${isFavourited ? 'fill-current text-primary' : ''}`} />
          </button>
        )}

        {/* Photo count */}
        {hasPhoto && photoCount > 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
            <Camera className="h-3 w-3" aria-hidden="true" />
            {photoCount}
          </span>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Price first: rental decision er sobcheye important info */}
        <div className="mb-1 flex items-baseline gap-1">
          <span className="text-xl font-bold leading-none text-primary">{formatCurrency(property.rent)}</span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>

        {/* Title + status: status ekhon image er upor na, title er pashe, jate always readable thake */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground">
            {isLandlordView ? (
              <span className="line-clamp-1">{property.title}</span>
            ) : (
              // Stretched link: pura card clickable, kintu heart button alada thake
              <Link
                href={detailsHref}
                className="line-clamp-1 focus:outline-none after:absolute after:inset-0 after:z-0 after:content-['']"
              >
                {property.title}
              </Link>
            )}
          </h3>
          <PropertyStatusPill status={property.status} />
        </div>

        <div className="mt-1 flex min-w-0 items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{property.area}</span>
        </div>

        {/* Specs */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-sm">
          <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <Bed className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              <span className="font-medium text-foreground">{property.bedrooms}</span> Beds
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <Bath className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              <span className="font-medium text-foreground">{property.bathrooms}</span> Baths
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <Maximize className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {property.size ? (
                <>
                  <span className="font-medium text-foreground">{property.size}</span> sqft
                </>
              ) : (
                'N/A'
              )}
            </span>
          </div>
        </div>

        {/* Landlord actions */}
        {isLandlordView && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10" asChild>
              <Link href={detailsHref}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
            <Button variant="outline" className="h-10" onClick={() => onEdit?.(property.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});