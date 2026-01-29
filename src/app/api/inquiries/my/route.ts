import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/inquiries/my - Get current user's inquiries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filter by status
    const status = searchParams.get('status');

    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          listing: {
            select: {
              id: true,
              title: true,
              mainImage: true,
              price: true,
              address: true,
              city: true,
              transactionType: true,
              propertyType: true,
              status: true,
            },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);

    // Map status to user-friendly messages
    const inquiriesWithStatus = inquiries.map((inquiry) => ({
      ...inquiry,
      statusMessage: getStatusMessage(inquiry.status),
    }));

    return NextResponse.json({
      success: true,
      data: inquiriesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user inquiries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Your inquiry is being reviewed';
    case 'REVIEWED':
      return 'Your inquiry has been reviewed';
    case 'FORWARDED':
      return 'Your inquiry has been sent to the agent';
    case 'CLOSED':
      return 'This inquiry has been resolved';
    default:
      return 'Unknown status';
  }
}
