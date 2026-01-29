import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { capturePayPalOrder, isPayPalConfigured } from '@/lib/paypal';

interface RouteParams {
  params: { orderId: string };
}

// POST /api/payments/orders/[orderId]/capture - Capture (complete) a payment
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

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 503 }
      );
    }

    const { orderId } = params;
    const body = await request.json().catch(() => ({}));

    // Get order metadata from request (passed from frontend after PayPal approval)
    const { type, tier, points, listingId, days } = body;

    // Capture the PayPal order
    const capturedOrder = await capturePayPalOrder(orderId);

    if (capturedOrder.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment was not completed' },
        { status: 400 }
      );
    }

    // Process based on payment type
    const result: Record<string, unknown> = { orderId, status: 'completed' };

    switch (type) {
      case 'subscription':
        // Create subscription and upgrade user tier
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const subscription = await prisma.subscription.create({
          data: {
            userId: session.user.id,
            tier: tier,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate,
            paypalOrderId: orderId,
            amount: capturedOrder.amount,
          },
        });

        // Update user tier
        await prisma.user.update({
          where: { id: session.user.id },
          data: { tier: tier },
        });

        result.subscription = subscription;
        result.message = `Successfully upgraded to ${tier} tier`;
        break;

      case 'points':
        // Add points to user
        const currentUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { points: true },
        });

        const newBalance = (currentUser?.points || 0) + points;

        await prisma.$transaction([
          prisma.user.update({
            where: { id: session.user.id },
            data: { points: newBalance },
          }),
          prisma.pointsLedger.create({
            data: {
              userId: session.user.id,
              amount: points,
              type: 'CREDIT',
              description: `Points purchase - Order ${orderId}`,
              referenceId: orderId,
              referenceType: 'paypal_order',
              balanceAfter: newBalance,
            },
          }),
        ]);

        result.points = points;
        result.newBalance = newBalance;
        result.message = `Successfully added ${points} points`;
        break;

      case 'featured_listing':
        // Create featured listing
        const startDate = new Date();
        const featuredEndDate = new Date();
        featuredEndDate.setDate(featuredEndDate.getDate() + days);

        const featured = await prisma.featuredListing.upsert({
          where: { listingId },
          update: {
            isActive: true,
            startDate,
            endDate: featuredEndDate,
          },
          create: {
            listingId,
            isActive: true,
            startDate,
            endDate: featuredEndDate,
            position: 0,
          },
        });

        // Update listing flag
        await prisma.listing.update({
          where: { id: listingId },
          data: { isFeatured: true },
        });

        result.featured = featured;
        result.message = `Listing featured for ${days} days`;
        break;

      default:
        // Generic success
        result.message = 'Payment completed successfully';
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
