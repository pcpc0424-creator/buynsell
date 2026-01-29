import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Validation schema for setting
const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

const bulkSettingsSchema = z.object({
  settings: z.array(settingSchema),
});

// Default settings configuration
const DEFAULT_SETTINGS = [
  // General settings
  { key: 'site_name', value: 'Buy & Sell Philippines', type: 'string', category: 'general', description: 'Site name' },
  { key: 'site_description', value: 'Find your dream property in the Philippines', type: 'string', category: 'general', description: 'Site description' },
  { key: 'contact_email', value: 'contact@buynsell.ph', type: 'string', category: 'general', description: 'Contact email' },
  { key: 'contact_phone', value: '+63 XXX XXX XXXX', type: 'string', category: 'general', description: 'Contact phone' },

  // Listing settings
  { key: 'listing_auto_approve', value: 'false', type: 'boolean', category: 'listing', description: 'Auto-approve new listings' },
  { key: 'listing_max_images', value: '10', type: 'number', category: 'listing', description: 'Maximum images per listing' },
  { key: 'listing_featured_duration_days', value: '30', type: 'number', category: 'listing', description: 'Default featured listing duration in days' },

  // Payment settings
  { key: 'currency', value: 'PHP', type: 'string', category: 'payment', description: 'Default currency' },
  { key: 'paypal_mode', value: 'sandbox', type: 'string', category: 'payment', description: 'PayPal mode (sandbox/live)' },
  { key: 'points_per_peso', value: '1', type: 'number', category: 'payment', description: 'Points earned per peso spent' },

  // Email settings
  { key: 'email_notifications_enabled', value: 'true', type: 'boolean', category: 'email', description: 'Enable email notifications' },
  { key: 'email_from_name', value: 'Buy & Sell Philippines', type: 'string', category: 'email', description: 'From name for emails' },
  { key: 'email_from_address', value: 'noreply@buynsell.ph', type: 'string', category: 'email', description: 'From email address' },
];

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Get all settings
    const where = category ? { category } : {};
    let settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Initialize default settings if empty
    if (settings.length === 0) {
      await prisma.systemSetting.createMany({
        data: DEFAULT_SETTINGS,
        skipDuplicates: true,
      });

      settings = await prisma.systemSetting.findMany({
        where,
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });
    }

    // Group by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const cat = setting.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push({
        ...setting,
        parsedValue: parseSettingValue(setting.value, setting.type),
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      data: settings,
      grouped: groupedSettings,
      categories: Object.keys(groupedSettings),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings (bulk)
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
    const validationResult = bulkSettingsSchema.safeParse(body);
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

    const { settings } = validationResult.data;
    const results = [];

    // Update each setting
    for (const setting of settings) {
      const result = await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          type: setting.type,
          category: setting.category,
          description: setting.description,
        },
        create: {
          key: setting.key,
          value: setting.value,
          type: setting.type || 'string',
          category: setting.category || 'general',
          description: setting.description,
        },
      });
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Updated ${results.length} settings`,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings - Create or update a single setting
export async function POST(request: NextRequest) {
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
    const validationResult = settingSchema.safeParse(body);
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

    const { key, value, type, category, description } = validationResult.data;

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        type: type || 'string',
        category: category || 'general',
        description,
      },
      create: {
        key,
        value,
        type: type || 'string',
        category: category || 'general',
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Setting saved successfully',
    });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings - Delete a setting by key
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      );
    }

    await prisma.systemSetting.delete({
      where: { key },
    });

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}

function parseSettingValue(value: string, type: string): any {
  switch (type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true';
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}
