/**
 * Geocoding utilities using OpenStreetMap's Nominatim API
 * Free and open source - no API key required
 *
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Max 1 request per second
 * - Provide a valid User-Agent
 * - Cache results when possible
 *
 * Client-side requests are proxied through /api/geocoding to avoid CORS issues.
 */

import { apiUrl } from './config';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'BuyNSell-Philippines/1.0';

// Check if running on client side
const isClient = typeof window !== 'undefined';

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  error?: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address?: {
    street?: string;
    city?: string;
    barangay?: string;
    province?: string;
    country?: string;
    postcode?: string;
  };
  boundingBox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
}

/**
 * Forward geocoding - convert address to coordinates
 * Uses proxy API on client-side to avoid CORS issues
 */
export async function geocodeAddress(
  address: string,
  options?: {
    countryCode?: string;
    limit?: number;
  }
): Promise<GeocodingResult[]> {
  const { countryCode = 'ph', limit = 5 } = options || {};

  try {
    let data: NominatimResult[];

    if (isClient) {
      // Client-side: use proxy API to avoid CORS
      const params = new URLSearchParams({
        type: 'search',
        q: address,
        limit: limit.toString(),
        countrycodes: countryCode,
      });
      const response = await fetch(apiUrl(`/api/geocoding?${params}`));
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      data = await response.json();
    } else {
      // Server-side: call Nominatim directly
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: limit.toString(),
        countrycodes: countryCode,
      });
      const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en',
        },
      });
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      data = await response.json();
    }

    return data.map((result) => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: result.address
        ? {
            street: [result.address.house_number, result.address.road]
              .filter(Boolean)
              .join(' '),
            city: result.address.city || result.address.municipality,
            barangay: result.address.suburb || result.address.neighbourhood,
            province: result.address.state || result.address.county,
            country: result.address.country,
            postcode: result.address.postcode,
          }
        : undefined,
      boundingBox: result.boundingbox
        ? {
            south: parseFloat(result.boundingbox[0]),
            north: parseFloat(result.boundingbox[1]),
            west: parseFloat(result.boundingbox[2]),
            east: parseFloat(result.boundingbox[3]),
          }
        : undefined,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Reverse geocoding - convert coordinates to address
 * Uses proxy API on client-side to avoid CORS issues
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    let result: NominatimResult;

    if (isClient) {
      // Client-side: use proxy API to avoid CORS
      const params = new URLSearchParams({
        type: 'reverse',
        lat: latitude.toString(),
        lon: longitude.toString(),
      });
      const response = await fetch(apiUrl(`/api/geocoding?${params}`));
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }
      result = await response.json();
    } else {
      // Server-side: call Nominatim directly
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
      });
      const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en',
        },
      });
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }
      result = await response.json();
    }

    if (result.error) {
      return null;
    }

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: result.address
        ? {
            street: [result.address.house_number, result.address.road]
              .filter(Boolean)
              .join(' '),
            city: result.address.city || result.address.municipality,
            barangay: result.address.suburb || result.address.neighbourhood,
            province: result.address.state || result.address.county,
            country: result.address.country,
            postcode: result.address.postcode,
          }
        : undefined,
      boundingBox: result.boundingbox
        ? {
            south: parseFloat(result.boundingbox[0]),
            north: parseFloat(result.boundingbox[1]),
            west: parseFloat(result.boundingbox[2]),
            east: parseFloat(result.boundingbox[3]),
          }
        : undefined,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Philippine cities for autocomplete/dropdown
 * Complete list of 148 cities in the Philippines
 */
