import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  apiClient,
  normalizeListingStatus,
  denormalizeListingStatus,
  normalizeProperty,
  normalizeUser,
  clearCache,
} from '@/lib/api-client';

const mockFetchResponse = (data: any, status = 200, contentType = 'application/json') => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 400 ? 'Bad Request' : status === 401 ? 'Unauthorized' : 'OK',
  headers: {
    get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
  },
  json: async () => data,
  text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  blob: async () => new Blob(['pdf']),
});

describe('api-client pure functions', () => {
  it('normalizeListingStatus maps backend statuses', () => {
    expect(normalizeListingStatus('PUBLISHED')).toBe('available');
    expect(normalizeListingStatus('RENTED')).toBe('rented');
    expect(normalizeListingStatus('PAUSED')).toBe('paused');
    expect(normalizeListingStatus('DRAFT')).toBe('paused');
    expect(normalizeListingStatus('ARCHIVED')).toBe('archived');
    expect(normalizeListingStatus('available')).toBe('available');
    expect(normalizeListingStatus(undefined as any)).toBe('available');
  });

  it('denormalizeListingStatus maps frontend statuses', () => {
    expect(denormalizeListingStatus('available')).toBe('PUBLISHED');
    expect(denormalizeListingStatus('rented')).toBe('RENTED');
    expect(denormalizeListingStatus('paused')).toBe('PAUSED');
    expect(denormalizeListingStatus('archived')).toBe('ARCHIVED');
    expect(denormalizeListingStatus('unknown' as any)).toBe('PUBLISHED');
  });

  it('normalizeProperty handles null and full mapping', () => {
    expect(normalizeProperty(null)).toBeNull();
    const p = normalizeProperty({
      id: 'p1',
      landlordId: 'l1',
      title: 'T',
      rentAmount: '25000',
      depositAmount: null,
      bedrooms: 2,
      bathrooms: 1,
      areaSqft: 900,
      status: 'PUBLISHED',
      propertyType: 'HOUSE',
      amenities: [{ amenity: { id: 'a1', name: 'WiFi' } }, { id: 'a2', name: 'Gym' }],
      photos: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
    });
    expect(p.rent).toBe(25000);
    expect(p.deposit).toBeUndefined();
    expect(p.status).toBe('available');
    expect(p.amenities).toHaveLength(2);
    expect(p.amenities[0].id).toBe('a1');
    expect(p.amenities[1].id).toBe('a2');
    expect(p.availableFrom).toBeInstanceOf(Date);
  });

  it('normalizeUser handles string and object roles', () => {
    expect(normalizeUser(null)).toBeNull();
    const u1 = normalizeUser({
      id: 'u1',
      email: 'a@b.com',
      fullName: 'Full Name',
      roles: ['TENANT', 'LANDLORD'],
    });
    expect(u1.role).toBe('tenant');
    expect(u1.roles).toEqual(['tenant', 'landlord']);
    expect(u1.name).toBe('Full Name');

    const u2 = normalizeUser({
      id: 'u2',
      email: 'x@y.com',
      roles: [{ role: 'ADMIN' }],
    });
    expect(u2.role).toBe('admin');
    expect(u2.name).toBe('x');
  });
});

