import {
  Property,
  User,
  UserRole,
  ListingStatus,
  VisitRequest,
  RentalApplication,
  Amenity,
  PropertySearchParams,
  PaginatedResponse,
  LoginCredentials,
  RegisterData,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Helper to normalize status between backend (PUBLISHED, PAUSED, RENTED) and frontend
export function normalizeListingStatus(status: string): ListingStatus {
  switch (status?.toUpperCase()) {
    case 'PUBLISHED':
      return 'available';
    case 'RENTED':
      return 'rented';
    case 'PAUSED':
    case 'DRAFT':
      return 'paused';
    case 'ARCHIVED':
      return 'archived';
    default:
      return (status as ListingStatus) || 'available';
  }
}

export function denormalizeListingStatus(status: ListingStatus): string {
  switch (status) {
    case 'available':
      return 'PUBLISHED';
    case 'rented':
      return 'RENTED';
    case 'paused':
      return 'PAUSED';
    case 'archived':
      return 'ARCHIVED';
    default:
      return 'PUBLISHED';
  }
}

export function normalizeProperty(raw: any): Property {
  if (!raw) return raw;
  return {
    id: raw.id,
    landlordId: raw.landlordId || raw.landlord?.id || '',
    title: raw.title || '',
    description: raw.description || '',
    propertyType: (raw.propertyType?.toLowerCase() || 'apartment') as any,
    address: raw.addressLine || raw.address || '',
    area: raw.area || '',
    rent: Number(raw.rentAmount ?? raw.rent ?? 0),
    deposit: raw.depositAmount !== null && raw.depositAmount !== undefined ? Number(raw.depositAmount) : undefined,
    size: raw.areaSqft ?? raw.size,
    bedrooms: Number(raw.bedrooms || 1),
    bathrooms: Number(raw.bathrooms || 1),
    floor: raw.floor,
    totalFloors: raw.totalFloors,
    availableFrom: raw.availableFrom ? new Date(raw.availableFrom) : new Date(),
    status: normalizeListingStatus(raw.status),
    amenities: (raw.amenities || []).map((a: any) => (a.amenity ? a.amenity : a)),
    photos: raw.photos || [],
    viewCount: Number(raw.viewCount || 0),
    favouriteCount: Number(raw.favouriteCount || 0),
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  };
}

export function normalizeUser(raw: any): User {
  if (!raw) return raw;
  const primaryRole = (
    Array.isArray(raw.roles) && raw.roles.length > 0
      ? typeof raw.roles[0] === 'string'
        ? raw.roles[0].toLowerCase()
        : raw.roles[0].role?.toLowerCase()
      : raw.role?.toLowerCase() || 'tenant'
  ) as UserRole;

  return {
    id: raw.id,
    email: raw.email,
    name: raw.fullName || raw.name || raw.email.split('@')[0],
    phone: raw.phone || undefined,
    role: primaryRole,
    status: raw.status || 'ACTIVE',
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  };
}

async function fetchJson<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('basha_vara_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && data?.message)
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        : response.statusText || 'Request failed';

    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  // Authentication & Session
  auth: {
    login: async (credentials: LoginCredentials): Promise<{ user: User; accessToken: string }> => {
      const data = await fetchJson<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (typeof window !== 'undefined' && data.accessToken) {
        localStorage.setItem('basha_vara_token', data.accessToken);
      }

      return {
        accessToken: data.accessToken,
        user: normalizeUser(data.user),
      };
    },

    register: async (registerData: RegisterData): Promise<{ user: User; accessToken: string }> => {
      const roleUpper = registerData.role ? registerData.role.toUpperCase() : 'TENANT';
      const data = await fetchJson<{ accessToken: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          fullName: registerData.name,
          phone: registerData.phone,
          role: roleUpper,
        }),
      });

      if (typeof window !== 'undefined' && data.accessToken) {
        localStorage.setItem('basha_vara_token', data.accessToken);
      }

      return {
        accessToken: data.accessToken,
        user: normalizeUser(data.user),
      };
    },

    logout: async (): Promise<void> => {
      try {
        await fetchJson('/auth/logout', { method: 'POST' });
      } catch {
        // Ignore logout network failures
      } finally {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('basha_vara_token');
        }
      }
    },

    getMe: async (): Promise<User> => {
      const data = await fetchJson<any>('/auth/me', { method: 'GET' });
      return normalizeUser(data);
    },
  },

  // Users & Profiles
  users: {
    updateMe: async (dto: { fullName?: string; phone?: string; avatarUrl?: string }) => {
      const data = await fetchJson<any>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      return normalizeUser(data);
    },
    updateTenantProfile: async (dto: any) => {
      return fetchJson<any>('/users/me/tenant-profile', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },
    updateLandlordProfile: async (dto: any) => {
      return fetchJson<any>('/users/me/landlord-profile', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },
  },

  // Properties Catalog & Management
  properties: {
    getAll: async (params?: PropertySearchParams): Promise<PaginatedResponse<Property>> => {
      const query = new URLSearchParams();

      if (params?.searchQuery) query.append('search', params.searchQuery);
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.sortBy) query.append('sortBy', params.sortBy === 'rent' ? 'rentAmount' : params.sortBy);
      if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

      if (params?.filters) {
        const { area, minRent, maxRent, bedrooms, propertyType, status } = params.filters;
        if (area) query.append('area', area);
        if (minRent !== undefined) query.append('minRent', minRent.toString());
        if (maxRent !== undefined) query.append('maxRent', maxRent.toString());
        if (bedrooms !== undefined) query.append('bedrooms', bedrooms.toString());
        if (propertyType) query.append('propertyType', propertyType.toUpperCase());
        if (status) query.append('status', denormalizeListingStatus(status));
      }

      const queryString = query.toString();
      const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;
      const res = await fetchJson<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(endpoint);

      return {
        data: (res.data || []).map(normalizeProperty),
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 12,
        totalPages: res.totalPages || 1,
      };
    },

    getById: async (id: string): Promise<Property & { isFavourited?: boolean }> => {
      const res = await fetchJson<any>(`/properties/${id}`);
      return {
        ...normalizeProperty(res),
        isFavourited: !!res.isFavourited,
      };
    },

    getLandlordMine: async (status?: ListingStatus): Promise<Property[]> => {
      const query = status ? `?status=${denormalizeListingStatus(status)}` : '';
      const data = await fetchJson<any[]>(`/properties/landlord/mine${query}`);
      return (data || []).map(normalizeProperty);
    },

    create: async (data: any): Promise<Property> => {
      const payload = {
        ...data,
        rentAmount: Number(data.rent || data.rentAmount),
        depositAmount: data.deposit ? Number(data.deposit) : undefined,
        areaSqft: data.size ? Number(data.size) : undefined,
        addressLine: data.address || data.addressLine,
        propertyType: data.propertyType?.toUpperCase(),
        status: data.status ? denormalizeListingStatus(data.status) : 'DRAFT',
      };
      const res = await fetchJson<any>('/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return normalizeProperty(res);
    },

    update: async (id: string, data: any): Promise<Property> => {
      const payload = {
        ...data,
        rentAmount: data.rent ? Number(data.rent) : undefined,
        depositAmount: data.deposit ? Number(data.deposit) : undefined,
        areaSqft: data.size ? Number(data.size) : undefined,
        addressLine: data.address || data.addressLine,
        propertyType: data.propertyType ? data.propertyType.toUpperCase() : undefined,
        status: data.status ? denormalizeListingStatus(data.status) : undefined,
      };
      const res = await fetchJson<any>(`/properties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return normalizeProperty(res);
    },

    publish: async (id: string) => {
      return fetchJson<any>(`/properties/${id}/publish`, { method: 'POST' });
    },

    pause: async (id: string) => {
      return fetchJson<any>(`/properties/${id}/pause`, { method: 'POST' });
    },

    markRented: async (id: string) => {
      return fetchJson<any>(`/properties/${id}/mark-rented`, { method: 'POST' });
    },

    delete: async (id: string) => {
      return fetchJson<any>(`/properties/${id}`, { method: 'DELETE' });
    },

    getAmenities: async (): Promise<Amenity[]> => {
      const res = await fetchJson<any[]>('/amenities');
      return res.map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        category: a.category?.toLowerCase() || 'essential',
      }));
    },
  },

  // Favourites
  favourites: {
    getMyFavourites: async (): Promise<Property[]> => {
      const res = await fetchJson<any[]>('/me/favourites');
      return (res || []).map((f) => normalizeProperty(f.property));
    },

    add: async (propertyId: string) => {
      return fetchJson<any>(`/me/favourites/${propertyId}`, { method: 'POST' });
    },

    remove: async (propertyId: string) => {
      return fetchJson<any>(`/me/favourites/${propertyId}`, { method: 'DELETE' });
    },
  },

  // Visits
  visits: {
    create: async (propertyId: string, data: { requestedDate: Date | string; requestedTime: string; message?: string }) => {
      return fetchJson<any>(`/properties/${propertyId}/visits`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getMyVisits: async (): Promise<VisitRequest[]> => {
      const res = await fetchJson<any[]>('/me/visits');
      return (res || []).map((v) => ({
        id: v.id,
        propertyId: v.propertyId,
        tenantId: v.tenantId,
        landlordId: v.property?.landlord?.id || '',
        requestedDate: new Date(v.requestedDate),
        requestedTime: v.requestedTime,
        status: v.status?.toLowerCase() || 'pending',
        notes: v.message,
        createdAt: new Date(v.createdAt),
        updatedAt: new Date(v.updatedAt),
      }));
    },

    getLandlordVisits: async (): Promise<any[]> => {
      const res = await fetchJson<any[]>('/landlord/visits');
      return (res || []).map((v) => ({
        id: v.id,
        propertyId: v.propertyId,
        tenantId: v.tenantId,
        tenantName: v.tenant?.fullName || 'Prospective Tenant',
        tenantEmail: v.tenant?.email,
        tenantPhone: v.tenant?.phone,
        propertyTitle: v.property?.title || 'Rental Property',
        requestedDate: new Date(v.requestedDate),
        requestedTime: v.requestedTime,
        status: v.status?.toLowerCase() || 'pending',
        notes: v.message,
        createdAt: new Date(v.createdAt),
      }));
    },

    updateStatus: async (visitId: string, status: string) => {
      return fetchJson<any>(`/visits/${visitId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status.toUpperCase() }),
      });
    },
  },

  // Rental Applications
  applications: {
    create: async (propertyId: string, data: { coverNote?: string; moveInDate?: Date | string; proposedRent?: number }) => {
      return fetchJson<any>(`/properties/${propertyId}/applications`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getMyApplications: async (): Promise<RentalApplication[]> => {
      const res = await fetchJson<any[]>('/me/applications');
      return (res || []).map((app) => ({
        id: app.id,
        propertyId: app.propertyId,
        tenantId: app.tenantId,
        landlordId: app.property?.landlord?.id || '',
        status: app.status?.toLowerCase() || 'pending',
        coverLetter: app.coverNote,
        moveInDate: app.moveInDate ? new Date(app.moveInDate) : undefined,
        proposedRent: app.proposedRent ? Number(app.proposedRent) : undefined,
        createdAt: new Date(app.createdAt),
        updatedAt: new Date(app.updatedAt),
      }));
    },

    getLandlordApplications: async (propertyId?: string): Promise<any[]> => {
      const query = propertyId ? `?propertyId=${propertyId}` : '';
      const res = await fetchJson<any[]>(`/landlord/applications${query}`);
      return (res || []).map((app) => ({
        id: app.id,
        propertyId: app.propertyId,
        tenantId: app.tenantId,
        tenantName: app.tenant?.fullName || 'Applicant',
        tenantEmail: app.tenant?.email,
        tenantPhone: app.tenant?.phone,
        tenantOccupation: app.tenant?.tenantProfile?.occupation,
        propertyTitle: app.property?.title || 'Rental Property',
        status: app.status?.toLowerCase() || 'pending',
        coverLetter: app.coverNote,
        moveInDate: app.moveInDate ? new Date(app.moveInDate) : undefined,
        proposedRent: app.proposedRent ? Number(app.proposedRent) : undefined,
        createdAt: new Date(app.createdAt),
      }));
    },

    updateStatus: async (applicationId: string, status: string) => {
      return fetchJson<any>(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status.toUpperCase() }),
      });
    },
  },

  // Admin Console & Governance
  admin: {
    getMetrics: async () => {
      return fetchJson<{
        properties: { total: number; published: number; paused: number; rented: number };
        users: { total: number; tenants: number; landlords: number; admins: number };
        visits: { total: number; pending: number };
        applications: { total: number; submitted: number };
      }>('/admin/metrics');
    },

    getProperties: async (params?: { search?: string; status?: string }): Promise<Property[]> => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.status && params.status !== 'all') {
        query.append('status', denormalizeListingStatus(params.status as ListingStatus));
      }
      const q = query.toString();
      const res = await fetchJson<any[]>(`/admin/properties${q ? `?${q}` : ''}`);
      return (res || []).map(normalizeProperty);
    },

    updatePropertyStatus: async (id: string, status: ListingStatus) => {
      return fetchJson<any>(`/admin/properties/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: denormalizeListingStatus(status) }),
      });
    },

    getUsers: async (params?: { search?: string; role?: string; status?: string }): Promise<User[]> => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.role && params.role !== 'all') query.append('role', params.role.toUpperCase());
      if (params?.status && params.status !== 'all') query.append('status', params.status.toUpperCase());
      const q = query.toString();
      const res = await fetchJson<any[]>(`/admin/users${q ? `?${q}` : ''}`);
      return (res || []).map(normalizeUser);
    },

    updateUserStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
      return fetchJson<any>(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    updateUserRole: async (id: string, role: string) => {
      return fetchJson<any>(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: role.toUpperCase() }),
      });
    },
  },
};
