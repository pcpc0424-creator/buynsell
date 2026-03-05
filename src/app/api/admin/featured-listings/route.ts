import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Validation schema for featured listing
const createFeaturedSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  position: z.number().int().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/featured-listings - Get all featured listings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const featuredListings = await prisma.featuredListing.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            mainImage: true,
            price: true,
            transactionType: true,
            propertyType: true,
            city: true,
            status: true,
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
      if (a.position > 0 && b.position > 0) {
        return a.position - b.position;
      }
      if (a.position > 0 && b.position === 0) {
        return -1;
      }
      if (a.position === 0 && b.position > 0) {
        return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      data: sortedListings,
    });
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured listings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/featured-listings - Add listing to featured
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createFeaturedSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if listing exists and is approved
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Only approved listings can be featured' },
        { status: 400 }
      );
    }

    // Check if already featured
    const existing = await prisma.featuredListing.findUnique({
      where: { listingId: data.listingId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Listing is already featured' },
        { status: 400 }
      );
    }

    // Get next position if not provided (position starts from 1)
    if (data.position === undefined) {
      const lastFeatured = await prisma.featuredListing.findFirst({
        where: { position: { gt: 0 } },
        orderBy: { position: 'desc' },
      });
      data.position = (lastFeatured?.position ?? 0) + 1;
    }

    // Create featured listing
    const featured = await prisma.featuredListing.create({
      data: {
        listingId: data.listingId,
        position: data.position,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            mainImage: true,
            price: true,
          },
        },
      },
    });

    // Also update the listing's isFeatured flag
    await prisma.listing.update({
      where: { id: data.listingId },
      data: { isFeatured: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: featured,
        message: 'Listing added to featured',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating featured listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create featured listing' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/featured-listings - Reorder featured listings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body.order)) {
      return NextResponse.json(
        { success: false, error: 'order array is required' },
        { status: 400 }
      );
    }

    // Update positions (ensure positions start from 1)
    const updates = body.order.map((item: { id: string; position: number }, index: number) =>
      prisma.featuredListing.update({
        where: { id: item.id },
        data: { position: index + 1 },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: 'Featured listings reordered',
    });
  } catch (error) {
    console.error('Error reordering featured listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder featured listings' },
      { status: 500 }
    );
  }
}
