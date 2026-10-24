// Mock Data Layer for Basha Vara Prototype
// This provides realistic sample data for frontend development
// All data is clearly fictional and for prototype purposes only

import {
  User,
  LandlordProfile,
  TenantProfile,
  Property,
  PropertyPhoto,
  Amenity,
  Favourite,
  VisitRequest,
  RentalApplication,
} from '@/types';

// Sample amenities
export const mockAmenities: Amenity[] = [
  { id: '1', name: 'Air Conditioning', category: 'essential' },
  { id: '2', name: 'Gas Connection', category: 'essential' },
  { id: '3', name: 'Water Supply', category: 'essential' },
  { id: '4', name: 'Electricity', category: 'essential' },
  { id: '5', name: 'Security Guard', category: 'safety' },
  { id: '6', name: 'CCTV', category: 'safety' },
  { id: '7', name: 'Lift/Elevator', category: 'luxury' },
  { id: '8', name: 'Generator', category: 'luxury' },
  { id: '9', name: 'Parking', category: 'utility' },
  { id: '10', name: 'WiFi/Internet', category: 'utility' },
  { id: '11', name: 'Balcony', category: 'luxury' },
  { id: '12', name: 'Attached Roof', category: 'luxury' },
];

// Sample users
export const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'landlord1@example.com',
    name: 'Rahim Ahmed',
    phone: '+8801712345678',
    role: 'landlord',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: 'u2',
    email: 'tenant1@example.com',
    name: 'Fatima Begum',
    phone: '+8801812345678',
    role: 'tenant',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-10-05'),
  },
  {
    id: 'u3',
    email: 'landlord2@example.com',
    name: 'Karim Properties Ltd',
    phone: '+8801912345678',
    role: 'landlord',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-10-10'),
  },
  {
    id: 'u4',
    email: 'tenant2@example.com',
    name: 'Ahsan Uddin',
    phone: '+8801612345678',
    role: 'tenant',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-10-12'),
  },
  {
    id: 'u-admin',
    email: 'admin@bashavara.com',
    name: 'Basha Vara Administrator',
    phone: '+8801700000000',
    role: 'admin',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-01'),
  },
];

// Sample landlord profiles
export const mockLandlordProfiles: LandlordProfile[] = [
  {
    id: 'lp1',
    userId: 'u1',
    businessName: 'Rahim Properties',
    description: 'Trusted landlord with 10+ years of experience in Dhanmondi area.',
    verified: true,
    totalListings: 5,
    responseRate: 95,
    averageRating: 4.5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: 'lp2',
    userId: 'u3',
    businessName: 'Karim Properties Ltd',
    description: 'Premium properties in Gulshan and Banani.',
    verified: true,
    totalListings: 12,
    responseRate: 88,
    averageRating: 4.2,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-10-10'),
  },
];

// Sample tenant profiles
export const mockTenantProfiles: TenantProfile[] = [
  {
    id: 'tp1',
    userId: 'u2',
    preferredLocations: ['Dhanmondi', 'Mirpur'],
    budgetMin: 15000,
    budgetMax: 25000,
    preferredPropertyTypes: ['flat', 'apartment'],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-10-05'),
  },
  {
    id: 'tp2',
    userId: 'u4',
    preferredLocations: ['Gulshan', 'Banani'],
    budgetMin: 30000,
    budgetMax: 50000,
    preferredPropertyTypes: ['apartment', 'house'],
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-10-12'),
  },
];

