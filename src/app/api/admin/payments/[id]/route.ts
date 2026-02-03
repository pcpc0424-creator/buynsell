import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/payments/[id] - Get payment details
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Try to find subscription first
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            tier: true,
            points: true,
          },
        },
      },
    });

    if (subscription) {
      return NextResponse.json({
        success: true,
        data: { ...subscription, type: 'subscription' },
      });
    }

    // Try to find points transaction
    const pointsTransaction = await prisma.pointsLedger.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            tier: true,
            points: true,
          },
        },
      },
    });

    if (pointsTransaction) {
      return NextResponse.json({
        success: true,
        data: { ...pointsTransaction, type: 'points' },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Payment not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/payments/[id] - Update subscription status
export async function PATCH(
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, endDate } = body;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      // If cancelling, also update user tier to GREEN
      if (status === 'CANCELLED') {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: { tier: 'GREEN' },
        });
      }
    }

    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
