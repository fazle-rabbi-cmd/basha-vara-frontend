// Domain Types for Basha Vara
// These types are designed to be compatible with future NestJS/PostgreSQL/Prisma backend

export type UserRole = 'tenant' | 'landlord' | 'admin' | null;

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type ListingStatus = 'available' | 'rented' | 'paused' | 'archived' | 'pending_approval' | 'suspended';

export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'declined' | 'cancelled';

export type VisitStatus = 'pending' | 'confirmed' | 'reschedule_requested' | 'completed' | 'cancelled';

export type PropertyType = 'apartment' | 'flat' | 'house' | 'studio' | 'room';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandlordProfile {
  id: string;
  userId: string;
  businessName?: string;
  description?: string;
  verified: boolean;
  totalListings: number;
  responseRate: number;
  averageRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantProfile {
  id: string;
  userId: string;
  preferredLocations?: string[];
  budgetMin?: number;
  budgetMax?: number;
  preferredPropertyTypes?: PropertyType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  category: 'essential' | 'luxury' | 'safety' | 'utility';
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  area: string; // e.g., "Dhanmondi", "Gulshan"
  rent: number; // Monthly rent in BDT
  deposit?: number;
  size?: number; // Square feet
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  totalFloors?: number;
  availableFrom: Date;
  status: ListingStatus;
  amenities: Amenity[];
  photos: PropertyPhoto[];
  rules?: string[];
  preferences?: string[];
  viewCount: number;
  favouriteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Favourite {
  id: string;
  tenantId: string;
  propertyId: string;
  createdAt: Date;
}

export interface VisitRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  requestedDate: Date;
  requestedTime: string;
  status: VisitStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalApplication {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  moveInDate?: Date;
  proposedRent?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertySearchFilters {
  area?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  propertyType?: PropertyType;
  status?: ListingStatus;
}

export interface PropertySearchParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rent' | 'bedrooms' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  filters?: PropertySearchFilters;
  searchQuery?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth-related types for prototype
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
}