// Sample property photos (using placeholder URLs)
const createMockPhotos = (propertyId: string, count: number): PropertyPhoto[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${propertyId}-${i}`,
    propertyId,
    url: `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&sig=${propertyId}${i}`,
    caption: i === 0 ? 'Main view' : `Photo ${i + 1}`,
    isPrimary: i === 0,
    order: i,
    createdAt: new Date(),
  }));
};

// Sample properties
export const mockProperties: Property[] = [
  {
    id: 'p1',
    landlordId: 'u1',
    title: 'Spacious 3BHK Flat in Dhanmondi',
    description: 'Beautiful and spacious flat in prime Dhanmondi location. Well-maintained building with 24/7 security. Close to schools, markets, and public transport.',
    propertyType: 'flat',
    address: 'Road 27, Dhanmondi, Dhaka',
    area: 'Dhanmondi',
    rent: 35000,
    deposit: 105000,
    size: 1500,
    bedrooms: 3,
    bathrooms: 2,
    floor: 5,
    totalFloors: 8,
    availableFrom: new Date('2024-11-01'),
    status: 'available',
    amenities: [mockAmenities[0], mockAmenities[1], mockAmenities[2], mockAmenities[4], mockAmenities[8], mockAmenities[10]],
    photos: createMockPhotos('p1', 4),
    rules: ['No smoking', 'No pets', 'Monthly rent due by 5th'],
    preferences: ['Family preferred', 'Working professionals'],
    viewCount: 245,
    favouriteCount: 18,
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: 'p2',
    landlordId: 'u1',
    title: 'Modern 2BHK Apartment in Mirpur',
    description: 'Modern apartment with recent renovation. Perfect for small families or working professionals. All utilities available.',
    propertyType: 'apartment',
    address: 'Section 10, Mirpur, Dhaka',
    area: 'Mirpur',
    rent: 18000,
    deposit: 54000,
    size: 950,
    bedrooms: 2,
    bathrooms: 1,
    floor: 3,
    totalFloors: 6,
    availableFrom: new Date('2024-10-20'),
    status: 'available',
    amenities: [mockAmenities[0], mockAmenities[1], mockAmenities[2], mockAmenities[8]],
    photos: createMockPhotos('p2', 3),
    rules: ['No smoking'],
    preferences: ['Small family preferred'],
    viewCount: 189,
    favouriteCount: 12,
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-10-05'),
  },
  {
    id: 'p3',
    landlordId: 'u3',
    title: 'Luxury 4BHK in Gulshan 1',
    description: 'Premium luxury apartment in Gulshan 1. High-end finishing, modern amenities, and excellent security. Ideal for expatriates or executives.',
    propertyType: 'apartment',
    address: 'Gulshan Avenue, Gulshan 1, Dhaka',
    area: 'Gulshan',
    rent: 85000,
    deposit: 255000,
    size: 2500,
    bedrooms: 4,
    bathrooms: 4,
    floor: 8,
    totalFloors: 12,
    availableFrom: new Date('2024-11-15'),
    status: 'available',
    amenities: [mockAmenities[0], mockAmenities[1], mockAmenities[2], mockAmenities[4], mockAmenities[5], mockAmenities[6], mockAmenities[7], mockAmenities[8], mockAmenities[9], mockAmenities[10], mockAmenities[11]],
    photos: createMockPhotos('p3', 6),
    rules: ['No smoking', 'No pets', 'No parties'],
    preferences: ['Executives preferred', 'Long-term lease'],
    viewCount: 567,
    favouriteCount: 45,
    createdAt: new Date('2024-09-10'),
    updatedAt: new Date('2024-10-08'),
  },
  {
    id: 'p4',
    landlordId: 'u3',
    title: 'Cozy Studio in Banani',
    description: 'Perfect studio for students or young professionals. Fully furnished with basic furniture. Quiet neighborhood.',
    propertyType: 'studio',
    address: 'Road 11, Banani, Dhaka',
    area: 'Banani',
    rent: 12000,
    deposit: 36000,
    size: 450,
    bedrooms: 1,
    bathrooms: 1,
    floor: 2,
    totalFloors: 5,
    availableFrom: new Date('2024-10-25'),
    status: 'available',
    amenities: [mockAmenities[1], mockAmenities[2], mockAmenities[4]],
    photos: createMockPhotos('p4', 3),
    rules: ['No smoking', 'Quiet hours after 10 PM'],
    preferences: ['Students or working professionals'],
    viewCount: 134,
    favouriteCount: 8,
    createdAt: new Date('2024-09-25'),
    updatedAt: new Date('2024-10-10'),
  },
  {
    id: 'p5',
    landlordId: 'u1',
    title: '3BHK House in Uttara',
    description: 'Independent house with garden and parking. Good for families. Close to schools and hospitals.',
    propertyType: 'house',
    address: 'Sector 7, Uttara, Dhaka',
    area: 'Uttara',
    rent: 45000,
    deposit: 135000,
    size: 2000,
    bedrooms: 3,
    bathrooms: 3,
    floor: 1,
    totalFloors: 2,
    availableFrom: new Date('2024-12-01'),
    status: 'paused',
    amenities: [mockAmenities[1], mockAmenities[2], mockAmenities[4], mockAmenities[8], mockAmenities[9]],
    photos: createMockPhotos('p5', 5),
    rules: ['No smoking', 'No pets'],
    preferences: ['Family preferred'],
    viewCount: 98,
    favouriteCount: 5,
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-10-12'),
  },
  {
    id: 'p6',
    landlordId: 'u3',
    title: '2BHK Flat in Mohammadpur',
    description: 'Budget-friendly flat in Mohammadpur. Well-connected to public transport. Suitable for students.',
    propertyType: 'flat',
    address: 'Adabor, Mohammadpur, Dhaka',
    area: 'Mohammadpur',
    rent: 14000,
    deposit: 42000,
    size: 800,
    bedrooms: 2,
    bathrooms: 1,
    floor: 4,
    totalFloors: 6,
    availableFrom: new Date('2024-10-15'),
    status: 'rented',
    amenities: [mockAmenities[1], mockAmenities[2], mockAmenities[4]],
    photos: createMockPhotos('p6', 3),
    rules: ['No smoking'],
    preferences: ['Students preferred'],
    viewCount: 312,
    favouriteCount: 22,
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2024-10-15'),
  },
];

// Sample favourites
export const mockFavourites: Favourite[] = [
  {
    id: 'f1',
    tenantId: 'u2',
    propertyId: 'p1',
    createdAt: new Date('2024-10-01'),
  },
  {
    id: 'f2',
    tenantId: 'u2',
    propertyId: 'p3',
    createdAt: new Date('2024-10-03'),
  },
  {
    id: 'f3',
    tenantId: 'u4',
    propertyId: 'p3',
    createdAt: new Date('2024-10-05'),
  },
  {
    id: 'f4',
    tenantId: 'u4',
    propertyId: 'p4',
    createdAt: new Date('2024-10-08'),
  },
];

// Sample visit requests
export const mockVisitRequests: VisitRequest[] = [
  {
    id: 'v1',
    propertyId: 'p1',
    tenantId: 'u2',
    landlordId: 'u1',
    requestedDate: new Date('2024-10-25'),
    requestedTime: '10:00 AM',
    status: 'confirmed',
    notes: 'Looking for a family home, interested in seeing the property.',
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-16'),
  },
  {
    id: 'v2',
    propertyId: 'p3',
    tenantId: 'u4',
    landlordId: 'u3',
    requestedDate: new Date('2024-10-28'),
    requestedTime: '2:00 PM',
    status: 'pending',
    notes: 'Interested in the luxury apartment for long-term lease.',
    createdAt: new Date('2024-10-18'),
    updatedAt: new Date('2024-10-18'),
  },
  {
    id: 'v3',
    propertyId: 'p2',
    tenantId: 'u2',
    landlordId: 'u1',
    requestedDate: new Date('2024-10-20'),
    requestedTime: '11:00 AM',
    status: 'completed',
    notes: 'Visit completed, liked the property.',
    createdAt: new Date('2024-10-10'),
    updatedAt: new Date('2024-10-20'),
  },
];

// Sample rental applications
export const mockRentalApplications: RentalApplication[] = [
  {
    id: 'a1',
    propertyId: 'p1',
    tenantId: 'u2',
    landlordId: 'u1',
    status: 'shortlisted',
    coverLetter: 'I am a working professional with a family of 4. We are looking for a long-term rental in Dhanmondi. We are responsible tenants with good rental history.',
    moveInDate: new Date('2024-11-01'),
    proposedRent: 35000,
    createdAt: new Date('2024-10-16'),
    updatedAt: new Date('2024-10-17'),
  },
  {
    id: 'a2',
    propertyId: 'p3',
    tenantId: 'u4',
    landlordId: 'u3',
    status: 'pending',
    coverLetter: 'I am an executive working for a multinational company. Looking for a premium apartment in Gulshan. Can provide references if needed.',
    moveInDate: new Date('2024-11-15'),
    proposedRent: 85000,
    createdAt: new Date('2024-10-18'),
    updatedAt: new Date('2024-10-18'),
  },
  {
    id: 'a3',
    propertyId: 'p2',
    tenantId: 'u2',
    landlordId: 'u1',
    status: 'accepted',
    coverLetter: 'Small family looking for an affordable apartment in Mirpur.',
    moveInDate: new Date('2024-10-20'),
    proposedRent: 18000,
    createdAt: new Date('2024-10-12'),
    updatedAt: new Date('2024-10-15'),
  },
];

// Helper functions for mock data operations
export const getPropertyById = (id: string): Property | undefined => {
  return mockProperties.find(p => p.id === id);
};

export const getPropertiesByLandlord = (landlordId: string): Property[] => {
  return mockProperties.filter(p => p.landlordId === landlordId);
};

export const getFavouritesByTenant = (tenantId: string): Favourite[] => {
  return mockFavourites.filter(f => f.tenantId === tenantId);
};

export const getVisitRequestsByTenant = (tenantId: string): VisitRequest[] => {
  return mockVisitRequests.filter(v => v.tenantId === tenantId);
};

export const getVisitRequestsByLandlord = (landlordId: string): VisitRequest[] => {
  return mockVisitRequests.filter(v => v.landlordId === landlordId);
};

export const getApplicationsByTenant = (tenantId: string): RentalApplication[] => {
  return mockRentalApplications.filter(a => a.tenantId === tenantId);
};

export const getApplicationsByLandlord = (landlordId: string): RentalApplication[] => {
  return mockRentalApplications.filter(a => a.landlordId === landlordId);
};

export const getApplicationsByProperty = (propertyId: string): RentalApplication[] => {
  return mockRentalApplications.filter(a => a.propertyId === propertyId);
};
