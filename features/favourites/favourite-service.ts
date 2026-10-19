// Favourite Service for Prototype
// Manages favourite properties with local state management

import React from 'react';
import { Favourite } from '@/types';
import { mockFavourites } from '@/mocks/data';

// In-memory state for prototype (resets on refresh)
const favouritesState: Favourite[] = [...mockFavourites];

export const favouriteService = {
  // Get all favourites for a tenant
  getFavouritesByTenant: async (tenantId: string): Promise<Favourite[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return favouritesState.filter(f => f.tenantId === tenantId);
  },

  // Check if property is favourited by tenant
  isFavourited: (tenantId: string, propertyId: string): boolean => {
    return favouritesState.some(f => f.tenantId === tenantId && f.propertyId === propertyId);
  },

  // Add favourite
  addFavourite: async (tenantId: string, propertyId: string): Promise<Favourite> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if already favourited
    const existing = favouritesState.find(f => f.tenantId === tenantId && f.propertyId === propertyId);
    if (existing) return existing;

    const newFavourite: Favourite = {
      id: `favourite-${Date.now()}`,
      tenantId,
      propertyId,
      createdAt: new Date(),
    };

    favouritesState.push(newFavourite);
    return newFavourite;
  },

  // Remove favourite
  removeFavourite: async (tenantId: string, propertyId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = favouritesState.findIndex(f => f.tenantId === tenantId && f.propertyId === propertyId);
    if (index === -1) return false;

    favouritesState.splice(index, 1);
    return true;
  },

  // Toggle favourite
  toggleFavourite: async (tenantId: string, propertyId: string): Promise<{ isFavourited: boolean }> => {
    const isFavourited = favouriteService.isFavourited(tenantId, propertyId);
    
    if (isFavourited) {
      await favouriteService.removeFavourite(tenantId, propertyId);
      return { isFavourited: false };
    } else {
      await favouriteService.addFavourite(tenantId, propertyId);
      return { isFavourited: true };
    }
  },
};

// React hook for favourites
export const useFavourites = (tenantId: string) => {
  const [favourites, setFavourites] = React.useState<Favourite[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchFavourites = async () => {
    setIsLoading(true);
    try {
      const data = await favouriteService.getFavouritesByTenant(tenantId);
      setFavourites(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavourite = async (propertyId: string) => {
    const result = await favouriteService.toggleFavourite(tenantId, propertyId);
    if (result.isFavourited) {
      // Add to local state
      const newFavourite: Favourite = {
        id: `favourite-${Date.now()}`,
        tenantId,
        propertyId,
        createdAt: new Date(),
      };
      setFavourites(prev => [...prev, newFavourite]);
    } else {
      // Remove from local state
      setFavourites(prev => prev.filter(f => f.propertyId !== propertyId));
    }
    return result;
  };

  const isFavourited = (propertyId: string): boolean => {
    return favourites.some(f => f.propertyId === propertyId);
  };

  return {
    favourites,
    isLoading,
    fetchFavourites,
    toggleFavourite,
    isFavourited,
  };
};
