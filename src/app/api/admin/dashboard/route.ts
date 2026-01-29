import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/admin/dashboard - Get dashboard statistics
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

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const _lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Execute all queries in parallel
    const [
      // User stats
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      usersByRole,
      usersByTier,

      // Listing stats
      totalListings,
      listingsByStatus,
      newListingsToday,
      newListingsThisMonth,

      // Inquiry stats
      totalInquiries,
      inquiriesByStatus,
      newInquiriesToday,

      // Recent data
      recentListings,
      recentInquiries,
      recentUsers,

      // Revenue (from subscriptions)
      totalRevenue,
      revenueThisMonth,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.user.groupBy({ by: ['tier'], _count: true }),

      // Listing counts
      prisma.listing.count(),
      prisma.listing.groupBy({ by: ['status'], _count: true }),
      prisma.listing.count({ where: { createdAt: { gte: today } } }),
      prisma.listing.count({ where: { createdAt: { gte: thisMonth } } }),

      // Inquiry counts
      prisma.inquiry.count(),
      prisma.inquiry.groupBy({ by: ['status'], _count: true }),
      prisma.inquiry.count({ where: { createdAt: { gte: today } } }),

      // Recent listings (pending approval)
      prisma.listing.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: { id: true, name: true, image: true },
          },
        },
      }),

      // Recent inquiries
      prisma.inquiry.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          listing: { select: { id: true, title: true } },
        },
      }),

      // Recent users
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tier: true,
          createdAt: true,
        },
      }),

      // Revenue
      prisma.subscription.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
      }),
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    // Transform grouped data
    const transformGrouped = (data: any[], key: string) => {
      return data.reduce((acc, item) => {
        acc[item[key]] = item._count;
        return acc;
      }, {} as Record<string, number>);
    };

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisMonth: newUsersThisMonth,
          byRole: transformGrouped(usersByRole, 'role'),
          byTier: transformGrouped(usersByTier, 'tier'),
        },
        listings: {
          total: totalListings,
          byStatus: transformGrouped(listingsByStatus, 'status'),
          newToday: newListingsToday,
          newThisMonth: newListingsThisMonth,
          pendingApproval: listingsByStatus.find((s) => s.status === 'PENDING')?._count || 0,
        },
        inquiries: {
          total: totalInquiries,
          byStatus: transformGrouped(inquiriesByStatus, 'status'),
          newToday: newInquiriesToday,
          pendingReview: inquiriesByStatus.find((s) => s.status === 'PENDING')?._count || 0,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          thisMonth: revenueThisMonth._sum.amount || 0,
        },
        recent: {
          listings: recentListings,
          inquiries: recentInquiries,
          users: recentUsers,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
