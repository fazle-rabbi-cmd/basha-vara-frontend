// Visit Service connected to live backend API
import React from 'react';
import { VisitRequest, VisitStatus } from '@/types';
import { apiClient } from '@/lib/api-client';

export const visitService = {
  // Get visit requests for tenant
  getVisitsByTenant: async (_tenantId: string): Promise<VisitRequest[]> => {
    return await apiClient.visits.getMyVisits();
  },

  // Get visit requests for landlord
  getVisitsByLandlord: async (_landlordId: string): Promise<any[]> => {
    return await apiClient.visits.getLandlordVisits();
  },

  // Get visit requests for property
  getVisitsByProperty: async (propertyId: string): Promise<VisitRequest[]> => {
    const all = await apiClient.visits.getLandlordVisits();
    return all.filter((v: any) => v.propertyId === propertyId);
  },

  // Create visit request
  createVisitRequest: async (visit: {
    propertyId: string;
    requestedDate: Date | string;
    requestedTime: string;
    notes?: string;
  }): Promise<any> => {
    return await apiClient.visits.create(visit.propertyId, {
      requestedDate: visit.requestedDate,
      requestedTime: visit.requestedTime,
      message: visit.notes,
    });
  },

  // Update visit status
  updateVisitStatus: async (id: string, status: VisitStatus): Promise<any> => {
    return await apiClient.visits.updateStatus(id, status);
  },

  // Cancel visit request
  cancelVisitRequest: async (id: string): Promise<boolean> => {
    await apiClient.visits.updateStatus(id, 'CANCELLED');
    return true;
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

  const fetchVisits = React.useCallback(async () => {
    if (!userId) return;
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
  }, [userId, userRole]);

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
    return visitService.updateVisitStatus(id, 'accepted' as VisitStatus);
  };

  const declineVisit = async (id: string) => {
    return visitService.updateVisitStatus(id, 'declined' as VisitStatus);
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
