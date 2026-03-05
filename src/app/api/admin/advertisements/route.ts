import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Validation schema for advertisement
const createAdSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  linkUrl: z.string().optional().nullable().or(z.literal('')),
  position: z.enum(['MAIN_BANNER', 'SIDEBAR', 'LIST_TOP', 'LIST_BOTTOM', 'PROPERTY_DETAIL']),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

// GET /api/admin/advertisements - Get all advertisements
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
    const position = searchParams.get('position');
    const isActive = searchParams.get('isActive');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (position) {
      where.position = position;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [ads, total, positionCounts] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ position: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.advertisement.count({ where }),
      prisma.advertisement.groupBy({
        by: ['position'],
        _count: true,
      }),
    ]);

    // Transform position counts
    const counts = positionCounts.reduce((acc, item) => {
      acc[item.position] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: ads,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  }
}

// POST /api/admin/advertisements - Create advertisement
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
    const validationResult = createAdSchema.safeParse(body);
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

    // Get next order number for position if not provided
    if (data.order === undefined) {
      const lastAd = await prisma.advertisement.findFirst({
        where: { position: data.position },
        orderBy: { order: 'desc' },
      });
      data.order = (lastAd?.order ?? -1) + 1;
    }

    const ad = await prisma.advertisement.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        position: data.position,
        isActive: data.isActive ?? true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        order: data.order,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: ad,
        message: 'Advertisement created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating advertisement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create advertisement' },
      { status: 500 }
    );
  }
}
