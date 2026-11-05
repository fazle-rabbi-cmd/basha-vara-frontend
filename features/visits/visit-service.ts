// Visit Service connected to live backend API
import React from 'react';
import { VisitRequest, VisitStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { mockVisitRequests } from '@/mocks/data';

const fallbackVisits: VisitRequest[] = [...mockVisitRequests];

export const visitService = {
  // Get visit requests for tenant
  getVisitsByTenant: async (_tenantId: string): Promise<VisitRequest[]> => {
    try {
      return await apiClient.visits.getMyVisits();
    } catch {
      return fallbackVisits;
    }
  },

  // Get visit requests for landlord
  getVisitsByLandlord: async (_landlordId: string): Promise<any[]> => {
    try {
      return await apiClient.visits.getLandlordVisits();
    } catch {
      return fallbackVisits;
    }
  },

  // Get visit requests for property
  getVisitsByProperty: async (propertyId: string): Promise<VisitRequest[]> => {
    try {
      const all = await apiClient.visits.getLandlordVisits();
      return all.filter((v: any) => v.propertyId === propertyId);
    } catch {
      return fallbackVisits.filter((v) => v.propertyId === propertyId);
    }
  },

  // Create visit request
  createVisitRequest: async (visit: {
    propertyId: string;
    requestedDate: Date | string;
    requestedTime: string;
    notes?: string;
  }): Promise<any> => {
    try {
      return await apiClient.visits.create(visit.propertyId, {
        requestedDate: visit.requestedDate,
        requestedTime: visit.requestedTime,
        message: visit.notes,
      });
    } catch (err: any) {
      throw err;
    }
  },

  // Update visit status
  updateVisitStatus: async (id: string, status: VisitStatus): Promise<any> => {
    try {
      return await apiClient.visits.updateStatus(id, status);
    } catch (err: any) {
      const idx = fallbackVisits.findIndex((v) => v.id === id);
      if (idx !== -1) {
        fallbackVisits[idx].status = status;
        return fallbackVisits[idx];
      }
      throw err;
    }
  },

  // Cancel visit request
  cancelVisitRequest: async (id: string): Promise<boolean> => {
    try {
      await apiClient.visits.updateStatus(id, 'CANCELLED');
      return true;
    } catch {
      return false;
    }
  },
};

export const useVisits = (arg1?: string, arg2?: string) => {
  let userRole: 'tenant' | 'landlord' = 'tenant';
  let userId: string = '';

  if (arg1 === 'tenant' || arg1 === 'landlord') {
    userRole = arg1;
    userId = arg2 || '';
  } else if (arg2 === 'tenant' || arg2 === 'landlord') {
    userRole = arg2;
    userId = arg1 || '';
  } else {
    userId = arg1 || '';
  }

  const [visits, setVisits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchVisits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: any[] = [];
      if (userRole === 'landlord') {
        data = await visitService.getVisitsByLandlord(userId);
      } else {
        data = await visitService.getVisitsByTenant(userId);
      }
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch visits');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: VisitStatus) => {
    try {
      await visitService.updateVisitStatus(id, status);
      setVisits((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v)),
      );
      return true;
    } catch {
      return false;
    }
  };

  const cancelVisit = async (id: string) => {
    return visitService.cancelVisitRequest(id);
  };

  const acceptVisit = async (id: string) => {
    return visitService.updateVisitStatus(id, 'confirmed' as VisitStatus);
  };

  const declineVisit = async (id: string) => {
    return visitService.updateVisitStatus(id, 'cancelled' as VisitStatus);
  };

  return {
    visits,
    isLoading,
    error,
    fetchVisits,
    updateStatus,
    cancelVisit,
    acceptVisit,
    declineVisit,
  };
};
