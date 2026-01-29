import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// Validation schema for status update
const statusUpdateSchema = z.object({
  status: z.enum(['REVIEWED', 'CLOSED']),
  adminNotes: z.string().optional(),
});

// PATCH /api/inquiries/[id]/status - Update inquiry status (Admin or Agent)
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

    const { id } = params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            agentId: true,
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isAgent = session.user.id === inquiry.listing.agentId;

    // Only admin can change status, agent can only close forwarded inquiries
    if (!isAdmin && !isAgent) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = statusUpdateSchema.safeParse(body);

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

    const { status, adminNotes } = validationResult.data;

    // Agent can only close forwarded inquiries
    if (isAgent && !isAdmin) {
      if (inquiry.status !== 'FORWARDED') {
        return NextResponse.json(
          { success: false, error: 'Can only close forwarded inquiries' },
          { status: 403 }
        );
      }
      if (status !== 'CLOSED') {
        return NextResponse.json(
          { success: false, error: 'Agents can only close inquiries' },
          { status: 403 }
        );
      }
    }

    const updateData: any = { status };
    if (adminNotes !== undefined && isAdmin) {
      updateData.adminNotes = adminNotes;
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      data: updatedInquiry,
      message: `Inquiry marked as ${status.toLowerCase()}`,
    });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inquiry status' },
      { status: 500 }
    );
  }
}
