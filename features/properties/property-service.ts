// Property Service connecting to live backend API with fallback
import React from 'react';
import { Property, PropertySearchParams, PaginatedResponse, ListingStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { mockProperties } from '@/mocks/data';

let cachedAreas: string[] = ['Dhanmondi', 'Gulshan', 'Mirpur', 'Mirpur DOHS', 'Banani', 'Uttara', 'Bashundhara R/A', 'Mohammadpur'];

export const propertyService = {
  // Get all properties with optional filtering and pagination
  getProperties: async (params?: PropertySearchParams): Promise<PaginatedResponse<Property>> => {
    try {
      const res = await apiClient.properties.getAll(params);
      if (res.data && res.data.length > 0) {
        cachedAreas = Array.from(new Set([...cachedAreas, ...res.data.map((p) => p.area)])).sort();
        return res;
      }
      return res;
    } catch {
      // Fallback to local mock dataset
      let filtered = [...mockProperties];

      if (params?.searchQuery) {
        const query = params.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.area.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query),
        );
      }

      if (params?.filters) {
        const f = params.filters;
        if (f.area) filtered = filtered.filter((p) => p.area.toLowerCase() === f.area!.toLowerCase());
        if (f.minRent !== undefined) filtered = filtered.filter((p) => p.rent >= f.minRent!);
        if (f.maxRent !== undefined) filtered = filtered.filter((p) => p.rent <= f.maxRent!);
        if (f.bedrooms !== undefined) filtered = filtered.filter((p) => p.bedrooms >= f.bedrooms!);
        if (f.propertyType) filtered = filtered.filter((p) => p.propertyType === f.propertyType);
        if (f.status) filtered = filtered.filter((p) => p.status === f.status);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 12;
      const startIndex = (page - 1) * limit;

      return {
        data: filtered.slice(startIndex, startIndex + limit),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      };
    }
  },

  // Get property by ID
  getPropertyById: async (id: string): Promise<(Property & { isFavourited?: boolean }) | null> => {
    try {
      return await apiClient.properties.getById(id);
    } catch {
      const found = mockProperties.find((p) => p.id === id);
      return found || null;
    }
  },

  // Get landlord's own properties
  getLandlordProperties: async (status?: ListingStatus): Promise<Property[]> => {
    try {
      return await apiClient.properties.getLandlordMine(status);
    } catch {
      return mockProperties;
    }
  },

  // Create new property
  createProperty: async (property: Partial<Property>): Promise<Property> => {
    try {
      return await apiClient.properties.create(property);
    } catch (err) {
      throw err;
    }
  },

  // Update property
  updateProperty: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    try {
      return await apiClient.properties.update(id, updates);
    } catch (err) {
      throw err;
    }
  },

  // Delete / archive property
  deleteProperty: async (id: string): Promise<boolean> => {
    try {
      await apiClient.properties.delete(id);
      return true;
    } catch {
      return false;
    }
  },

  // Increment view count
  incrementViewCount: async (_id: string): Promise<void> => {
    // Handled automatically on backend when getting details
  },

  // Get unique areas for filter dropdown
  getUniqueAreas: (): string[] => {
    return cachedAreas;
  },

  // Get rent range for filter
  getRentRange: (): { min: number; max: number } => {
    return { min: 10000, max: 150000 };
  },
};

// React hook for property data
export const useProperties = () => {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });

  const fetchProperties = async (params?: PropertySearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await propertyService.getProperties(params);
      setProperties(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProperty = async (id: string) => {
    return propertyService.getPropertyById(id);
  };

  return {
    properties,
    isLoading,
    error,
    pagination,
    fetchProperties,
    fetchProperty,
  };
};

// React hook for single property
export const useProperty = (id: string) => {
  const [property, setProperty] = React.useState<(Property & { isFavourited?: boolean }) | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await propertyService.getPropertyById(id);
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch property');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  return {
    property,
    isLoading,
    error,
  };
};
