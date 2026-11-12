'use client';

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Amenity } from '@/types';
import { Wind, Flame, Droplets, Zap, Shield, Camera, ArrowUpDown, BatteryCharging, Car, Wifi, Sun, Building, Plus } from 'lucide-react';

interface AmenitySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

const categoryLabels: Record<string, string> = {
  ESSENTIAL: 'Essential',
  LUXURY: 'Luxury',
  SAFETY: 'Safety',
  UTILITY: 'Utility',
};

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

export function AmenitySelector({ selectedIds, onChange, disabled }: AmenitySelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [customAmenityName, setCustomAmenityName] = useState('');
  const [customAmenityCategory, setCustomAmenityCategory] = useState('UTILITY');

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        const data = await apiClient.properties.getAmenities();
        setAmenities(data);
      } catch (error) {
        console.error('Failed to load amenities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAmenities();
  }, []);

  const groupedAmenities = amenities.reduce((acc, amenity) => {
    const category = amenity.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);

  const toggleAmenity = (amenityId: string) => {
    if (selectedIds.includes(amenityId)) {
      onChange(selectedIds.filter((id) => id !== amenityId));
    } else {
      onChange([...selectedIds, amenityId]);
    }
  };

  const getIcon = (slug: string) => {
    const IconComponent = amenityIcons[slug] || Sun;
    return <IconComponent className="h-4 w-4" />;
  };

  const handleCreateCustomAmenity = async () => {
    if (!customAmenityName.trim()) return;

    setIsCreating(true);
    try {
      const newAmenity = await apiClient.properties.createCustomAmenity({
        name: customAmenityName.trim(),
        category: customAmenityCategory,
      });
      setAmenities([...amenities, newAmenity]);
      setCustomAmenityName('');
      onChange([...selectedIds, newAmenity.id]);
    } catch (error: any) {
      console.error('Failed to create custom amenity:', error);
      alert(error.message || 'Failed to create custom amenity');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Label>Property Amenities</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Property Amenities</Label>
      <p className="text-xs text-muted-foreground">Select amenities available at your property</p>
      
      {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            {categoryLabels[category] || category}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryAmenities.map((amenity) => (
              <div
                key={amenity.id}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors
                  ${selectedIds.includes(amenity.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !disabled && toggleAmenity(amenity.id)}
              >
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={selectedIds.includes(amenity.id)}
                  disabled={disabled}
                  className="pointer-events-none"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="text-muted-foreground">
                    {getIcon(amenity.slug)}
                  </div>
                  <Label
                    htmlFor={`amenity-${amenity.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {amenity.name}
                    {amenity.isCustom && <span className="ml-1 text-xs text-muted-foreground">(Custom)</span>}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-medium text-foreground">Add Custom Amenity</h4>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 24/7 Security Guard"
            value={customAmenityName}
            onChange={(e) => setCustomAmenityName(e.target.value)}
            disabled={disabled || isCreating}
            className="flex-1"
          />
          <select
            value={customAmenityCategory}
            onChange={(e) => setCustomAmenityCategory(e.target.value)}
            disabled={disabled || isCreating}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="ESSENTIAL">Essential</option>
            <option value="LUXURY">Luxury</option>
            <option value="SAFETY">Safety</option>
            <option value="UTILITY">Utility</option>
          </select>
          <Button
            type="button"
            onClick={handleCreateCustomAmenity}
            disabled={disabled || isCreating || !customAmenityName.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      
      {selectedIds.length === 0 && (
        <p className="text-xs text-muted-foreground">No amenities selected</p>
      )}
    </div>
  );
}
