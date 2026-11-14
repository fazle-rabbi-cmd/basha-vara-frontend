import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propertyService } from '@/features/properties/property-service';
import { apiClient } from '@/lib/api-client';
import { Property, PropertySearchParams } from '@/types';

vi.mock('@/lib/api-client');

describe('PropertyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProperties', () => {
    it('should fetch properties with filters', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Test Property',
            rentAmount: 25000,
            bedrooms: 2,
            bathrooms: 2,
            area: 'Dhanmondi',
            city: 'Dhaka',
            status: 'PUBLISHED',
            propertyType: 'APARTMENT',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      };

      (apiClient.properties.getAll as any).mockResolvedValue(mockResponse);

      const params: PropertySearchParams = {
        filters: {
          area: 'Dhanmondi',
          minRent: 20000,
          maxRent: 30000,
        },
      };

      const result = await propertyService.getProperties(params);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(apiClient.properties.getAll).toHaveBeenCalledWith(params);
    });

    it('should handle API errors', async () => {
      (apiClient.properties.getAll as any).mockRejectedValue(new Error('API Error'));

      await expect(propertyService.getProperties()).rejects.toThrow('API Error');
    });
  });

  describe('getPropertyById', () => {
    it('should fetch property by ID', async () => {
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        rentAmount: 25000,
        bedrooms: 2,
        bathrooms: 2,
        area: 'Dhanmondi',
        city: 'Dhaka',
        status: 'PUBLISHED',
        propertyType: 'APARTMENT',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (apiClient.properties.getById as any).mockResolvedValue(mockProperty);

      const result = await propertyService.getPropertyById('1');

      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Property');
      expect(apiClient.properties.getById).toHaveBeenCalledWith('1');
    });

    it('should handle property not found', async () => {
      (apiClient.properties.getById as any).mockRejectedValue(new Error('Property not found'));

      await expect(propertyService.getPropertyById('invalid')).rejects.toThrow('Property not found');
    });
  });

  describe('createProperty', () => {
    it('should create new property', async () => {
      const newProperty = {
        title: 'New Property',
        description: 'A new property',
        propertyType: 'APARTMENT',
        rentAmount: 30000,
        bedrooms: 3,
        bathrooms: 2,
        area: 'Gulshan',
        city: 'Dhaka',
      };

      const mockResponse = {
        id: '2',
        ...newProperty,
        status: 'DRAFT',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (apiClient.properties.create as any).mockResolvedValue(mockResponse);

      const result = await propertyService.createProperty(newProperty as any);

      expect(result.id).toBe('2');
      expect(result.title).toBe('New Property');
      expect(apiClient.properties.create).toHaveBeenCalledWith(newProperty);
    });
  });
});
