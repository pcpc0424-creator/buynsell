import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: { tier: string };
}

const VALID_TIERS = ['GREEN', 'SILVER', 'GOLD', 'PREMIUM'];

// Validation schema for tier policy update
const tierPolicyUpdateSchema = z.object({
  dailyViewLimit: z.number().int().min(-1).optional(),
  monthlyViewLimit: z.number().int().min(-1).optional(),
  listingLimit: z.number().int().min(0).optional(),
  maxViewablePrice: z.number().positive().nullable().optional(),
  monthlySubscriptionPrice: z.number().positive().nullable().optional(),
  pointsPerView: z.number().int().min(0).optional(),
  pointsPerListing: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
});

// GET /api/admin/tier-policies/[tier] - Get specific tier policy
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

    const { tier } = params;
    const upperTier = tier.toUpperCase();

    if (!VALID_TIERS.includes(upperTier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const policy = await prisma.tierPolicy.findUnique({
      where: { tier: upperTier as any },
    });

    if (!policy) {
      return NextResponse.json(
        { success: false, error: 'Tier policy not found' },
        { status: 404 }
      );
    }

    // Get user count for this tier
    const userCount = await prisma.user.count({
      where: { tier: upperTier as any },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...policy,
        userCount,
      },
    });
  } catch (error) {
    console.error('Error fetching tier policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tier policy' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tier-policies/[tier] - Update specific tier policy
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

    const { tier } = params;
    const upperTier = tier.toUpperCase();

    if (!VALID_TIERS.includes(upperTier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = tierPolicyUpdateSchema.safeParse(body);
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

    // Upsert policy (create if not exists)
    const policy = await prisma.tierPolicy.upsert({
      where: { tier: upperTier as any },
      update: data,
      create: {
        tier: upperTier as any,
        ...data,
      },
    });

    return NextResponse.json({
      success: true,
      data: policy,
      message: `${upperTier} tier policy updated successfully`,
    });
  } catch (error) {
    console.error('Error updating tier policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tier policy' },
      { status: 500 }
    );
  }
}
