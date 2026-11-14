// Property Service connecting to live backend API
import React from 'react';
import { Property, PropertySearchParams, PaginatedResponse, ListingStatus } from '@/types';
import { apiClient } from '@/lib/api-client';

let cachedAreas: string[] = ['Dhanmondi', 'Gulshan', 'Mirpur', 'Mirpur DOHS', 'Banani', 'Uttara', 'Bashundhara R/A', 'Mohammadpur'];

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const propertiesCache = new Map<string, CacheEntry<PaginatedResponse<Property>>>();
const propertyDetailCache = new Map<string, CacheEntry<(Property & { isFavourited?: boolean }) | null>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export const clearPropertyCache = () => {
  propertiesCache.clear();
  propertyDetailCache.clear();
};

export const propertyService = {
  // Get all properties with optional filtering and pagination
  getProperties: async (params?: PropertySearchParams): Promise<PaginatedResponse<Property>> => {
    const cacheKey = JSON.stringify(params || {});
    const cached = propertiesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const res = await apiClient.properties.getAll(params);
    if (res.data && res.data.length > 0) {
      cachedAreas = Array.from(new Set([...cachedAreas, ...res.data.map((p) => p.area)])).sort();
    }
    propertiesCache.set(cacheKey, { data: res, timestamp: Date.now() });
    return res;
  },

  // Get property by ID
  getPropertyById: async (id: string): Promise<(Property & { isFavourited?: boolean }) | null> => {
    const cached = propertyDetailCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const res = await apiClient.properties.getById(id);
    propertyDetailCache.set(id, { data: res, timestamp: Date.now() });
    return res;
  },

  // Get compatible properties for tenant based on profile
  getCompatibleProperties: async (params?: PropertySearchParams): Promise<PaginatedResponse<Property>> => {
    const cacheKey = `compatible-${JSON.stringify(params || {})}`;
    const cached = propertiesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const res = await apiClient.properties.getCompatible(params);
    propertiesCache.set(cacheKey, { data: res, timestamp: Date.now() });
    return res;
  },

  // Get landlord's own properties
  getLandlordProperties: async (status?: ListingStatus): Promise<Property[]> => {
    return await apiClient.properties.getMyProperties(status);
  },

  // Create new property
  createProperty: async (property: Partial<Property>): Promise<Property> => {
    clearPropertyCache();
    try {
      return await apiClient.properties.create(property);
    } catch (err) {
      throw err;
    }
  },

  // Update property
  updateProperty: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    clearPropertyCache();
    try {
      return await apiClient.properties.update(id, updates);
    } catch (err) {
      throw err;
    }
  },

  // Delete / archive property
  deleteProperty: async (id: string): Promise<boolean> => {
    clearPropertyCache();
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

  const fetchProperties = React.useCallback(async (params?: PropertySearchParams) => {
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
  }, []);

  const fetchProperty = React.useCallback(async (id: string) => {
    return propertyService.getPropertyById(id);
  }, []);

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
