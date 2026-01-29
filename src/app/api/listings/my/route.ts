import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/listings/my - Get current agent's listings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only agents can have listings
    if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only agents can access this endpoint' },
        { status: 403 }
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
      agentId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [listings, total, statusCounts] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              inquiries: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
      // Get counts by status
      prisma.listing.groupBy({
        by: ['status'],
        where: { agentId: session.user.id },
        _count: true,
      }),
    ]);

    // Transform status counts to object
    const counts = {
      total: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    statusCounts.forEach((item) => {
      counts[item.status as keyof typeof counts] = item._count;
      counts.total += item._count;
    });

    return NextResponse.json({
      success: true,
      data: listings,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching agent listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
