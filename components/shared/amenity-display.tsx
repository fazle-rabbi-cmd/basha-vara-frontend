'use client';

import { Amenity } from '@/types';
import { Wind, Flame, Droplets, Zap, Shield, Camera, ArrowUpDown, BatteryCharging, Car, Wifi, Sun, Building } from 'lucide-react';

interface AmenityDisplayProps {
  amenities: Amenity[];
}

const amenityIcons: Record<string, any> = {
  'air-conditioning': Wind,
  'gas-connection': Flame,
  'water-supply': Droplets,
  'electricity': Zap,
  'security-guard': Shield,
  'cctv': Camera,
  'lift-elevator': ArrowUpDown,
  'generator-backup': BatteryCharging,
  'parking': Car,
  'wifi-internet': Wifi,
  'balcony': Sun,
  'rooftop-access': Building,
};

export function AmenityDisplay({ amenities }: AmenityDisplayProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  const getIcon = (slug: string) => {
    const IconComponent = amenityIcons[slug] || Sun;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">Amenities</h3>
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-2">
        {amenities.map((amenity: Amenity) => (
          <div key={amenity.id} className="flex items-center text-sm text-muted-foreground min-w-0">
            <div className="mr-2 shrink-0 text-primary">
              {getIcon(amenity.slug)}
            </div>
            <span className="break-words min-w-0">{amenity.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
