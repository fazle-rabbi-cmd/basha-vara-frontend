import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const mockFetchResponse = (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'content-type') {
          return 'application/json';
        }
        return null;
      },
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  });

  describe('Properties API', () => {
    it('should fetch properties', async () => {
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

      (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await apiClient.properties.getAll();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Test Property');
      expect(result.total).toBe(1);
    });
  });

  describe('Users API', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '+8801712345678',
        roles: ['TENANT'],
      };

      (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockUser));

      const result = await apiClient.users.updateMe({
        fullName: 'Updated Name',
      });

      expect(result.name).toBe('Test User');
    });
  });

  describe('Authentication', () => {
    it('should handle login', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['TENANT'],
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await apiClient.auth.login('test@example.com', 'password');
      expect(result.accessToken).toBe('test-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
