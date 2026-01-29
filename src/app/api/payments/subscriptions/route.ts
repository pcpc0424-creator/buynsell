import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import {
  isPayPalConfigured,
  createPayPalSubscription,
  SUBSCRIPTION_PLANS,
} from '@/lib/paypal';

// Validation schema for subscription creation
const createSubscriptionSchema = z.object({
  tier: z.enum(['SILVER', 'GOLD', 'PREMIUM']),
});

// GET /api/payments/subscriptions - Get user's subscriptions
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Get current active subscription
    const activeSubscription = subscriptions.find(
      (s) => s.status === 'ACTIVE' && new Date(s.endDate) > new Date()
    );

    // Get available plans
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      tier: key,
      ...plan,
      isCurrent: activeSubscription?.tier === key,
    }));

    return NextResponse.json({
      success: true,
      data: {
        currentSubscription: activeSubscription,
        subscriptionHistory: subscriptions,
        availablePlans: plans,
        currentTier: session.user.tier,
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/payments/subscriptions - Create a new subscription
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
    const validationResult = createSubscriptionSchema.safeParse(body);
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

    const { tier } = validationResult.data;

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active subscription. Please cancel it first or wait for it to expire.',
          currentSubscription: existingSubscription,
        },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[tier];

    if (!plan.paypalPlanId) {
      // If no PayPal plan ID, use one-time payment flow instead
      return NextResponse.json({
        success: true,
        data: {
          useOneTimePayment: true,
          tier,
          plan,
          message: 'Use /api/payments/orders to create a one-time payment for subscription',
        },
      });
    }

    // Create PayPal subscription
    const { subscriptionId, approveUrl } = await createPayPalSubscription(
      plan.paypalPlanId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId,
        approveUrl,
        tier,
        plan,
      },
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
