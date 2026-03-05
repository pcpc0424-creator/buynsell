import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// Validation schema for update
const updateFeaturedSchema = z.object({
  position: z.number().int().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/featured-listings/[id] - Get featured listing detail
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params;

    const featured = await prisma.featuredListing.findUnique({
      where: { id },
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
            viewCount: true,
            agent: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
            _count: {
              select: {
                inquiries: true,
                favorites: true,
              },
            },
          },
        },
      },
    });

    if (!featured) {
      return NextResponse.json(
        { success: false, error: 'Featured listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: featured,
    });
  } catch (error) {
    console.error('Error fetching featured listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured listing' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/featured-listings/[id] - Update featured listing
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params;

    const existing = await prisma.featuredListing.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Featured listing not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateFeaturedSchema.safeParse(body);
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

    const updateData: any = { ...data };

    // Convert date strings
    if (data.startDate !== undefined) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    // Handle position change - shift other listings' positions
    if (data.position !== undefined && data.position !== existing.position) {
      const newPosition = data.position;
      const oldPosition = existing.position;

      if (newPosition > 0) {
        if (oldPosition === 0) {
          // Moving from unset (0) to a specific position
          // Shift all items at newPosition or higher up by 1
          await prisma.featuredListing.updateMany({
            where: {
              id: { not: id },
              position: { gte: newPosition },
            },
            data: {
              position: { increment: 1 },
            },
          });
        } else if (newPosition < oldPosition) {
          // Moving up (e.g., from position 3 to position 1)
          // Shift items between newPosition and oldPosition-1 down by 1
          await prisma.featuredListing.updateMany({
            where: {
              id: { not: id },
              position: {
                gte: newPosition,
                lt: oldPosition,
              },
            },
            data: {
              position: { increment: 1 },
            },
          });
        } else if (newPosition > oldPosition) {
          // Moving down (e.g., from position 1 to position 3)
          // Shift items between oldPosition+1 and newPosition up by 1
          await prisma.featuredListing.updateMany({
            where: {
              id: { not: id },
              position: {
                gt: oldPosition,
                lte: newPosition,
              },
            },
            data: {
              position: { decrement: 1 },
            },
          });
        }
      }
    }

    const featured = await prisma.featuredListing.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: featured,
      message: 'Featured listing updated',
    });
  } catch (error) {
    console.error('Error updating featured listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update featured listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/featured-listings/[id] - Remove from featured
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params;

    const featured = await prisma.featuredListing.findUnique({
      where: { id },
    });

    if (!featured) {
      return NextResponse.json(
        { success: false, error: 'Featured listing not found' },
        { status: 404 }
      );
    }

    // Delete featured listing
    await prisma.featuredListing.delete({
      where: { id },
    });

    // Update the listing's isFeatured flag
    await prisma.listing.update({
      where: { id: featured.listingId },
      data: { isFeatured: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing removed from featured',
    });
  } catch (error) {
    console.error('Error deleting featured listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete featured listing' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/featured-listings/[id] - Toggle active status
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params;

    const featured = await prisma.featuredListing.findUnique({
      where: { id },
    });

    if (!featured) {
      return NextResponse.json(
        { success: false, error: 'Featured listing not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.featuredListing.update({
      where: { id },
      data: { isActive: !featured.isActive },
    });

    // Also update listing flag
    await prisma.listing.update({
      where: { id: featured.listingId },
      data: { isFeatured: updated.isActive },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Featured listing ${updated.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error('Error toggling featured listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle featured listing' },
      { status: 500 }
    );
  }
}
