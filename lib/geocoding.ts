// Geocoding service using OpenStreetMap Nominatim (free, no API key required)

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address?: {
    houseNumber?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      referrerPolicy: 'strict-origin-when-cross-origin',
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        address: result.address,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const details = await reverseGeocodeDetails(lat, lng);
  return details ? details.displayName : null;
}

export interface ReverseGeocodeDetails {
  displayName: string;
  road?: string;
  area?: string;
  city?: string;
}

export async function reverseGeocodeDetails(lat: number, lng: number): Promise<ReverseGeocodeDetails | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      referrerPolicy: 'strict-origin-when-cross-origin',
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const addr = data.address || {};
    const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.city_district || addr.subdistrict || addr.borough;
    const city = addr.city || addr.town || addr.state_district || 'Dhaka';
    const road = addr.road || addr.pedestrian || addr.street;

    return {
      displayName: data.display_name || '',
      road,
      area,
      city,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
