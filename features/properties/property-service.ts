// Property Service for Prototype
// Manages property data with local state management

import React from 'react';
import { Property, PropertySearchParams, PaginatedResponse } from '@/types';
import { mockProperties, getPropertyById } from '@/mocks/data';

// In-memory state for prototype (resets on refresh)
const propertiesState: Property[] = [...mockProperties];

export const propertyService = {
  // Get all properties with optional filtering and pagination
  getProperties: async (params?: PropertySearchParams): Promise<PaginatedResponse<Property>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...propertiesState];

    // Apply search query
    if (params?.searchQuery) {
      const query = params.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.area.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (params?.filters) {
      const filters = params.filters;
      
      if (filters.area !== undefined) {
        filtered = filtered.filter(p => p.area.toLowerCase() === filters.area!.toLowerCase());
      }
      
      if (filters.minRent !== undefined) {
        filtered = filtered.filter(p => p.rent >= filters.minRent!);
      }
      
      if (filters.maxRent !== undefined) {
        filtered = filtered.filter(p => p.rent <= filters.maxRent!);
      }
      
      if (filters.bedrooms !== undefined) {
        filtered = filtered.filter(p => p.bedrooms === filters.bedrooms);
      }
      
      if (filters.propertyType) {
        filtered = filtered.filter(p => p.propertyType === filters.propertyType);
      }
      
      if (filters.status) {
        filtered = filtered.filter(p => p.status === filters.status);
      }
    }

    // Apply sorting
    if (params?.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (params.sortBy) {
          case 'rent':
            comparison = a.rent - b.rent;
            break;
          case 'bedrooms':
            comparison = a.bedrooms - b.bedrooms;
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'popularity':
            comparison = b.viewCount - a.viewCount;
            break;
        }
        return params.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  },

  // Get property by ID
  getPropertyById: async (id: string): Promise<Property | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return getPropertyById(id) || null;
  },

  // Create new property
  createProperty: async (property: Omit<Property, 'id' | 'viewCount' | 'favouriteCount' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newProperty: Property = {
      ...property,
      id: `property-${Date.now()}`,
      viewCount: 0,
      favouriteCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    propertiesState.push(newProperty);
    return newProperty;
  },

  // Update property
  updateProperty: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = propertiesState.findIndex(p => p.id === id);
    if (index === -1) return null;

    propertiesState[index] = {
      ...propertiesState[index],
      ...updates,
      updatedAt: new Date(),
    };

    return propertiesState[index];
  },

  // Delete property (soft delete by archiving)
  deleteProperty: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = propertiesState.findIndex(p => p.id === id);
    if (index === -1) return false;

    propertiesState[index].status = 'archived';
    propertiesState[index].updatedAt = new Date();
    return true;
  },

  // Increment view count
  incrementViewCount: async (id: string): Promise<void> => {
    const property = propertiesState.find(p => p.id === id);
    if (property) {
      property.viewCount += 1;
    }
  },

  // Get unique areas for filter dropdown
  getUniqueAreas: (): string[] => {
    const areas = new Set(propertiesState.map(p => p.area));
    return Array.from(areas).sort();
  },

  // Get rent range for filter
  getRentRange: (): { min: number; max: number } => {
    if (propertiesState.length === 0) return { min: 0, max: 100000 };
    const rents = propertiesState.map(p => p.rent);
    return {
      min: Math.min(...rents),
      max: Math.max(...rents),
    };
  },
};

// React hook for property data
export const useProperties = () => {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProperties = async (params?: PropertySearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await propertyService.getProperties(params);
      setProperties(response.data);
      return response;
    } catch {
      setError('Failed to fetch properties');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProperty = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const property = await propertyService.getPropertyById(id);
      return property;
    } catch {
      setError('Failed to fetch property');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createProperty = async (property: Omit<Property, 'id' | 'viewCount' | 'favouriteCount' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newProperty = await propertyService.createProperty(property);
      setProperties(prev => [...prev, newProperty]);
      return newProperty;
    } catch {
      setError('Failed to create property');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await propertyService.updateProperty(id, updates);
      if (updated) {
        setProperties(prev => prev.map(p => p.id === id ? updated : p));
      }
      return updated;
    } catch {
      setError('Failed to update property');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await propertyService.deleteProperty(id);
      if (success) {
        setProperties(prev => prev.filter(p => p.id !== id));
      }
      return success;
    } catch {
      setError('Failed to delete property');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    properties,
    isLoading,
    error,
    fetchProperties,
    fetchProperty,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};