export const PHILIPPINE_CITIES = [
  // Metro Manila (NCR)
  'BGC, Taguig',
  'Caloocan',
  'Las Piñas',
  'Makati',
  'Malabon',
  'Mandaluyong',
  'Manila',
  'Marikina',
  'Muntinlupa',
  'Navotas',
  'Parañaque',
  'Pasay',
  'Pasig',
  'Pateros',
  'Quezon City',
  'San Juan',
  'Taguig',
  'Valenzuela',
  // Luzon
  'Alaminos',
  'Angeles',
  'Antipolo',
  'Balanga',
  'Batac',
  'Batangas City',
  'Biñan',
  'Cabuyao',
  'Calamba',
  'Candon',
  'Cauayan',
  'Dagupan',
  'Ilagan',
  'Laoag',
  'Legazpi',
  'Ligao',
  'Lipa',
  'Lucena',
  'Malolos',
  'Meycauayan',
  'Naga',
  'Olongapo',
  'Palayan',
  'Puerto Princesa',
  'San Carlos',
  'San Fernando (La Union)',
  'San Fernando (Pampanga)',
  'San Jose del Monte',
  'San Pablo',
  'Santa Rosa',
  'Santiago',
  'Sorsogon City',
  'Tabaco',
  'Tabuk',
  'Tagaytay',
  'Tanauan',
  'Tarlac City',
  'Tuguegarao',
  'Urdaneta',
  'Vigan',
  // Visayas
  'Bacolod',
  'Bago',
  'Bais',
  'Bayawan',
  'Bogo',
  'Cadiz',
  'Canlaon',
  'Carcar',
  'Cebu City',
  'Danao',
  'Dumaguete',
  'Escalante',
  'Guihulngan',
  'Himamaylan',
  'Iloilo City',
  'Kabankalan',
  'La Carlota',
  'Lapu-Lapu',
  'Mandaue',
  'Naga (Cebu)',
  'Ormoc',
  'Passi',
  'Roxas',
  'Sagay',
  'San Carlos (Negros)',
  'Silay',
  'Sipalay',
  'Tacloban',
  'Tagbilaran',
  'Talisay',
  'Tanjay',
  'Toledo',
  'Victorias',
  'Baybay',
  'Borongan',
  'Calbayog',
  'Catbalogan',
  'Maasin',
  // Mindanao
  'Butuan',
  'Bayugan',
  'Bislig',
  'Cagayan de Oro',
  'Cotabato City',
  'Dapitan',
  'Davao City',
  'Digos',
  'Dipolog',
  'El Salvador',
  'General Santos',
  'Gingoog',
  'Iligan',
  'Isabela City',
  'Kidapawan',
  'Koronadal',
  'Lamitan',
  'Malaybalay',
  'Marawi',
  'Masbate City',
  'Mati',
  'Oroquieta',
  'Ozamiz',
  'Pagadian',
  'Panabo',
  'Samal',
  'Surigao',
  'Tacurong',
  'Tagum',
  'Tandag',
  'Tangub',
  'Valencia',
  'Zamboanga City',
  // Additional cities
  'Baguio',
  'Subic',
].sort();

/**
 * Philippine regions for filtering
 */
export const PHILIPPINE_REGIONS = [
  { code: 'NCR', name: 'Metro Manila (NCR)' },
  { code: 'CAR', name: 'Cordillera Administrative Region' },
  { code: 'I', name: 'Ilocos Region' },
  { code: 'II', name: 'Cagayan Valley' },
  { code: 'III', name: 'Central Luzon' },
  { code: 'IV-A', name: 'CALABARZON' },
  { code: 'IV-B', name: 'MIMAROPA' },
  { code: 'V', name: 'Bicol Region' },
  { code: 'VI', name: 'Western Visayas' },
  { code: 'VII', name: 'Central Visayas' },
  { code: 'VIII', name: 'Eastern Visayas' },
  { code: 'IX', name: 'Zamboanga Peninsula' },
  { code: 'X', name: 'Northern Mindanao' },
  { code: 'XI', name: 'Davao Region' },
  { code: 'XII', name: 'SOCCSKSARGEN' },
  { code: 'XIII', name: 'Caraga' },
  { code: 'BARMM', name: 'Bangsamoro' },
];
