import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/listings/bounds - Get listings within map bounds
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Bounds parameters
    const north = parseFloat(searchParams.get('north') || '');
    const south = parseFloat(searchParams.get('south') || '');
    const east = parseFloat(searchParams.get('east') || '');
    const west = parseFloat(searchParams.get('west') || '');

    if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bounds. Provide north, south, east, west parameters' },
        { status: 400 }
      );
    }

    // Additional filters
    const transactionType = searchParams.get('transactionType');
    const propertyType = searchParams.get('propertyType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: any = {
      status: 'APPROVED',
      latitude: {
        gte: south,
        lte: north,
      },
      longitude: {
        gte: west,
        lte: east,
      },
    };

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms) };
    }

    // Query listings
    const listings = await prisma.listing.findMany({
      where,
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        price: true,
        mainImage: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        transactionType: true,
        propertyType: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        isFeatured: true,
      },
    });

    // Calculate center of results
    const validListings = listings.filter(
      (l) => l.latitude !== null && l.longitude !== null
    );

    let center = null;
    if (validListings.length > 0) {
      const avgLat =
        validListings.reduce((sum, l) => sum + l.latitude!, 0) / validListings.length;
      const avgLng =
        validListings.reduce((sum, l) => sum + l.longitude!, 0) / validListings.length;
      center = { latitude: avgLat, longitude: avgLng };
    }

    return NextResponse.json({
      success: true,
      data: listings,
      meta: {
        bounds: { north, south, east, west },
        count: listings.length,
        center,
      },
    });
  } catch (error) {
    console.error('Error fetching listings by bounds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
