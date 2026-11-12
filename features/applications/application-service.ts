// Application Service connected to live backend API
import React from 'react';
import { RentalApplication, ApplicationStatus } from '@/types';
import { apiClient } from '@/lib/api-client';

export const applicationService = {
  // Get applications for tenant
  getApplicationsByTenant: async (_tenantId: string): Promise<RentalApplication[]> => {
    return await apiClient.applications.getMyApplications();
  },

  // Get applications for landlord
  getApplicationsByLandlord: async (_landlordId: string, propertyId?: string): Promise<any[]> => {
    return await apiClient.applications.getLandlordApplications(propertyId);
  },

  // Get applications for property
  getApplicationsByProperty: async (propertyId: string): Promise<RentalApplication[]> => {
    return await apiClient.applications.getLandlordApplications(propertyId);
  },

  // Create application
  createApplication: async (application: {
    propertyId: string;
    coverLetter?: string;
    moveInDate?: Date | string;
    proposedRent?: number;
  }): Promise<any> => {
    return await apiClient.applications.create(application.propertyId, {
      coverNote: application.coverLetter,
      moveInDate: application.moveInDate,
      proposedRent: application.proposedRent,
    });
  },

  // Update application status
  updateApplicationStatus: async (id: string, status: ApplicationStatus | string): Promise<any> => {
    // Convert frontend status to backend enum
    let backendStatus = status.toUpperCase();
    if (status === 'accepted') backendStatus = 'SELECTED';
    if (status === 'declined') backendStatus = 'REJECTED';
    if (status === 'pending') backendStatus = 'SUBMITTED';

    return await apiClient.applications.updateStatus(id, backendStatus);
  },

  // Shortlist application
  shortlistApplication: async (id: string): Promise<boolean> => {
    return (await applicationService.updateApplicationStatus(id, 'SHORTLISTED')) !== null;
  },

  // Accept application
  acceptApplication: async (id: string): Promise<boolean> => {
    return (await applicationService.updateApplicationStatus(id, 'SELECTED')) !== null;
  },

  // Decline application
  declineApplication: async (id: string): Promise<boolean> => {
    return (await applicationService.updateApplicationStatus(id, 'REJECTED')) !== null;
  },

  // Withdraw application
  withdrawApplication: async (id: string): Promise<boolean> => {
    return (await applicationService.updateApplicationStatus(id, 'WITHDRAWN')) !== null;
  },
};

export const useApplications = (arg1?: string, arg2?: string, arg3?: string) => {
  let userRole: 'tenant' | 'landlord' = 'tenant';
  let userId: string = '';
  const propertyId: string | undefined = arg3;

  if (arg1 === 'tenant' || arg1 === 'landlord') {
    userRole = arg1;
    userId = arg2 || '';
  } else if (arg2 === 'tenant' || arg2 === 'landlord') {
    userRole = arg2;
    userId = arg1 || '';
  } else {
    userId = arg1 || '';
  }

  const [applications, setApplications] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchApplications = React.useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      let data: any[] = [];
      if (userRole === 'landlord') {
        data = await applicationService.getApplicationsByLandlord(userId, propertyId);
      } else {
        data = await applicationService.getApplicationsByTenant(userId);
      }
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRole, propertyId]);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    try {
      await applicationService.updateApplicationStatus(id, status);
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      return true;
    } catch {
      return false;
    }
  };

  const cancelApplication = async (id: string) => {
    return applicationService.withdrawApplication(id);
  };

  const shortlistApplication = async (id: string) => {
    return applicationService.shortlistApplication(id);
  };

  const acceptApplication = async (id: string) => {
    return applicationService.acceptApplication(id);
  };

  const declineApplication = async (id: string) => {
    return applicationService.declineApplication(id);
  };

  return {
    applications,
    isLoading,
    error,
    fetchApplications,
    updateStatus,
    cancelApplication,
    shortlistApplication,
    acceptApplication,
    declineApplication,
  };
};
