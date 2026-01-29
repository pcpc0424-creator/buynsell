import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, reverseGeocode } from '@/lib/geocoding';

// Simple in-memory cache to respect Nominatim rate limits
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
let lastRequestTime = 0;

// Rate limiting helper
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
}

// GET /api/geocode?address=... - Forward geocoding
// GET /api/geocode?lat=...&lng=... - Reverse geocoding
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Forward geocoding
    if (address) {
      const cacheKey = `forward:${address.toLowerCase()}`;
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
          success: true,
          data: cached.data,
          cached: true,
        });
      }

      await waitForRateLimit();

      const results = await geocodeAddress(address, {
        countryCode: 'ph',
        limit,
      });

      // Cache the results
      cache.set(cacheKey, { data: results, timestamp: Date.now() });

      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    // Reverse geocoding
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { success: false, error: 'Invalid coordinates' },
          { status: 400 }
        );
      }

      // Validate coordinates are within reasonable bounds for Philippines
      if (
        latitude < 4 || latitude > 22 ||
        longitude < 114 || longitude > 128
      ) {
        return NextResponse.json(
          { success: false, error: 'Coordinates outside Philippines bounds' },
          { status: 400 }
        );
      }

      const cacheKey = `reverse:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
          success: true,
          data: cached.data,
          cached: true,
        });
      }

      await waitForRateLimit();

      const result = await reverseGeocode(latitude, longitude);

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'No results found' },
          { status: 404 }
        );
      }

      // Cache the result
      cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide either address or lat/lng parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { success: false, error: 'Geocoding service temporarily unavailable' },
      { status: 503 }
    );
  }
}
