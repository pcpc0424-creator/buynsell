import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/admin/payments - Get all payments (subscriptions + points)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, subscription, points
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let subscriptions: any[] = [];
    let pointsTransactions: any[] = [];
    let totalSubscriptions = 0;
    let totalPoints = 0;

    // Fetch subscriptions
    if (type === 'all' || type === 'subscription') {
      const subscriptionWhere: any = {};

      if (status) {
        subscriptionWhere.status = status;
      }

      if (search) {
        subscriptionWhere.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { paypalOrderId: { contains: search, mode: 'insensitive' } },
        ];
      }

      [subscriptions, totalSubscriptions] = await Promise.all([
        prisma.subscription.findMany({
          where: subscriptionWhere,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: type === 'subscription' ? skip : 0,
          take: type === 'subscription' ? limit : 10,
        }),
        prisma.subscription.count({ where: subscriptionWhere }),
      ]);
    }

    // Fetch points transactions (only CREDIT type for purchases)
    if (type === 'all' || type === 'points') {
      const pointsWhere: any = {
        type: 'CREDIT',
        referenceType: 'paypal_order',
      };

      if (search) {
        pointsWhere.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { referenceId: { contains: search, mode: 'insensitive' } },
        ];
      }

      [pointsTransactions, totalPoints] = await Promise.all([
        prisma.pointsLedger.findMany({
          where: pointsWhere,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: type === 'points' ? skip : 0,
          take: type === 'points' ? limit : 10,
        }),
        prisma.pointsLedger.count({ where: pointsWhere }),
      ]);
    }

    // Calculate stats
    const stats = await Promise.all([
      // Total revenue from subscriptions
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { status: 'ACTIVE' },
      }),
      // Active subscriptions count
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      // Total points sold
      prisma.pointsLedger.aggregate({
        _sum: { amount: true },
        where: { type: 'CREDIT', referenceType: 'paypal_order' },
      }),
      // This month's revenue
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: subscriptions.map(sub => ({
          ...sub,
          type: 'subscription',
        })),
        pointsTransactions: pointsTransactions.map(pt => ({
          ...pt,
          type: 'points',
        })),
        stats: {
          totalRevenue: stats[0]._sum.amount || 0,
          activeSubscriptions: stats[1],
          totalPointsSold: stats[2]._sum.amount || 0,
          monthlyRevenue: stats[3]._sum.amount || 0,
        },
        pagination: {
          page,
          limit,
          totalSubscriptions,
          totalPoints,
          total: totalSubscriptions + totalPoints,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