describe('api-client fetchJson behaviors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
    (localStorage.getItem as any).mockReturnValue(null);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearCache();
  });

  it('sends Authorization header when token exists', async () => {
    (localStorage.getItem as any).mockReturnValue('tok-123');
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse({ ok: true }));

    await apiClient.users.getTenantProfile();

    const [, opts] = (global.fetch as any).mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tok-123');
  });

  it('caches GET responses', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse([{ id: 'a1' }]));

    await apiClient.notifications.getNotifications();
    await apiClient.notifications.getNotifications();

    expect((global.fetch as any).mock.calls.length).toBe(1);
  });

  it('deduplicates concurrent GET requests', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));

    const [r1, r2] = await Promise.all([
      apiClient.notifications.getUnreadCount(),
      apiClient.notifications.getUnreadCount(),
    ]);

    expect(r1).toEqual(r2);
    expect((global.fetch as any).mock.calls.length).toBe(1);
  });

  it('does not cache POST responses', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({ message: 'ok' }));

    await apiClient.users.updateContactPrivacy({ emailVisibility: 'FULL' });
    await apiClient.users.updateContactPrivacy({ emailVisibility: 'FULL' });

    expect((global.fetch as any).mock.calls.length).toBe(2);
  });

  it('throws ApiError with joined array messages on 400', async () => {
    (global.fetch as any).mockResolvedValueOnce(
      mockFetchResponse({ message: ['name required', 'email invalid'] }, 400),
    );

    await expect(apiClient.users.updateMe({ fullName: 'x' })).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 400,
      message: 'name required, email invalid',
    });
  });

  it('handles 401 on auth endpoint with backend message', async () => {
    (localStorage.getItem as any).mockReturnValue('tok');
    (global.fetch as any).mockResolvedValueOnce(
      mockFetchResponse({ message: 'Invalid credentials' }, 401),
    );

    await expect(
      apiClient.auth.login({ email: 'a@b.com', password: 'x' } as any),
    ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' });

    expect(localStorage.removeItem).toHaveBeenCalledWith('basha_vara_token');
  });

  it('handles 401 on non-auth endpoint with generic message', async () => {
    (localStorage.getItem as any).mockReturnValue('tok');
    (global.fetch as any).mockResolvedValueOnce(
      mockFetchResponse({ message: 'expired' }, 401),
    );

    await expect(apiClient.users.getTenantProfile()).rejects.toMatchObject({
      statusCode: 401,
      message: 'Session expired. Please log in again.',
    });
  });

  it('returns text for non-JSON responses', async () => {
    (global.fetch as any).mockResolvedValueOnce(
      mockFetchResponse('plain text body', 200, 'text/plain'),
    );

    const result = await apiClient.users.getTenantProfile();
    expect(result).toBe('plain text body');
  });

  it('retries once on 500 then succeeds', async () => {
    vi.useFakeTimers();
    (global.fetch as any)
      .mockResolvedValueOnce(mockFetchResponse({}, 500))
      .mockResolvedValueOnce(mockFetchResponse([{ id: 'a1', name: 'WiFi' }]));

    const promise = apiClient.properties.getAmenities();
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect((global.fetch as any).mock.calls.length).toBe(2);
    expect(result[0].name).toBe('WiFi');
  });
});

