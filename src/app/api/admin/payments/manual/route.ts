import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/admin/payments/manual - Manually grant subscription or points
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, userId, tier, points, months, note } = body;

    // Validate user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, tier: true, points: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (type === 'subscription') {
      // Grant subscription
      if (!tier || !months) {
        return NextResponse.json(
          { success: false, error: 'Tier and months are required for subscription' },
          { status: 400 }
        );
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + parseInt(months));

      // Create subscription record
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          tier,
          status: 'ACTIVE',
          startDate,
          endDate,
          amount: 0, // Manual grant, no payment
          paypalOrderId: `MANUAL_${Date.now()}_${session.user.id}`,
        },
      });

      // Update user tier
      await prisma.user.update({
        where: { id: userId },
        data: { tier },
      });

      return NextResponse.json({
        success: true,
        data: {
          subscription,
          message: `Successfully granted ${tier} tier to ${targetUser.name || targetUser.email} for ${months} month(s)`,
        },
      });
    } else if (type === 'points') {
      // Grant points
      if (!points || points <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid points amount is required' },
          { status: 400 }
        );
      }

      const newBalance = targetUser.points + parseInt(points);

      // Update user points and create ledger entry
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { points: newBalance },
        }),
        prisma.pointsLedger.create({
          data: {
            userId,
            amount: parseInt(points),
            type: 'CREDIT',
            description: note || `Manual points grant by admin`,
            referenceId: `MANUAL_${Date.now()}_${session.user.id}`,
            referenceType: 'manual_grant',
            balanceAfter: newBalance,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          points: parseInt(points),
          newBalance,
          message: `Successfully granted ${points} points to ${targetUser.name || targetUser.email}`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "subscription" or "points"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error granting manual payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to grant' },
      { status: 500 }
    );
  }
}
