import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TIERS = ['GREEN', 'SILVER', 'GOLD', 'PREMIUM'] as const;

// GET /api/tier-policies - Get all tier policies (public endpoint)
export async function GET(_request: NextRequest) {
  try {
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

    // Return policies without sensitive info (public endpoint)
    const publicPolicies = policies.map((policy) => ({
      tier: policy.tier,
      dailyViewLimit: policy.dailyViewLimit,
      monthlyViewLimit: policy.monthlyViewLimit,
      listingLimit: policy.listingLimit,
      maxViewablePrice: policy.maxViewablePrice,
      monthlySubscriptionPrice: policy.monthlySubscriptionPrice,
      pointsPerView: policy.pointsPerView,
      pointsPerListing: policy.pointsPerListing,
      description: policy.description,
    }));

    return NextResponse.json({
      success: true,
      data: publicPolicies,
    });
  } catch (error) {
    console.error('Error fetching tier policies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tier policies' },
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