describe('api-client endpoint coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
    (localStorage.getItem as any).mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue(mockFetchResponse({}));
  });

  afterEach(() => {
    clearCache();
  });

  const expectCall = (path: string, method = 'GET') => {
    const calls = (global.fetch as any).mock.calls;
    const [url, opts] = calls[calls.length - 1];
    expect(url).toContain(path);
    expect(opts?.method ?? 'GET').toBe(method);
  };

  it('auth endpoints', async () => {
    await apiClient.auth.register({ email: 'a@b.com', password: 'p', name: 'N', phone: '1', role: 'tenant' } as any);
    expectCall('/auth/register', 'POST');

    await apiClient.auth.logout();
    expectCall('/auth/logout', 'POST');

    (global.fetch as any).mockResolvedValueOnce(
      mockFetchResponse({ id: 'u1', email: 'a@b.com', fullName: 'N', roles: ['TENANT'] }),
    );
    await apiClient.auth.getMe();
    expectCall('/auth/me');

    await apiClient.auth.googleLogin('cred', 'landlord');
    expectCall('/auth/google', 'POST');

    await apiClient.auth.requestPasswordLink('a@b.com');
    expectCall('/auth/password/request-link', 'POST');

    await apiClient.auth.completePasswordSetup('t', 'p');
    expectCall('/auth/password/complete-setup', 'POST');

    await apiClient.auth.changePassword('old', 'new');
    expectCall('/auth/password/change', 'POST');
  });

  it('users endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({ id: 'u1', email: 'a@b.com', fullName: 'N', roles: ['TENANT'] }));
    await apiClient.users.getById('u1');
    expectCall('/users/u1');

    await apiClient.users.getTenantProfile();
    expectCall('/users/tenant-profile');

    await apiClient.users.updateTenantProfile({ occupation: 'Dev' });
    expectCall('/users/tenant-profile', 'PATCH');

    await apiClient.users.getLandlordProfile();
    expectCall('/users/landlord-profile');

    await apiClient.users.updateLandlordProfile({ businessName: 'B' });
    expectCall('/users/landlord-profile', 'PATCH');

    await apiClient.users.getProfileCompletion();
    expectCall('/users/me/profile-completion');
  });

  it('messages endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.messages.send({ receiverId: 'u2', content: 'hi' });
    expectCall('/messages', 'POST');

    await apiClient.messages.getMessages('u2', 'p1');
    expectCall('/messages?userId=u2&propertyId=p1');

    await apiClient.messages.getConversations();
    expectCall('/messages/conversations');

    await apiClient.messages.markAsRead('m1');
    expectCall('/messages/m1/read', 'PATCH');

    await apiClient.messages.markConversationAsRead('u2');
    expectCall('/messages/conversation/u2/read', 'PATCH');
  });

  it('properties endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({ data: [], total: 0, page: 1, limit: 12, totalPages: 1 }));
    await apiClient.properties.getAll({
      searchQuery: 'dhan',
      page: 2,
      limit: 10,
      sortBy: 'rent',
      sortOrder: 'asc',
      filters: {
        area: 'Dhanmondi',
        city: 'Dhaka',
        minRent: 10000,
        maxRent: 50000,
        bedrooms: 2,
        bathrooms: 1,
        availableBy: '2025-01-01',
        amenities: ['wifi'],
        propertyType: 'apartment',
        status: 'available',
      },
    } as any);
    const [url] = (global.fetch as any).mock.calls.at(-1);
    expect(url).toContain('/properties?');
    expect(url).toContain('search=dhan');
    expect(url).toContain('sortBy=rentAmount');
    expect(url).toContain('propertyType=APARTMENT');
    expect(url).toContain('status=PUBLISHED');

    await apiClient.properties.getCompatible();
    expectCall('/properties/compatible');

    await apiClient.properties.getById('p1');
    expectCall('/properties/p1');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.properties.getMyProperties('available');
    expectCall('/properties/landlord/mine?status=PUBLISHED');

    await apiClient.properties.getAmenities();
    expectCall('/properties/amenities/list');

    await apiClient.properties.createCustomAmenity({ name: 'Pool', category: 'luxury' });
    expectCall('/properties/amenities/custom', 'POST');

    (global.fetch as any).mockResolvedValue(mockFetchResponse({ id: 'p1', title: 'T', rentAmount: 100, status: 'DRAFT' }));
    await apiClient.properties.create({ title: 'T', rent: 100 } as any);
    expectCall('/properties', 'POST');

    await apiClient.properties.update('p1', { title: 'New' });
    expectCall('/properties/p1', 'PATCH');

    await apiClient.properties.publish('p1');
    expectCall('/properties/p1', 'PATCH');

    await apiClient.properties.pause('p1');
    expectCall('/properties/p1', 'PATCH');

    await apiClient.properties.markRented('p1');
    expectCall('/properties/p1', 'PATCH');

    await apiClient.properties.delete('p1');
    expectCall('/properties/p1', 'DELETE');
  });

  it('favourites endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.favourites.getMyFavourites();
    expectCall('/me/favourites');

    await apiClient.favourites.add('p1');
    expectCall('/me/favourites/p1', 'POST');

    await apiClient.favourites.remove('p1');
    expectCall('/me/favourites/p1', 'DELETE');
  });

  it('visits endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.visits.create('p1', { requestedDate: '2025-01-01', requestedTime: '10:00' });
    expectCall('/properties/p1/visits', 'POST');

    await apiClient.visits.getMyVisits();
    expectCall('/me/visits');

    await apiClient.visits.getLandlordVisits();
    expectCall('/landlord/visits');

    await apiClient.visits.updateStatus('v1', 'accepted');
    expectCall('/visits/v1/status', 'PATCH');

    await apiClient.visits.generateOtp('v1', { role: 'landlord' });
    expectCall('/visits/v1/generate-otp', 'POST');

    await apiClient.visits.verifyOtp('v1', { role: 'tenant', otp: '123456' });
    expectCall('/visits/v1/verify-otp', 'POST');

    await apiClient.visits.completeVisit('v1');
    expectCall('/visits/v1/complete', 'POST');

    await apiClient.visits.initiateTokenHold('v1', 5000);
    expectCall('/visits/v1/token-hold', 'POST');

    await apiClient.visits.lockProperty('v1');
    expectCall('/visits/v1/lock-property', 'POST');
  });

  it('applications endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.applications.create('p1', { coverNote: 'hi' });
    expectCall('/properties/p1/applications', 'POST');

    await apiClient.applications.getMyApplications();
    expectCall('/me/applications');

    await apiClient.applications.getLandlordApplications('p1');
    expectCall('/landlord/applications?propertyId=p1');

    await apiClient.applications.updateStatus('a1', 'accepted');
    expectCall('/applications/a1/status', 'PATCH');
  });

  it('application profile/documents endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.applicationProfiles.getProfile();
    expectCall('/me/application-profile');

    await apiClient.applicationProfiles.createProfile({ occupation: 'Dev' });
    expectCall('/me/application-profile', 'POST');

    await apiClient.applicationProfiles.updateProfile({ occupation: 'Dev' });
    expectCall('/me/application-profile', 'PATCH');

    await apiClient.applicationDocuments.createUploadIntent('a1', 'NID', 'nid.pdf', '1024', 'application/pdf');
    expectCall('/applications/a1/documents/upload-intent', 'POST');

    await apiClient.applicationDocuments.completeUpload('a1', { documentType: 'NID', fileName: 'n.pdf', storageKey: 'k', fileSize: '1', mimeType: 'application/pdf' });
    expectCall('/applications/a1/documents/complete', 'POST');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.applicationDocuments.getDocuments('a1');
    expectCall('/applications/a1/documents');

    await apiClient.applicationDocuments.deleteDocument('a1', 'd1');
    expectCall('/applications/a1/documents/d1', 'DELETE');
  });

  it('user documents endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.userDocuments.createUploadIntent('NID', 'nid.pdf', '1024', 'application/pdf');
    expectCall('/me/documents/upload-intent', 'POST');

    await apiClient.userDocuments.completeUpload({ documentType: 'NID', fileName: 'n', storageKey: 'k', fileSize: '1', mimeType: 'application/pdf' });
    expectCall('/me/documents/complete', 'POST');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.userDocuments.getMyDocuments();
    expectCall('/me/documents');

    await apiClient.userDocuments.getUserDocuments('u1');
    expectCall('/me/documents/u1');

    await apiClient.userDocuments.deleteDocument('d1');
    expectCall('/me/documents/d1', 'DELETE');
  });

  it('notifications endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.notifications.getNotifications(true);
    expectCall('/notifications?unreadOnly=true');

    (global.fetch as any).mockResolvedValue(mockFetchResponse({ count: 3 }));
    await apiClient.notifications.getUnreadCount();
    expectCall('/notifications/unread-count');

    await apiClient.notifications.markAsRead('n1');
    expectCall('/notifications/n1/read', 'PATCH');

    await apiClient.notifications.markAllAsRead();
    expectCall('/notifications/read-all', 'PATCH');

    await apiClient.notifications.deleteNotification('n1');
    expectCall('/notifications/n1', 'DELETE');
  });

  it('payments endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.payments.initiate('a1', { paymentType: 'RENT' });
    expectCall('/payments/initiate', 'POST');

    await apiClient.payments.confirm('pay1');
    expectCall('/payments/pay1/confirm', 'POST');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.payments.getByApplication('a1');
    expectCall('/payments/application/a1');

    await apiClient.payments.getById('pay1');
    expectCall('/payments/pay1');

    await apiClient.payments.initiateBookingDeposit('v1', 5000);
    expectCall('/payments/booking-deposit', 'POST');
  });

  it('escrow endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.escrow.getStatus('pay1');
    expectCall('/escrow/payment/pay1');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.escrow.getByApplication('a1');
    expectCall('/escrow/application/a1');

    await apiClient.escrow.getHeld();
    expectCall('/escrow/held');

    await apiClient.escrow.release('pay1', { releaseReason: 'done' });
    expectCall('/escrow/release', 'POST');

    await apiClient.escrow.refund('pay1', { refundReason: 'cancel' });
    expectCall('/escrow/refund', 'POST');

    await apiClient.escrow.dispute('pay1', { disputeReason: 'issue' });
    expectCall('/escrow/dispute', 'POST');

    await apiClient.escrow.resolve('pay1', { resolution: 'release' });
    expectCall('/escrow/resolve/pay1', 'POST');
  });

  it('lease agreement endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.leaseAgreements.create({ applicationId: 'a1', startDate: '2025-01-01', endDate: '2026-01-01' });
    expectCall('/lease-agreements', 'POST');

    await apiClient.leaseAgreements.generatePdf('l1');
    expectCall('/lease-agreements/l1/generate-pdf', 'POST');

    await apiClient.leaseAgreements.update('l1', { status: 'SIGNED' });
    expectCall('/lease-agreements/l1', 'PATCH');

    await apiClient.leaseAgreements.getById('l1');
    expectCall('/lease-agreements/l1');

    await apiClient.leaseAgreements.getByApplication('a1');
    expectCall('/lease-agreements/application/a1');
  });

  it('police verification endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.policeVerification.generate({ tenantId: 'u1', propertyId: 'p1' });
    expectCall('/police-verification/generate', 'POST');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.policeVerification.getAll();
    expectCall('/police-verification');

    await apiClient.policeVerification.getById('pv1');
    expectCall('/police-verification/pv1');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['pdf']),
    });
    await apiClient.policeVerification.downloadPdf('pv1');
    const [url] = (global.fetch as any).mock.calls.at(-1);
    expect(url).toContain('/police-verification/pv1/pdf');

    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.policeVerification.submit('pv1');
    expectCall('/police-verification/pv1/submit', 'POST');

    await apiClient.policeVerification.verify('pv1');
    expectCall('/police-verification/pv1/verify', 'POST');
  });

  it('rent ledger endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.rentLedger.createRentPayment({ propertyId: 'p1', tenantId: 'u1', amount: 100, paymentDate: '2025-01-01', dueDate: '2025-02-01' });
    expectCall('/rent-ledger/rent-payments', 'POST');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.rentLedger.getRentPayments();
    expectCall('/rent-ledger/rent-payments');

    await apiClient.rentLedger.getRentPaymentById('r1');
    expectCall('/rent-ledger/rent-payments/r1');

    await apiClient.rentLedger.updateRentPayment('r1', { status: 'PAID' });
    expectCall('/rent-ledger/rent-payments/r1', 'PATCH');

    await apiClient.rentLedger.deleteRentPayment('r1');
    expectCall('/rent-ledger/rent-payments/r1', 'DELETE');

    await apiClient.rentLedger.createUtilityCharge({ propertyId: 'p1', tenantId: 'u1', chargeType: 'ELECTRICITY', amount: 50, billingMonth: '2025-01', dueDate: '2025-02-01' });
    expectCall('/rent-ledger/utility-charges', 'POST');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.rentLedger.getUtilityCharges();
    expectCall('/rent-ledger/utility-charges');

    await apiClient.rentLedger.getUtilityChargeById('uc1');
    expectCall('/rent-ledger/utility-charges/uc1');

    await apiClient.rentLedger.updateUtilityCharge('uc1', { status: 'PAID' });
    expectCall('/rent-ledger/utility-charges/uc1', 'PATCH');

    await apiClient.rentLedger.deleteUtilityCharge('uc1');
    expectCall('/rent-ledger/utility-charges/uc1', 'DELETE');

    await apiClient.rentLedger.getSummary();
    expectCall('/rent-ledger/summary');
  });

  it('admin endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.admin.getMetrics();
    expectCall('/admin/metrics');

    (global.fetch as any).mockResolvedValue(mockFetchResponse([]));
    await apiClient.admin.getProperties({ search: 'test', status: 'available' });
    const [purl] = (global.fetch as any).mock.calls.at(-1);
    expect(purl).toContain('/admin/properties?');
    expect(purl).toContain('search=test');
    expect(purl).toContain('status=PUBLISHED');

    await apiClient.admin.updatePropertyStatus('p1', 'paused');
    expectCall('/admin/properties/p1/status', 'PATCH');

    await apiClient.admin.getUsers({ search: 'x', role: 'tenant', status: 'active' });
    const [uurl] = (global.fetch as any).mock.calls.at(-1);
    expect(uurl).toContain('/admin/users?');
    expect(uurl).toContain('role=TENANT');

    await apiClient.admin.updateUserStatus('u1', 'SUSPENDED');
    expectCall('/admin/users/u1/status', 'PATCH');

    await apiClient.admin.updateUserRole('u1', 'LANDLORD');
    expectCall('/admin/users/u1/role', 'PATCH');

    await apiClient.admin.getPermissions();
    expectCall('/admin/permissions');

    await apiClient.admin.createPermission('perm', 'desc', 'cat');
    expectCall('/admin/permissions', 'POST');

    await apiClient.admin.getRoles();
    expectCall('/admin/roles');

    await apiClient.admin.updateRolePermissions('r1', ['p1']);
    expectCall('/admin/roles/r1/permissions', 'PATCH');

    await apiClient.admin.createRole('name', 'Display');
    expectCall('/admin/roles', 'POST');

    await apiClient.admin.updateRole('r1', 'Display');
    expectCall('/admin/roles/r1', 'PATCH');

    await apiClient.admin.deleteRole('r1');
    expectCall('/admin/roles/r1', 'DELETE');

    await apiClient.admin.removeUserRole('u1', 'r1');
    expectCall('/admin/users/u1/roles/r1', 'DELETE');

    await apiClient.admin.createUser('a@b.com', 'Name');
    expectCall('/admin/users', 'POST');

    await apiClient.admin.resetUserPassword('u1');
    expectCall('/admin/users/u1/reset-password', 'POST');
  });

  it('uploads endpoints', async () => {
    (global.fetch as any).mockResolvedValue(mockFetchResponse({}));
    await apiClient.uploads.createIntent('property_photo', 'p1', 'image/jpeg', '1024');
    expectCall('/uploads/intent', 'POST');

    await apiClient.uploads.completeUpload('p1', 'key', 'cap', true, 0);
    expectCall('/uploads/complete', 'POST');

    await apiClient.uploads.completeProfileUpload('key');
    expectCall('/uploads/complete-profile', 'POST');

    await apiClient.uploads.deletePropertyPhoto('p1', 'ph1');
    expectCall('/uploads/properties/p1/photos/ph1', 'DELETE');
  });
});
