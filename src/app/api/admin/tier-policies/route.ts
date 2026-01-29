import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const TIERS = ['GREEN', 'SILVER', 'GOLD', 'PREMIUM'] as const;

// Validation schema for tier policy
const tierPolicySchema = z.object({
  dailyViewLimit: z.number().int().min(-1).optional(), // -1 = unlimited
  monthlyViewLimit: z.number().int().min(-1).optional(),
  listingLimit: z.number().int().min(0).optional(),
  maxViewablePrice: z.number().positive().nullable().optional(),
  monthlySubscriptionPrice: z.number().positive().nullable().optional(),
  pointsPerView: z.number().int().min(0).optional(),
  pointsPerListing: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
});

// GET /api/admin/tier-policies - Get all tier policies
export async function GET(_request: NextRequest) {
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

    // Get all policies
    let policies = await prisma.tierPolicy.findMany({
      orderBy: {
        tier: 'asc',
      },
    });

    // Create default policies for missing tiers
    const existingTiers = policies.map((p) => p.tier);
    const missingTiers = TIERS.filter((t) => !existingTiers.includes(t));

    if (missingTiers.length > 0) {
      const defaultPolicies = missingTiers.map((tier) => ({
        tier,
        dailyViewLimit: tier === 'GREEN' ? 10 : tier === 'SILVER' ? 50 : -1,
        monthlyViewLimit: tier === 'GREEN' ? 100 : tier === 'SILVER' ? 500 : -1,
        listingLimit: tier === 'GREEN' ? 0 : tier === 'SILVER' ? 5 : tier === 'GOLD' ? 20 : 100,
        maxViewablePrice: tier === 'GREEN' ? 5000000 : null,
        monthlySubscriptionPrice: tier === 'GREEN' ? null : tier === 'SILVER' ? 9.99 : tier === 'GOLD' ? 29.99 : 99.99,
        pointsPerView: tier === 'GREEN' ? 1 : 0,
        pointsPerListing: tier === 'GREEN' ? 10 : tier === 'SILVER' ? 5 : 0,
        description: getDefaultDescription(tier),
      }));

      await prisma.tierPolicy.createMany({
        data: defaultPolicies,
      });

      // Refetch all policies
      policies = await prisma.tierPolicy.findMany({
        orderBy: {
          tier: 'asc',
        },
      });
    }

    // Get user counts per tier
    const userCounts = await prisma.user.groupBy({
      by: ['tier'],
      _count: true,
    });

    const userCountMap = userCounts.reduce((acc, item) => {
      acc[item.tier] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Add user counts to policies
    const policiesWithCounts = policies.map((policy) => ({
      ...policy,
      userCount: userCountMap[policy.tier] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: policiesWithCounts,
    });
  } catch (error) {
    console.error('Error fetching tier policies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tier policies' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tier-policies - Bulk update tier policies
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

    if (!Array.isArray(body.policies)) {
      return NextResponse.json(
        { success: false, error: 'policies array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const policyData of body.policies) {
      if (!policyData.tier || !TIERS.includes(policyData.tier)) {
        continue;
      }

      const validationResult = tierPolicySchema.safeParse(policyData);
      if (!validationResult.success) {
        continue;
      }

      const result = await prisma.tierPolicy.upsert({
        where: { tier: policyData.tier },
        update: validationResult.data,
        create: {
          tier: policyData.tier,
          ...validationResult.data,
        },
      });

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Updated ${results.length} tier policies`,
    });
  } catch (error) {
    console.error('Error updating tier policies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tier policies' },
      { status: 500 }
    );
  }
}

function getDefaultDescription(tier: string): string {
  switch (tier) {
    case 'GREEN':
      return 'Free tier with limited access';
    case 'SILVER':
      return 'Basic paid tier with expanded limits';
    case 'GOLD':
      return 'Premium tier for serious users';
    case 'PREMIUM':
      return 'Unlimited access for professionals';
    default:
      return '';
  }
}
