import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// Validation schema for user update
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['USER', 'AGENT', 'ADMIN']).optional(),
  tier: z.enum(['GREEN', 'SILVER', 'GOLD', 'PREMIUM']).optional(),
  points: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/users/[id] - Get user detail
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        agentProfile: true,
        listings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            createdAt: true,
          },
        },
        inquiries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            listing: {
              select: { id: true, title: true },
            },
          },
        },
        subscriptions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        pointsLedger: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            listings: true,
            inquiries: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _password, ...safeUser } = user as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Find user
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { agentProfile: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent self-demotion
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify your own account' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateUserSchema.safeParse(body);
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

    const data = validationResult.data;
    const oldPoints = existingUser.points;
    const oldTier = existingUser.tier;
    const oldRole = existingUser.role;

    // Start transaction for complex updates
    const result = await prisma.$transaction(async (tx) => {
      // If changing role to AGENT and no agent profile exists, create one
      if (data.role === 'AGENT' && !existingUser.agentProfile) {
        await tx.agentProfile.create({
          data: {
            userId: id,
          },
        });
      }

      // If changing role from AGENT, optionally delete agent profile
      // (keeping it for now to preserve data)

      // Record points change in ledger if points changed
      if (data.points !== undefined && data.points !== oldPoints) {
        const difference = data.points - oldPoints;
        await tx.pointsLedger.create({
          data: {
            userId: id,
            amount: Math.abs(difference),
            type: difference > 0 ? 'CREDIT' : 'DEBIT',
            description: `Admin adjustment by ${session.user.email}`,
            balanceAfter: data.points,
          },
        });
      }

      // Update user
      const updatedUser = await tx.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tier: true,
          points: true,
          isActive: true,
          updatedAt: true,
          agentProfile: {
            select: {
              isVerified: true,
            },
          },
        },
      });

      return updatedUser;
    });

    // Build change log message
    const changes: string[] = [];
    if (data.role && data.role !== oldRole) changes.push(`role: ${oldRole} → ${data.role}`);
    if (data.tier && data.tier !== oldTier) changes.push(`tier: ${oldTier} → ${data.tier}`);
    if (data.points !== undefined && data.points !== oldPoints) {
      changes.push(`points: ${oldPoints} → ${data.points}`);
    }
    if (data.isActive !== undefined && data.isActive !== existingUser.isActive) {
      changes.push(`status: ${existingUser.isActive ? 'active' : 'inactive'} → ${data.isActive ? 'active' : 'inactive'}`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `User updated: ${changes.join(', ') || 'no changes'}`,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check query param for hard delete
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete - removes user and all related data
      await prisma.user.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'User permanently deleted',
      });
    } else {
      // Soft delete - just deactivate
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'User deactivated',
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
