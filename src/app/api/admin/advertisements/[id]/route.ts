import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// Validation schema for advertisement update
const updateAdSchema = z.object({
  title: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional().nullable(),
  position: z.enum(['MAIN_BANNER', 'SIDEBAR', 'LIST_TOP', 'LIST_BOTTOM', 'PROPERTY_DETAIL']).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

// GET /api/admin/advertisements/[id] - Get advertisement detail
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

    const ad = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisement' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/advertisements/[id] - Update advertisement
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

    const existingAd = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!existingAd) {
      return NextResponse.json(
        { success: false, error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateAdSchema.safeParse(body);
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

    // Convert date strings to Date objects
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const ad = await prisma.advertisement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: ad,
      message: 'Advertisement updated successfully',
    });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update advertisement' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/advertisements/[id] - Delete advertisement
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

    const ad = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    await prisma.advertisement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Advertisement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete advertisement' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/advertisements/[id] - Toggle active status
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

    const ad = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    const updatedAd = await prisma.advertisement.update({
      where: { id },
      data: { isActive: !ad.isActive },
    });

    return NextResponse.json({
      success: true,
      data: updatedAd,
      message: `Advertisement ${updatedAd.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error('Error toggling advertisement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle advertisement' },
      { status: 500 }
    );
  }
}
