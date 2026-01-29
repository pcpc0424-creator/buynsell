import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/advertisements - Get active advertisements (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    const now = new Date();

    const where: any = {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    if (position) {
      where.position = position;
    }

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        position: true,
      },
    });

    // Increment view count for returned ads
    if (ads.length > 0) {
      await prisma.advertisement.updateMany({
        where: {
          id: { in: ads.map((ad) => ad.id) },
        },
        data: {
          viewCount: { increment: 1 },
        },
      });
    }

    // Group by position for convenience
    const byPosition = ads.reduce((acc, ad) => {
      if (!acc[ad.position]) {
        acc[ad.position] = [];
      }
      acc[ad.position].push(ad);
      return acc;
    }, {} as Record<string, typeof ads>);

    return NextResponse.json({
      success: true,
      data: position ? ads : byPosition,
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  }
}

// POST /api/advertisements/[id]/click - Record ad click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId } = body;

    if (!adId) {
      return NextResponse.json(
        { success: false, error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        clickCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error recording ad click:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record click' },
      { status: 500 }
    );
  }
}
