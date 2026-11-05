// Simple test to verify API client works with backend
import { apiClient } from './api-client';

async function testApiClient() {
  console.log('Testing API Client...');

  try {
    // Test health check (if available)
    console.log('Testing public properties endpoint...');
    const properties = await apiClient.properties.getAll({ page: 1, limit: 5 });
    console.log('✅ Properties fetched:', properties.data.length, 'properties');
    console.log('✅ Total properties:', properties.total);

    // Test amenities
    console.log('Testing amenities endpoint...');
    const amenities = await apiClient.properties.getAmenities();
    console.log('✅ Amenities fetched:', amenities.length, 'amenities');

    console.log('\n✅ All API client tests passed!');
  } catch (error) {
    console.error('❌ API client test failed:', error);
  }
}

// Only run in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  testApiClient();
}

export { testApiClient };
