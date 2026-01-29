import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  // Agent profile fields
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  licenseNumber: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
});

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        tier: true,
        points: true,
        createdAt: true,
        agentProfile: {
          select: {
            id: true,
            bio: true,
            licenseNumber: true,
            specialization: true,
            yearsExperience: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            listings: true,
            inquiries: true,
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

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, phone, bio, licenseNumber, specialization, yearsExperience } = validation.data;

    // Update user basic info
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
    });

    // Update agent profile if user is an agent
    const userRole = (session.user as { role?: string })?.role;
    if (userRole === 'AGENT' || userRole === 'ADMIN') {
      const agentProfileData = {
        ...(bio !== undefined && { bio }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(specialization !== undefined && { specialization }),
        ...(yearsExperience !== undefined && { yearsExperience }),
      };

      if (Object.keys(agentProfileData).length > 0) {
        await prisma.agentProfile.upsert({
          where: { userId: session.user.id },
          update: agentProfileData,
          create: {
            userId: session.user.id,
            ...agentProfileData,
          },
        });
      }
    }

    // Fetch updated user with agent profile
    const fullUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        tier: true,
        points: true,
        createdAt: true,
        agentProfile: {
          select: {
            id: true,
            bio: true,
            licenseNumber: true,
            specialization: true,
            yearsExperience: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: fullUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
