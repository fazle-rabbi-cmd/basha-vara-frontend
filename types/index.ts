// Domain Types for Basha Vara
// These types are designed to be compatible with future NestJS/PostgreSQL/Prisma backend

export type UserRole = 'tenant' | 'landlord' | 'moderator' | 'admin' | 'super_admin' | null;

export interface Role {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  isSystem: boolean;
  permissions?: any[];
}

export type SystemPermission =
  | 'PROPERTY_CREATE'
  | 'PROPERTY_READ_OWN'
  | 'PROPERTY_READ_ANY'
  | 'PROPERTY_UPDATE_OWN'
  | 'PROPERTY_UPDATE_ANY'
  | 'PROPERTY_DELETE_OWN'
  | 'PROPERTY_DELETE_ANY'
  | 'PROPERTY_CHANGE_STATUS_OWN'
  | 'PROPERTY_CHANGE_STATUS_ANY'
  | 'VISIT_CREATE'
  | 'VISIT_READ_OWN'
  | 'VISIT_READ_ANY'
  | 'VISIT_UPDATE_OWN'
  | 'VISIT_UPDATE_ANY'
  | 'VISIT_DELETE_OWN'
  | 'VISIT_DELETE_ANY'
  | 'APPLICATION_CREATE'
  | 'APPLICATION_READ_OWN'
  | 'APPLICATION_READ_ANY'
  | 'APPLICATION_UPDATE_OWN'
  | 'APPLICATION_UPDATE_ANY'
  | 'APPLICATION_DELETE_OWN'
  | 'APPLICATION_DELETE_ANY'
  | 'APPLICATION_STATUS_UPDATE_OWN'
  | 'APPLICATION_STATUS_UPDATE_ANY'
  | 'USER_READ_OWN'
  | 'USER_READ_ANY'
  | 'USER_UPDATE_OWN'
  | 'USER_UPDATE_ANY'
  | 'USER_DELETE_OWN'
  | 'USER_DELETE_ANY'
  | 'USER_ASSIGN_ROLE'
  | 'ADMIN_VIEW_METRICS'
  | 'ADMIN_MODERATE_PROPERTIES'
  | 'ADMIN_MODERATE_USERS'
  | 'ADMIN_MANAGE_ROLES';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type ListingStatus = 'available' | 'rented' | 'paused' | 'archived' | 'pending_approval' | 'suspended';

export type ApplicationStatus = 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'withdrawn' | 'selected';

export type VisitStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export type NotificationType =
  | 'visit_requested'
  | 'visit_accepted'
  | 'visit_declined'
  | 'visit_cancelled'
  | 'visit_completed'
  | 'application_submitted'
  | 'application_under_review'
  | 'application_shortlisted'
  | 'application_rejected'
  | 'application_selected'
  | 'application_withdrawn'
  | 'property_published'
  | 'property_rented'
  | 'property_paused'
  | 'system';

export type PropertyType = 'apartment' | 'flat' | 'house' | 'studio' | 'room';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  hasPassword?: boolean;
  role: UserRole;
  roles?: string[];
  permissions?: SystemPermission[];
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
  slug: string;
  icon?: string;
  category: 'essential' | 'luxury' | 'safety' | 'utility';
  isCustom?: boolean;
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  area: string; // e.g., "Dhanmondi", "Gulshan"
  city?: string;
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
  lat?: number; // Latitude for map
  lng?: number; // Longitude for map
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

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface PropertySearchFilters {
  area?: string;
  city?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  availableBy?: string;
  amenities?: string[];
  propertyType?: PropertyType;
  status?: ListingStatus;
}

export interface PropertySearchParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rent' | 'bedrooms' | 'viewCount' | 'favouriteCount';
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

// Backend API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string | string[];
}

// Backend DTO Types (for reference)
export interface CreatePropertyDto {
  title: string;
  description: string;
  propertyType: 'APARTMENT' | 'FLAT' | 'HOUSE' | 'STUDIO' | 'ROOM';
  rentAmount: number;
  depositAmount?: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft?: number;
  floor?: number;
  totalFloors?: number;
  addressLine: string;
  area: string;
  city?: string;
  district?: string;
  availableFrom: string;
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  propertyType?: 'APARTMENT' | 'FLAT' | 'HOUSE' | 'STUDIO' | 'ROOM';
  rentAmount?: number;
  depositAmount?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  floor?: number;
  totalFloors?: number;
  addressLine?: string;
  area?: string;
  city?: string;
  district?: string;
  availableFrom?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'RENTED' | 'ARCHIVED';
}
