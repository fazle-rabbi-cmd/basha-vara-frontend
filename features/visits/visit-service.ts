// Visit Service for Prototype
// Manages visit requests with local state management

import React from 'react';
import { VisitRequest, VisitStatus } from '@/types';
import { mockVisitRequests } from '@/mocks/data';

// In-memory state for prototype (resets on refresh)
const visitRequestsState: VisitRequest[] = [...mockVisitRequests];

export const visitService = {
  // Get visit requests for tenant
  getVisitsByTenant: async (tenantId: string): Promise<VisitRequest[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return visitRequestsState.filter(v => v.tenantId === tenantId);
  },

  // Get visit requests for landlord
  getVisitsByLandlord: async (landlordId: string): Promise<VisitRequest[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return visitRequestsState.filter(v => v.landlordId === landlordId);
  },

  // Get visit requests for property
  getVisitsByProperty: async (propertyId: string): Promise<VisitRequest[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return visitRequestsState.filter(v => v.propertyId === propertyId);
  },

  // Create visit request
  createVisitRequest: async (visit: Omit<VisitRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<VisitRequest> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Check for duplicate requests
    const existing = visitRequestsState.find(
      v => v.propertyId === visit.propertyId && 
           v.tenantId === visit.tenantId && 
           v.status !== 'cancelled' && 
           v.status !== 'completed'
    );
    
    if (existing) {
      throw new Error('You already have a pending or confirmed visit request for this property');
    }

    const newVisit: VisitRequest = {
      ...visit,
      id: `visit-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    visitRequestsState.push(newVisit);
    return newVisit;
  },

  // Update visit status
  updateVisitStatus: async (id: string, status: VisitStatus): Promise<VisitRequest | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = visitRequestsState.findIndex(v => v.id === id);
    if (index === -1) return null;

    visitRequestsState[index].status = status;
    visitRequestsState[index].updatedAt = new Date();

    return visitRequestsState[index];
  },

  // Cancel visit request
  cancelVisit: async (id: string): Promise<boolean> => {
    return await visitService.updateVisitStatus(id, 'cancelled') !== null;
  },

  // Accept visit request
  acceptVisit: async (id: string): Promise<boolean> => {
    return await visitService.updateVisitStatus(id, 'confirmed') !== null;
  },

  // Decline visit request
  declineVisit: async (id: string): Promise<boolean> => {
    return await visitService.updateVisitStatus(id, 'cancelled') !== null;
  },

  // Request reschedule
  requestReschedule: async (id: string): Promise<boolean> => {
    return await visitService.updateVisitStatus(id, 'reschedule_requested') !== null;
  },
};

// React hook for visit requests
export const useVisits = (userId: string, role: 'tenant' | 'landlord') => {
  const [visits, setVisits] = React.useState<VisitRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchVisits = async () => {
    setIsLoading(true);
    try {
      const data = role === 'tenant' 
        ? await visitService.getVisitsByTenant(userId)
        : await visitService.getVisitsByLandlord(userId);
      setVisits(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const createVisit = async (visit: Omit<VisitRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newVisit = await visitService.createVisitRequest(visit);
      setVisits(prev => [...prev, newVisit]);
      return newVisit;
    } catch (err) {
      throw err;
    }
  };

  const updateStatus = async (id: string, status: VisitStatus) => {
    const updated = await visitService.updateVisitStatus(id, status);
    if (updated) {
      setVisits(prev => prev.map(v => v.id === id ? updated : v));
    }
    return updated;
  };

  const cancelVisit = async (id: string) => {
    return await updateStatus(id, 'cancelled');
  };

  const acceptVisit = async (id: string) => {
    return await updateStatus(id, 'confirmed');
  };

  const declineVisit = async (id: string) => {
    return await updateStatus(id, 'cancelled');
  };

  return {
    visits,
    isLoading,
    fetchVisits,
    createVisit,
    updateStatus,
    cancelVisit,
    acceptVisit,
    declineVisit,
  };
};
