import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import {
  isPayPalConfigured,
  createPayPalOrder,
  SUBSCRIPTION_PLANS,
  POINTS_PACKAGES,
  FEATURED_LISTING_PRICES,
  PaymentType,
} from '@/lib/paypal';

// Validation schema for order creation
const createOrderSchema = z.object({
  type: z.enum(['subscription', 'points', 'featured_listing']),
  // For subscription
  tier: z.enum(['SILVER', 'GOLD', 'PREMIUM']).optional(),
  // For points
  packageId: z.string().optional(),
  // For featured listing
  listingId: z.string().optional(),
  duration: z.enum(['7_days', '14_days', '30_days']).optional(),
});

// POST /api/payments/orders - Create a payment order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createOrderSchema.safeParse(body);
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

    const { type, tier, packageId, listingId, duration } = validationResult.data;

    let amount: number;
    let currency: string = 'USD';
    let description: string;
    const metadata: Record<string, string | number> = { userId: session.user.id };

    // Calculate amount based on type
    switch (type) {
      case 'subscription':
        if (!tier) {
          return NextResponse.json(
            { success: false, error: 'Tier is required for subscription' },
            { status: 400 }
          );
        }
        const plan = SUBSCRIPTION_PLANS[tier];
        amount = plan.price;
        currency = plan.currency;
        description = `${plan.name} - Monthly Subscription`;
        metadata.tier = tier;
        break;

      case 'points':
        if (!packageId) {
          return NextResponse.json(
            { success: false, error: 'Package ID is required for points purchase' },
            { status: 400 }
          );
        }
        const pointsPackage = POINTS_PACKAGES.find((p) => p.id === packageId);
        if (!pointsPackage) {
          return NextResponse.json(
            { success: false, error: 'Invalid points package' },
            { status: 400 }
          );
        }
        amount = pointsPackage.price;
        currency = pointsPackage.currency;
        description = `${pointsPackage.points + pointsPackage.bonus} Points`;
        metadata.packageId = packageId;
        metadata.points = pointsPackage.points + pointsPackage.bonus;
        break;

      case 'featured_listing':
        if (!listingId || !duration) {
          return NextResponse.json(
            { success: false, error: 'Listing ID and duration are required' },
            { status: 400 }
          );
        }
        // Verify listing exists and user owns it
        const listing = await prisma.listing.findUnique({
          where: { id: listingId },
        });
        if (!listing) {
          return NextResponse.json(
            { success: false, error: 'Listing not found' },
            { status: 404 }
          );
        }
        if (listing.agentId !== session.user.id && session.user.role !== 'ADMIN') {
          return NextResponse.json(
            { success: false, error: 'You can only feature your own listings' },
            { status: 403 }
          );
        }
        const featuredPrice = FEATURED_LISTING_PRICES[duration];
        amount = featuredPrice.price;
        currency = featuredPrice.currency;
        description = `Featured Listing - ${featuredPrice.days} Days`;
        metadata.listingId = listingId;
        metadata.duration = duration;
        metadata.days = featuredPrice.days;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid payment type' },
          { status: 400 }
        );
    }

    // Create PayPal order
    const order = await createPayPalOrder({
      type: type as PaymentType,
      amount,
      currency,
      description,
      metadata,
    });

    // Store order in database for tracking
    // Note: You might want to create a PaymentOrder model for this
    // For now, we'll return the order directly

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount,
        currency,
        description,
        approveUrl: order.approveUrl,
        type,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

// GET /api/payments/orders - Get user's payment history
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get subscriptions as payment history
    const [subscriptions, pointsTransactions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.pointsLedger.findMany({
        where: {
          userId: session.user.id,
          type: 'CREDIT',
          description: { contains: 'purchase' },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.subscription.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        pointsTransactions,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
