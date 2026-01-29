import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geocoding';

// GET /api/listings/nearby - Get listings near a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseFloat(searchParams.get('radius') || '10'); // km
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'lat and lng parameters are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Calculate bounding box for initial filter (approximate)
    // 1 degree of latitude ≈ 111 km
    // 1 degree of longitude ≈ 111 km * cos(latitude)
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    // Query listings within bounding box first (fast DB filter)
    const listings = await prisma.listing.findMany({
      where: {
        status: 'APPROVED',
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
    });

    // Calculate actual distance and filter
    const listingsWithDistance = listings
      .map((listing) => ({
        ...listing,
        distance: calculateDistance(
          latitude,
          longitude,
          listing.latitude!,
          listing.longitude!
        ),
      }))
      .filter((listing) => listing.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: listingsWithDistance,
      meta: {
        center: { latitude, longitude },
        radius,
        count: listingsWithDistance.length,
      },
    });
  } catch (error) {
    console.error('Error fetching nearby listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nearby listings' },
      { status: 500 }
    );
  }
}
