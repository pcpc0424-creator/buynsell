import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Validation schema for updating a listing
const updateListingSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  transactionType: z.enum(['RENT', 'SALE']).optional(),
  propertyType: z.enum(['HOUSE', 'CONDO', 'TOWNHOUSE', 'COMMERCIAL', 'LOT', 'NEW_DEVELOPMENT']).optional(),
  propertyStatus: z.enum(['NEW', 'USED', 'UNDER_CONSTRUCTION']).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(1).optional(),
  barangay: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  area: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  parking: z.number().int().min(0).optional(),
  floorNumber: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  mainImage: z.string().url().optional(),
  images: z.array(z.object({
    id: z.string().optional(), // For existing images
    url: z.string().url(),
    caption: z.string().optional(),
    order: z.number().int().optional(),
  })).optional(),
});

interface RouteParams {
  params: { id: string };
}

// GET /api/listings/[id] - Get listing detail
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            agentProfile: {
              select: {
                bio: true,
                licenseNumber: true,
                specialization: true,
                yearsExperience: true,
                rating: true,
                reviewCount: true,
                isVerified: true,
              },
            },
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            inquiries: true,
            favorites: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';
    const isOwner = session?.user?.id === listing.agentId;

    // Only approved listings are public
    if (listing.status !== 'APPROVED' && !isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Increment view count for approved listings viewed by non-owners
    if (listing.status === 'APPROVED' && !isOwner) {
      await prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    // Remove sensitive agent info for public view
    if (!isAdmin && !isOwner) {
      const { email: _email, phone: _phone, ...safeAgent } = listing.agent;
      return NextResponse.json({
        success: true,
        data: {
          ...listing,
          agent: safeAgent,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[id] - Update listing (Owner or Admin only)
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

    const { id } = params;

    // Find the listing
    const existingListing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = session.user.id === existingListing.agentId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateListingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const { images, ...listingData } = data;

    // If non-admin updates, set status back to PENDING for re-approval
    const updateData: any = { ...listingData };
    if (!isAdmin && Object.keys(listingData).length > 0) {
      updateData.status = 'PENDING';
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    // Handle images update if provided
    if (images !== undefined) {
      // Delete existing images not in the new list
      const existingImageIds = existingListing.images.map(img => img.id);
      const newImageIds = images.filter(img => img.id).map(img => img.id);
      const imagesToDelete = existingImageIds.filter(id => !newImageIds.includes(id));

      if (imagesToDelete.length > 0) {
        await prisma.listingImage.deleteMany({
          where: { id: { in: imagesToDelete } },
        });
      }

      // Update or create images
      for (const image of images) {
        if (image.id) {
          // Update existing
          await prisma.listingImage.update({
            where: { id: image.id },
            data: {
              url: image.url,
              caption: image.caption,
              order: image.order,
            },
          });
        } else {
          // Create new
          await prisma.listingImage.create({
            data: {
              listingId: id,
              url: image.url,
              caption: image.caption,
              order: image.order ?? 0,
            },
          });
        }
      }
    }

    // Update listing
    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: listing,
      message: isAdmin
        ? 'Listing updated successfully'
        : 'Listing updated. It will be visible after admin re-approval.',
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id] - Delete listing (Owner or Admin only)
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

    const { id } = params;

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = session.user.id === listing.agentId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete listing (cascades to images, favorites, etc.)
    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
