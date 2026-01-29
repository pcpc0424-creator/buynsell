import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { notifyInquiryForwarded } from '@/lib/notifications';

interface RouteParams {
  params: { id: string };
}

// Validation schema for forwarding
const forwardSchema = z.object({
  adminNotes: z.string().optional(),
  notifyByEmail: z.boolean().optional(),
});

// POST /api/inquiries/[id]/forward - Forward inquiry to agent (Admin only)
export async function POST(
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

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            mainImage: true,
            price: true,
            agent: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
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

    // Check if already forwarded
    if (inquiry.status === 'FORWARDED') {
      return NextResponse.json(
        { success: false, error: 'Inquiry has already been forwarded' },
        { status: 400 }
      );
    }

    if (inquiry.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Cannot forward a closed inquiry' },
        { status: 400 }
      );
    }

    // Get inquiry settings
    const settings = await prisma.inquirySetting.findFirst();

    // Check if forwarding is allowed (MODE_B)
    if (settings?.mode === 'MODE_A') {
      return NextResponse.json(
        { success: false, error: 'Forwarding is disabled in current mode (MODE_A)' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = forwardSchema.safeParse(body);

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

    const { adminNotes, notifyByEmail } = validationResult.data;

    // Update inquiry status to FORWARDED
    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: 'FORWARDED',
        forwardedAt: new Date(),
        adminNotes: adminNotes || inquiry.adminNotes,
      },
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
            agent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Check notification settings
    const shouldNotifyByEmail = notifyByEmail ?? settings?.notifyAgentByEmail ?? false;
    const shouldNotifyByApp = settings?.notifyAgentByApp ?? false;

    // Send email notification to agent
    if (shouldNotifyByEmail) {
      notifyInquiryForwarded(id).catch(console.error);
    }

    // TODO: Implement in-app notification
    if (shouldNotifyByApp) {
      // Create notification record
      console.log(`[TODO] Create in-app notification for agent ${inquiry.listing.agent.id}`);
    }

    return NextResponse.json({
      success: true,
      data: updatedInquiry,
      message: 'Inquiry forwarded to agent successfully',
      notifications: {
        email: shouldNotifyByEmail,
        app: shouldNotifyByApp,
      },
    });
  } catch (error) {
    console.error('Error forwarding inquiry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to forward inquiry' },
      { status: 500 }
    );
  }
}
