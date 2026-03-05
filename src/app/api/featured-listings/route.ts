import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/featured-listings - Get active featured listings (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const featuredListings = await prisma.featuredListing.findMany({
      where: {
        isActive: true,
        listing: {
          status: 'APPROVED',
        },
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            price: true,
            transactionType: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            mainImage: true,
            images: {
              take: 1,
              select: { url: true },
            },
            agent: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Sort: position > 0 comes first (sorted by position asc), then position 0 (sorted by createdAt desc)
    const sortedListings = featuredListings.sort((a, b) => {
      // Both have position > 0: sort by position ascending
      if (a.position > 0 && b.position > 0) {
        return a.position - b.position;
      }
      // a has position > 0, b has position 0: a comes first
      if (a.position > 0 && b.position === 0) {
        return -1;
      }
      // a has position 0, b has position > 0: b comes first
      if (a.position === 0 && b.position > 0) {
        return 1;
      }
      // Both have position 0: sort by createdAt descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply limit after sorting
    const limitedListings = sortedListings.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedListings,
    });
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured listings' },
      { status: 500 }
    );
  }
}
