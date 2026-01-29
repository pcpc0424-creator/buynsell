import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { cancelPayPalSubscription, isPayPalConfigured } from '@/lib/paypal';

interface RouteParams {
  params: { id: string };
}

const cancelSchema = z.object({
  reason: z.string().optional(),
});

// POST /api/payments/subscriptions/[id]/cancel - Cancel a subscription
export async function POST(
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

    const { id } = params;

    // Find subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (subscription.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (subscription.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = cancelSchema.parse(body);

    // Cancel in PayPal if there's a PayPal subscription ID
    if (subscription.paypalOrderId && isPayPalConfigured()) {
      try {
        await cancelPayPalSubscription(subscription.paypalOrderId, reason);
      } catch (error) {
        console.error('Error cancelling PayPal subscription:', error);
        // Continue with local cancellation even if PayPal fails
      }
    }

    // Update subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Downgrade user tier to GREEN if this was their active subscription
    // Note: In production, you might want to keep the tier until endDate
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: subscription.userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
        id: { not: id },
      },
    });

    if (!activeSubscription) {
      // No other active subscriptions, downgrade to GREEN at period end
      // For immediate downgrade, uncomment below:
      // await prisma.user.update({
      //   where: { id: subscription.userId },
      //   data: { tier: 'GREEN' },
      // });
    }

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
      message: 'Subscription cancelled. Your benefits will remain active until the end of the billing period.',
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
