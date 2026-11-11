// Favourite Service connected to live backend API
import React from 'react';
import { Favourite } from '@/types';
import { apiClient } from '@/lib/api-client';

export const favouriteService = {
  // Get all favourites for tenant
  getFavouritesByTenant: async (tenantId: string): Promise<Favourite[]> => {
    const properties = await apiClient.favourites.getMyFavourites();
    return properties.map((p) => ({
      id: `fav-${p.id}`,
      tenantId,
      propertyId: p.id,
      createdAt: p.createdAt,
    }));
  },

  // Add favourite
  addFavourite: async (tenantId: string, propertyId: string): Promise<Favourite> => {
    await apiClient.favourites.add(propertyId);
    const newFav: Favourite = {
      id: `fav-${propertyId}`,
      tenantId,
      propertyId,
      createdAt: new Date(),
    };
    return newFav;
  },

  // Remove favourite
  removeFavourite: async (tenantId: string, propertyId: string): Promise<boolean> => {
    await apiClient.favourites.remove(propertyId);
    return true;
  },

  // Toggle favourite
  toggleFavourite: async (tenantId: string, propertyId: string, currentStatus?: boolean): Promise<{ isFavourited: boolean }> => {
    if (currentStatus) {
      await favouriteService.removeFavourite(tenantId, propertyId);
      return { isFavourited: false };
    } else {
      await favouriteService.addFavourite(tenantId, propertyId);
      return { isFavourited: true };
    }
  },
};

export const useFavourites = (tenantId: string, userRole?: string) => {
  const [favourites, setFavourites] = React.useState<Favourite[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchFavourites = React.useCallback(async () => {
    if (!tenantId || userRole !== 'tenant') return [];
    setIsLoading(true);
    try {
      const data = await favouriteService.getFavouritesByTenant(tenantId);
      setFavourites(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, userRole]);

  const toggleFavourite = React.useCallback(async (propertyId: string) => {
    if (userRole !== 'tenant') {
      throw new Error('Only tenants can save favourites');
    }
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
  }, [favourites, tenantId, userRole]);

  const isFavourited = React.useCallback((propertyId: string): boolean => {
    return favourites.some((f) => f.propertyId === propertyId);
  }, [favourites]);

  return {
    favourites,
    isLoading,
    fetchFavourites,
    toggleFavourite,
    isFavourited,
  };
};
