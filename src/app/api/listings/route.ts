import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Validation schema for creating a listing
const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  transactionType: z.enum(['RENT', 'SALE']),
  propertyType: z.enum(['HOUSE', 'CONDO', 'TOWNHOUSE', 'COMMERCIAL', 'LOT', 'NEW_DEVELOPMENT']),
  propertyStatus: z.enum(['NEW', 'USED', 'UNDER_CONSTRUCTION']).optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  barangay: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  area: z.number().positive().optional(),
  lotArea: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  parking: z.number().int().min(0).optional(),
  floorNumber: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  mainImage: z.string().min(1, 'Main image is required'),
  images: z.array(z.object({
    url: z.string().min(1),
    caption: z.string().optional(),
    order: z.number().int().optional(),
  })).optional(),
});

// GET /api/listings - Get listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Filters
    const transactionType = searchParams.get('transactionType');
    const propertyType = searchParams.get('propertyType');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const status = searchParams.get('status'); // For admin: PENDING, APPROVED, REJECTED
    const agentId = searchParams.get('agentId'); // For agent's own listings
    const featured = searchParams.get('featured'); // Show featured first

    // Build where clause
    const where: any = {};

    // Default: only show approved listings to public
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';
    const isAgent = session?.user?.role === 'AGENT';

    if (status && isAdmin) {
      where.status = status;
    } else if (agentId && (isAdmin || (isAgent && session?.user?.id === agentId))) {
      // Agent viewing their own listings (all statuses)
      where.agentId = agentId;
    } else {
      // Public view: only approved
      where.status = 'APPROVED';
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (bedrooms) {
      where.bedrooms = {
        gte: parseInt(bedrooms),
      };
    }

    // Build orderBy
    const orderBy: any[] = [];

    // Featured listings first
    if (featured === 'true') {
      orderBy.push({ isFeatured: 'desc' });
    }

    orderBy.push({ createdAt: 'desc' });

    // Execute query
    const [listings, total, statusCounts] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              image: true,
              agentProfile: {
                select: {
                  rating: true,
                  reviewCount: true,
                  isVerified: true,
                },
              },
            },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 5,
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
      // Get status counts for admin
      isAdmin ? prisma.listing.groupBy({
        by: ['status'],
        _count: true,
      }) : Promise.resolve([]),
    ]);

    // Transform status counts
    const counts = isAdmin ? statusCounts.reduce((acc: Record<string, number>, item: { status: string; _count: number }) => {
      acc[item.status] = item._count;
      return acc;
    }, {}) : undefined;

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing (Agent only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only agents can create listings
    if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only agents can create listings' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createListingSchema.safeParse(body);
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

    // Check agent's listing limit based on tier
    const tierPolicy = await prisma.tierPolicy.findUnique({
      where: { tier: session.user.tier as any },
    });

    if (tierPolicy && tierPolicy.listingLimit > 0) {
      const currentListingCount = await prisma.listing.count({
        where: {
          agentId: session.user.id,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

      if (currentListingCount >= tierPolicy.listingLimit) {
        return NextResponse.json(
          {
            success: false,
            error: `Listing limit reached. Your ${session.user.tier} tier allows ${tierPolicy.listingLimit} active listings.`
          },
          { status: 403 }
        );
      }
    }

    // Create listing with images
    const listing = await prisma.listing.create({
      data: {
        ...listingData,
        agentId: session.user.id,
        status: 'PENDING', // All new listings require approval
        images: images ? {
          create: images.map((img, index) => ({
            url: img.url,
            caption: img.caption,
            order: img.order ?? index,
          })),
        } : undefined,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: listing,
        message: 'Listing created successfully. It will be visible after admin approval.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
