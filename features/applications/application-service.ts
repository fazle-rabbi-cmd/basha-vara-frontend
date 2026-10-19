// Application Service for Prototype
// Manages rental applications and shortlisting with local state management

import React from 'react';
import { RentalApplication, ApplicationStatus } from '@/types';
import { mockRentalApplications } from '@/mocks/data';

// In-memory state for prototype (resets on refresh)
const applicationsState: RentalApplication[] = [...mockRentalApplications];

export const applicationService = {
  // Get applications for tenant
  getApplicationsByTenant: async (tenantId: string): Promise<RentalApplication[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return applicationsState.filter(a => a.tenantId === tenantId);
  },

  // Get applications for landlord
  getApplicationsByLandlord: async (landlordId: string): Promise<RentalApplication[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return applicationsState.filter(a => a.landlordId === landlordId);
  },

  // Get applications for property
  getApplicationsByProperty: async (propertyId: string): Promise<RentalApplication[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return applicationsState.filter(a => a.propertyId === propertyId);
  },

  // Create application
  createApplication: async (application: Omit<RentalApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<RentalApplication> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Check for duplicate applications
    const existing = applicationsState.find(
      a => a.propertyId === application.propertyId && 
           a.tenantId === application.tenantId && 
           a.status !== 'cancelled' && 
           a.status !== 'declined'
    );
    
    if (existing) {
      throw new Error('You already have a pending or active application for this property');
    }

    const newApplication: RentalApplication = {
      ...application,
      id: `application-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    applicationsState.push(newApplication);
    return newApplication;
  },

  // Update application status
  updateApplicationStatus: async (id: string, status: ApplicationStatus): Promise<RentalApplication | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = applicationsState.findIndex(a => a.id === id);
    if (index === -1) return null;

    applicationsState[index].status = status;
    applicationsState[index].updatedAt = new Date();

    return applicationsState[index];
  },

  // Shortlist application
  shortlistApplication: async (id: string): Promise<boolean> => {
    return await applicationService.updateApplicationStatus(id, 'shortlisted') !== null;
  },

  // Accept application
  acceptApplication: async (id: string): Promise<boolean> => {
    return await applicationService.updateApplicationStatus(id, 'accepted') !== null;
  },

  // Decline application
  declineApplication: async (id: string): Promise<boolean> => {
    return await applicationService.updateApplicationStatus(id, 'declined') !== null;
  },

  // Cancel application (tenant action)
  cancelApplication: async (id: string): Promise<boolean> => {
    return await applicationService.updateApplicationStatus(id, 'cancelled') !== null;
  },

  // Shortlist multiple applications at once
  shortlistMultiple: async (ids: string[]): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (const id of ids) {
      const index = applicationsState.findIndex(a => a.id === id);
      if (index !== -1) {
        applicationsState[index].status = 'shortlisted';
        applicationsState[index].updatedAt = new Date();
      }
    }
    
    return true;
  },
};

// React hook for applications
export const useApplications = (userId: string, role: 'tenant' | 'landlord') => {
  const [applications, setApplications] = React.useState<RentalApplication[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = role === 'tenant' 
        ? await applicationService.getApplicationsByTenant(userId)
        : await applicationService.getApplicationsByLandlord(userId);
      setApplications(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplicationsByProperty = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const data = await applicationService.getApplicationsByProperty(propertyId);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const createApplication = async (application: Omit<RentalApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newApplication = await applicationService.createApplication(application);
      setApplications(prev => [...prev, newApplication]);
      return newApplication;
    } catch (err) {
      throw err;
    }
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const updated = await applicationService.updateApplicationStatus(id, status);
    if (updated) {
      setApplications(prev => prev.map(a => a.id === id ? updated : a));
    }
    return updated;
  };

  const shortlistApplication = async (id: string) => {
    return await updateStatus(id, 'shortlisted');
  };

  const acceptApplication = async (id: string) => {
    return await updateStatus(id, 'accepted');
  };

  const declineApplication = async (id: string) => {
    return await updateStatus(id, 'declined');
  };

  const cancelApplication = async (id: string) => {
    return await updateStatus(id, 'cancelled');
  };

  const shortlistMultiple = async (ids: string[]) => {
    const success = await applicationService.shortlistMultiple(ids);
    if (success) {
      setApplications(prev => prev.map(a => 
        ids.includes(a.id) ? { ...a, status: 'shortlisted' as ApplicationStatus, updatedAt: new Date() } : a
      ));
    }
    return success;
  };

  return {
    applications,
    isLoading,
    fetchApplications,
    fetchApplicationsByProperty,
    createApplication,
    updateStatus,
    shortlistApplication,
    acceptApplication,
    declineApplication,
    cancelApplication,
    shortlistMultiple,
  };
};
