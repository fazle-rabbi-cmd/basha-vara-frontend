import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PropertyCard } from '@/components/shared/property-card';
import { Property } from '@/types';

const mockProperty: Property = {
  id: '1',
  landlordId: 'landlord-1',
  title: 'Test Apartment',
  description: 'A nice apartment',
  propertyType: 'APARTMENT',
  address: '123 Test St',
  area: 'Dhanmondi',
  city: 'Dhaka',
  rent: 25000,
  deposit: 50000,
  size: 1200,
  bedrooms: 2,
  bathrooms: 2,
  floor: 3,
  totalFloors: 10,
  availableFrom: new Date('2024-01-01'),
  status: 'available',
  amenities: [],
  photos: [],
  viewCount: 100,
  favouriteCount: 5,
  lat: 23.7461,
  lng: 90.3742,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('PropertyCard', () => {
  it('renders property information correctly', () => {
    render(<PropertyCard property={mockProperty} />);
    
    expect(screen.getByText('Test Apartment')).toBeInTheDocument();
    expect(screen.getByText('Dhanmondi')).toBeInTheDocument();
    expect(screen.getByText('৳25,000')).toBeInTheDocument();
    expect(screen.getByText('Beds')).toBeInTheDocument();
    expect(screen.getByText('Baths')).toBeInTheDocument();
  });

  it('shows property status', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows favourite button', () => {
    render(<PropertyCard property={mockProperty} />);
    const favouriteButton = screen.getByRole('button', { name: /favourite/i });
    expect(favouriteButton).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalProperty = {
      ...mockProperty,
      deposit: undefined,
      size: undefined,
      floor: undefined,
      totalFloors: undefined,
      lat: undefined,
      lng: undefined,
    };
    
    render(<PropertyCard property={minimalProperty} />);
    expect(screen.getByText('Test Apartment')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onToggleFavourite = vi.fn();
    render(<PropertyCard property={mockProperty} onToggleFavourite={onToggleFavourite} />);
    
    const favouriteButton = screen.getByRole('button', { name: /favourite/i });
    favouriteButton.click();
    
    await waitFor(() => {
      expect(onToggleFavourite).toHaveBeenCalledWith('1');
    });
  });
});
