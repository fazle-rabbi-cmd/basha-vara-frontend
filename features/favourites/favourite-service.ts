// Favourite Service connected to live backend API
import React from 'react';
import { Favourite } from '@/types';
import { apiClient } from '@/lib/api-client';
import { mockFavourites } from '@/mocks/data';

const fallbackFavourites: Favourite[] = [...mockFavourites];

export const favouriteService = {
  // Get all favourites for tenant
  getFavouritesByTenant: async (tenantId: string): Promise<Favourite[]> => {
    try {
      const properties = await apiClient.favourites.getMyFavourites();
      return properties.map((p) => ({
        id: `fav-${p.id}`,
        tenantId,
        propertyId: p.id,
        createdAt: p.createdAt,
      }));
    } catch {
      return fallbackFavourites.filter((f) => f.tenantId === tenantId);
    }
  },

  // Add favourite
  addFavourite: async (tenantId: string, propertyId: string): Promise<Favourite> => {
    try {
      await apiClient.favourites.add(propertyId);
    } catch (e: any) {
      // 409 Conflict means already favourited
      if (e.statusCode !== 409) {
        console.warn('Live API favourite add fallback', e);
      }
    }

    const newFav: Favourite = {
      id: `fav-${propertyId}`,
      tenantId,
      propertyId,
      createdAt: new Date(),
    };
    if (!fallbackFavourites.some((f) => f.propertyId === propertyId && f.tenantId === tenantId)) {
      fallbackFavourites.push(newFav);
    }
    return newFav;
  },

  // Remove favourite
  removeFavourite: async (tenantId: string, propertyId: string): Promise<boolean> => {
    try {
      await apiClient.favourites.remove(propertyId);
    } catch (e) {
      console.warn('Live API favourite remove fallback', e);
    }

    const idx = fallbackFavourites.findIndex((f) => f.propertyId === propertyId && f.tenantId === tenantId);
    if (idx !== -1) {
      fallbackFavourites.splice(idx, 1);
    }
    return true;
  },

  // Toggle favourite
  toggleFavourite: async (tenantId: string, propertyId: string, currentStatus?: boolean): Promise<{ isFavourited: boolean }> => {
    const isCurrentlyFav = currentStatus ?? fallbackFavourites.some((f) => f.propertyId === propertyId && f.tenantId === tenantId);

    if (isCurrentlyFav) {
      await favouriteService.removeFavourite(tenantId, propertyId);
      return { isFavourited: false };
    } else {
      await favouriteService.addFavourite(tenantId, propertyId);
      return { isFavourited: true };
    }
  },
};

export const useFavourites = (tenantId: string) => {
  const [favourites, setFavourites] = React.useState<Favourite[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchFavourites = async () => {
    if (!tenantId) return [];
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
    const isFav = favourites.some((f) => f.propertyId === propertyId);
    const result = await favouriteService.toggleFavourite(tenantId, propertyId, isFav);

    if (result.isFavourited) {
      const newFav: Favourite = {
        id: `fav-${propertyId}`,
        tenantId,
        propertyId,
        createdAt: new Date(),
      };
      setFavourites((prev) => [...prev, newFav]);
    } else {
      setFavourites((prev) => prev.filter((f) => f.propertyId !== propertyId));
    }
    return result;
  };

  const isFavourited = (propertyId: string): boolean => {
    return favourites.some((f) => f.propertyId === propertyId);
  };

  return {
    favourites,
    isLoading,
    fetchFavourites,
    toggleFavourite,
    isFavourited,
  };
};
