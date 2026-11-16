import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  propertyService,
  clearPropertyCache,
  useProperties,
  useProperty,
} from '@/features/properties/property-service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const mockPaginated = (overrides: Record<string, any> = {}) => ({
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
  ...overrides,
});

describe('propertyService (extended)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPropertyCache();
  });

  describe('getProperties caching', () => {
    it('returns cached result within TTL without refetching', async () => {
      (apiClient.properties.getAll as any).mockResolvedValue(mockPaginated());

      const first = await propertyService.getProperties({ area: 'Dhanmondi' });
      const second = await propertyService.getProperties({ area: 'Dhanmondi' });

      expect(apiClient.properties.getAll).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
    });

    it('fetches again for different params (different cache key)', async () => {
      (apiClient.properties.getAll as any).mockResolvedValue(mockPaginated());

      await propertyService.getProperties({ area: 'Dhanmondi' });
      await propertyService.getProperties({ area: 'Gulshan' });

      expect(apiClient.properties.getAll).toHaveBeenCalledTimes(2);
    });

    it('accumulates unique areas into getUniqueAreas', async () => {
      (apiClient.properties.getAll as any).mockResolvedValue(
        mockPaginated({
          data: [
            { ...mockPaginated().data[0], area: 'NewArea1' },
            { ...mockPaginated().data[0], id: '2', area: 'NewArea2' },
          ],
        }),
      );

      await propertyService.getProperties({ area: 'X' });
      const areas = propertyService.getUniqueAreas();

      expect(areas).toContain('NewArea1');
      expect(areas).toContain('NewArea2');
      expect(areas).toContain('Dhanmondi'); // default areas retained
    });

    it('does not update areas when response data is empty', async () => {
      const before = propertyService.getUniqueAreas().length;
      (apiClient.properties.getAll as any).mockResolvedValue(mockPaginated({ data: [] }));
      await propertyService.getProperties({ area: 'Empty' });
      expect(propertyService.getUniqueAreas().length).toBe(before);
    });
  });

  describe('getPropertyById caching', () => {
    it('caches detail lookups', async () => {
      (apiClient.properties.getById as any).mockResolvedValue({ id: 'p1', title: 'Cached' });

      await propertyService.getPropertyById('p1');
      await propertyService.getPropertyById('p1');

      expect(apiClient.properties.getById).toHaveBeenCalledTimes(1);
    });

    it('caches different ids separately', async () => {
      (apiClient.properties.getById as any).mockImplementation((id: string) =>
        Promise.resolve({ id, title: `Prop ${id}` }),
      );

      await propertyService.getPropertyById('a');
      await propertyService.getPropertyById('b');
      await propertyService.getPropertyById('a');

      expect(apiClient.properties.getById).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCompatibleProperties', () => {
    it('fetches and caches compatible properties', async () => {
      (apiClient.properties.getCompatible as any).mockResolvedValue(mockPaginated());

      const result = await propertyService.getCompatibleProperties();
      expect(result.data).toHaveLength(1);
      expect(apiClient.properties.getCompatible).toHaveBeenCalledTimes(1);

      await propertyService.getCompatibleProperties();
      expect(apiClient.properties.getCompatible).toHaveBeenCalledTimes(1); // cached
    });
  });

  describe('getLandlordProperties', () => {
    it('delegates to getMyProperties with status', async () => {
      (apiClient.properties.getMyProperties as any).mockResolvedValue([mockPaginated().data[0]]);

      const result = await propertyService.getLandlordProperties('available' as any);
      expect(result).toHaveLength(1);
      expect(apiClient.properties.getMyProperties).toHaveBeenCalledWith('available');
    });

    it('works without status', async () => {
      (apiClient.properties.getMyProperties as any).mockResolvedValue([]);
      const result = await propertyService.getLandlordProperties();
      expect(result).toEqual([]);
      expect(apiClient.properties.getMyProperties).toHaveBeenCalledWith(undefined);
    });
  });

  describe('updateProperty', () => {
    it('clears cache and updates', async () => {
      (apiClient.properties.update as any).mockResolvedValue({ id: 'p1', title: 'Updated' });

      const result = await propertyService.updateProperty('p1', { title: 'Updated' } as any);
      expect(result?.title).toBe('Updated');
      expect(apiClient.properties.update).toHaveBeenCalledWith('p1', { title: 'Updated' });
    });

    it('propagates errors', async () => {
      (apiClient.properties.update as any).mockRejectedValue(new Error('Update failed'));
      await expect(propertyService.updateProperty('p1', {} as any)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteProperty', () => {
    it('returns true on success', async () => {
      (apiClient.properties.delete as any).mockResolvedValue(undefined);
      expect(await propertyService.deleteProperty('p1')).toBe(true);
    });

    it('returns false on failure', async () => {
      (apiClient.properties.delete as any).mockRejectedValue(new Error('Delete failed'));
      expect(await propertyService.deleteProperty('p1')).toBe(false);
    });
  });

  describe('incrementViewCount / getRentRange', () => {
    it('incrementViewCount is a no-op', async () => {
      await expect(propertyService.incrementViewCount('p1')).resolves.toBeUndefined();
    });

    it('getRentRange returns static range', () => {
      expect(propertyService.getRentRange()).toEqual({ min: 10000, max: 150000 });
    });
  });

  describe('clearPropertyCache', () => {
    it('forces refetch after clearing', async () => {
      (apiClient.properties.getAll as any).mockResolvedValue(mockPaginated());

      await propertyService.getProperties({});
      clearPropertyCache();
      await propertyService.getProperties({});

      expect(apiClient.properties.getAll).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useProperties hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPropertyCache();
  });

  it('fetches properties and sets pagination', async () => {
    (apiClient.properties.getAll as any).mockResolvedValue(
      mockPaginated({ total: 50, page: 2, limit: 12, totalPages: 5 }),
    );

    const { result } = renderHook(() => useProperties());

    await act(async () => {
      await result.current.fetchProperties({ area: 'Dhanmondi' });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.properties).toHaveLength(1);
    expect(result.current.pagination).toEqual({ total: 50, page: 2, limit: 12, totalPages: 5 });
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    (apiClient.properties.getAll as any).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useProperties());

    await act(async () => {
      await result.current.fetchProperties();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Network down');
    expect(result.current.properties).toEqual([]);
  });

  it('fetchProperty delegates to service', async () => {
    (apiClient.properties.getById as any).mockResolvedValue({ id: 'p9' });

    const { result } = renderHook(() => useProperties());
    const prop = await result.current.fetchProperty('p9');
    expect(prop?.id).toBe('p9');
  });
});

describe('useProperty hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPropertyCache();
  });

  it('loads property on mount', async () => {
    (apiClient.properties.getById as any).mockResolvedValue({ id: 'p1', title: 'Loaded' });

    const { result } = renderHook(() => useProperty('p1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.property?.title).toBe('Loaded');
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when id is empty', async () => {
    const { result } = renderHook(() => useProperty(''));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.properties.getById).not.toHaveBeenCalled();
  });

  it('sets error on failure', async () => {
    (apiClient.properties.getById as any).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useProperty('bad'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Not found');
    expect(result.current.property).toBeNull();
  });
});
