import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { notifyNewInquiry } from '@/lib/notifications';

// Validation schema for creating an inquiry
const createInquirySchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// GET /api/inquiries - Get inquiries (Admin sees all, Agent sees forwarded to them)
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

    // Filters
    const status = searchParams.get('status');
    const listingId = searchParams.get('listingId');

    const isAdmin = session.user.role === 'ADMIN';
    const isAgent = session.user.role === 'AGENT';

    // Build where clause based on role
    const where: any = {};

    if (isAdmin) {
      // Admin sees all inquiries
      if (status) {
        where.status = status;
      }
      if (listingId) {
        where.listingId = listingId;
      }
    } else if (isAgent) {
      // Agent sees only forwarded inquiries for their listings
      where.listing = {
        agentId: session.user.id,
      };
      where.status = {
        in: ['FORWARDED', 'CLOSED'],
      };
      if (listingId) {
        where.listingId = listingId;
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const [inquiries, total, statusCounts] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              mainImage: true,
              price: true,
              transactionType: true,
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
      }),
      prisma.inquiry.count({ where }),
      // Get counts by status for admin
      isAdmin
        ? prisma.inquiry.groupBy({
            by: ['status'],
            _count: true,
          })
        : null,
    ]);

    // Transform status counts
    const counts: Record<string, number> = {
      total: 0,
      PENDING: 0,
      REVIEWED: 0,
      FORWARDED: 0,
      CLOSED: 0,
    };

    if (statusCounts) {
      statusCounts.forEach((item) => {
        counts[item.status] = item._count;
        counts.total += item._count;
      });
    }

    return NextResponse.json({
      success: true,
      data: inquiries,
      counts: isAdmin ? counts : undefined,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

// POST /api/inquiries - Create a new inquiry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to submit an inquiry' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createInquirySchema.safeParse(body);
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

    const { listingId, name, email, phone, message } = validationResult.data;

    // Check if listing exists and is approved
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
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

    if (listing.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Cannot inquire about this listing' },
        { status: 400 }
      );
    }

    // Prevent agent from inquiring their own listing
    if (listing.agentId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot inquire about your own listing' },
        { status: 400 }
      );
    }

    // Check for duplicate recent inquiry (within 24 hours)
    const recentInquiry = await prisma.inquiry.findFirst({
      where: {
        userId: session.user.id,
        listingId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentInquiry) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already submitted an inquiry for this listing recently. Please wait 24 hours.',
        },
        { status: 429 }
      );
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        userId: session.user.id,
        listingId,
        name,
        email,
        phone,
        message,
        status: 'PENDING',
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get inquiry settings to check for auto-forward
    const _settings = await prisma.inquirySetting.findFirst();

    // Send notification emails (async, don't wait)
    notifyNewInquiry(inquiry.id).catch(console.error);

    // TODO: If MODE_B and autoForwardDelay is set, schedule auto-forward

    return NextResponse.json(
      {
        success: true,
        data: inquiry,
        message: 'Your inquiry has been submitted. We will get back to you soon.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
