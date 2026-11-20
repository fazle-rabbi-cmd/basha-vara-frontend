'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Maximize, Heart, ImageOff, Camera, Pencil, Eye, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PropertyStatusPill } from '@/components/shared/property-status-pill';
import { formatCurrency } from '@/lib/utils';
import { useState, memo } from 'react';
import { usePlatform } from '@/lib/platform/platform-context';

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
    isVerified?: boolean;
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
  const { triggerHaptic } = usePlatform();
  const primaryPhoto = property.photos.find((p) => p.isPrimary) || property.photos[0];
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasPhoto = !!primaryPhoto?.url && !imageError;
  const photoCount = property.photos.length;

  const isLandlordView = !!onEdit;
  const detailsHref = `/properties/${property.id}`;

  const handleFavouriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic();
    onToggleFavourite?.(property.id);
  };

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-teal-500/40 hover:-translate-y-1 active:scale-[0.99] focus-within:ring-2 focus-within:ring-primary/40">
      {/* Media Container */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted">
        {hasPhoto ? (
          <>
            <Image
              src={primaryPhoto.url}
              alt={property.title}
              fill
              className={`object-cover transition-all duration-700 ease-out group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {/* Soft gradient scrim */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15" />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-10 w-10 stroke-[1.5]" />
            <span className="text-xs font-medium">No photo available</span>
          </div>
        )}

        {/* Status Pill on top-left of image */}
        <div className="absolute left-3 top-3 z-10">
          <PropertyStatusPill status={property.status} />
        </div>

        {/* Favourite Button (top right) */}
        {!isLandlordView && showFavouriteButton && (
          <button
            type="button"
            aria-label={isFavourited ? 'Remove from favourites' : 'Save to favourites'}
            aria-pressed={isFavourited}
            onClick={handleFavouriteClick}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur-md transition-all hover:bg-background hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Heart
              className={`h-[18px] w-[18px] transition-colors ${
                isFavourited ? 'fill-rose-500 text-rose-500' : 'text-foreground/80 hover:text-foreground'
              }`}
            />
          </button>
        )}

        {/* Photo count pill */}
        {hasPhoto && photoCount > 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md shadow-sm">
            <Camera className="h-3 w-3" aria-hidden="true" />
            {photoCount}
          </span>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Price Tag */}
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
              {formatCurrency(property.rent)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">/ month</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="min-w-0 text-base font-bold leading-snug text-foreground">
          {isLandlordView ? (
            <span className="line-clamp-1">{property.title}</span>
          ) : (
            <Link
              href={detailsHref}
              className="line-clamp-1 hover:text-primary transition-colors focus:outline-none after:absolute after:inset-0 after:z-0 after:content-['']"
            >
              {property.title}
            </Link>
          )}
        </h3>

        {/* Location */}
        <div className="mt-1.5 flex min-w-0 items-center text-xs font-medium text-muted-foreground">
          <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden="true" />
          <span className="truncate">{property.area}</span>
        </div>

        {/* Specs Pill Rail */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bed className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden="true" />
            <span className="truncate">
              <strong className="font-semibold text-foreground">{property.bedrooms}</strong> Beds
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bath className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden="true" />
            <span className="truncate">
              <strong className="font-semibold text-foreground">{property.bathrooms}</strong> Baths
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Maximize className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden="true" />
            <span className="truncate">
              {property.size ? (
                <>
                  <strong className="font-semibold text-foreground">{property.size}</strong> sqft
                </>
              ) : (
                'N/A'
              )}
            </span>
          </div>
        </div>

        {/* Landlord Actions */}
        {isLandlordView && (
          <div className="mt-4 grid grid-cols-2 gap-2 relative z-10">
            <Button variant="outline" size="sm" className="h-9 rounded-xl" asChild>
              <Link href={detailsHref}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            <Button variant="secondary" size="sm" className="h-9 rounded-xl" onClick={() => onEdit?.(property.id)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});