import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Validation schema for settings update
const settingsUpdateSchema = z.object({
  mode: z.enum(['MODE_A', 'MODE_B']).optional(),
  notifyAgentByEmail: z.boolean().optional(),
  notifyAgentByApp: z.boolean().optional(),
  autoForwardDelay: z.number().int().min(0).nullable().optional(),
});

// GET /api/inquiries/settings - Get inquiry settings (Admin only)
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

    // Get or create default settings
    let settings = await prisma.inquirySetting.findFirst();

    if (!settings) {
      settings = await prisma.inquirySetting.create({
        data: {
          mode: 'MODE_A',
          notifyAgentByEmail: false,
          notifyAgentByApp: false,
          autoForwardDelay: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching inquiry settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/inquiries/settings - Update inquiry settings (Admin only)
export async function PUT(request: NextRequest) {
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

    const body = await request.json();

    // Validate input
    const validationResult = settingsUpdateSchema.safeParse(body);
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

    // Get existing settings or create new
    let settings = await prisma.inquirySetting.findFirst();

    if (settings) {
      settings = await prisma.inquirySetting.update({
        where: { id: settings.id },
        data,
      });
    } else {
      settings = await prisma.inquirySetting.create({
        data: {
          mode: data.mode ?? 'MODE_A',
          notifyAgentByEmail: data.notifyAgentByEmail ?? false,
          notifyAgentByApp: data.notifyAgentByApp ?? false,
          autoForwardDelay: data.autoForwardDelay ?? null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Inquiry settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating inquiry settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
