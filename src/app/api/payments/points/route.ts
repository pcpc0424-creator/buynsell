import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { POINTS_PACKAGES } from '@/lib/paypal';

// GET /api/payments/points - Get available points packages and user balance
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true, tier: true },
    });

    // Get recent points transactions
    const recentTransactions = await prisma.pointsLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get tier policy for points info
    const tierPolicy = await prisma.tierPolicy.findUnique({
      where: { tier: user?.tier || 'GREEN' },
    });

    return NextResponse.json({
      success: true,
      data: {
        currentBalance: user?.points || 0,
        packages: POINTS_PACKAGES,
        recentTransactions,
        tierPolicy: tierPolicy
          ? {
              pointsPerView: tierPolicy.pointsPerView,
              pointsPerListing: tierPolicy.pointsPerListing,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching points info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch points info' },
      { status: 500 }
    );
  }
}

// POST /api/payments/points/use - Use points for an action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, amount, referenceId, referenceType } = body;

    if (!action || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid action or amount' },
        { status: 400 }
      );
    }

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true },
    });

    if (!user || user.points < amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient points',
          currentBalance: user?.points || 0,
          required: amount,
        },
        { status: 400 }
      );
    }

    // Deduct points
    const newBalance = user.points - amount;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { points: newBalance },
      }),
      prisma.pointsLedger.create({
        data: {
          userId: session.user.id,
          amount,
          type: 'DEBIT',
          description: action,
          referenceId,
          referenceType,
          balanceAfter: newBalance,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        previousBalance: user.points,
        deducted: amount,
        newBalance,
        action,
      },
    });
  } catch (error) {
    console.error('Error using points:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to use points' },
      { status: 500 }
    );
  }
}
