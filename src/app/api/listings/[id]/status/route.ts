import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { notifyListingApproved, notifyListingRejected } from '@/lib/notifications';

// Validation schema for status update
const statusUpdateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

interface RouteParams {
  params: { id: string };
}

// PATCH /api/listings/[id]/status - Approve or reject listing (Admin only)
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

    // Only admins can approve/reject
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
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

    const body = await request.json();

    // Validate input
    const validationResult = statusUpdateSchema.safeParse(body);
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

    const { status, rejectionReason } = validationResult.data;

    // Prepare update data
    const updateData: any = {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
    };

    // If approving, record approval details
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = session.user.id;
    } else {
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    // Update listing status
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    // Send notification to agent about approval/rejection
    if (status === 'APPROVED') {
      notifyListingApproved(id).catch(console.error);
    } else {
      notifyListingRejected(id).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      data: updatedListing,
      message: status === 'APPROVED'
        ? 'Listing has been approved and is now visible to the public'
        : 'Listing has been rejected',
    });
  } catch (error) {
    console.error('Error updating listing status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing status' },
      { status: 500 }
    );
  }
}

// GET /api/listings/[id]/status - Get listing status (for agents checking their listing)
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

    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        rejectionReason: true,
        agentId: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check permissions - only owner or admin can see status details
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = session.user.id === listing.agentId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('Error fetching listing status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing status' },
      { status: 500 }
    );
  }
}
