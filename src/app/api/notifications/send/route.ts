import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { sendEmail, isEmailConfigured, wrapEmailTemplate } from '@/lib/email';
import {
  notifyNewInquiry,
  notifyInquiryForwarded,
  notifyListingApproved,
  notifyListingRejected,
  notifyWelcome,
  notifySubscriptionCreated,
  notifySubscriptionCancelled,
} from '@/lib/notifications';

// Validation schema for sending custom email
const sendCustomEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  message: z.string().min(1),
  html: z.boolean().optional(),
});

// Validation schema for trigger notification
const triggerNotificationSchema = z.object({
  type: z.enum([
    'inquiry_new',
    'inquiry_forwarded',
    'listing_approved',
    'listing_rejected',
    'welcome',
    'subscription_created',
    'subscription_cancelled',
  ]),
  targetId: z.string().min(1),
});

// POST /api/notifications/send - Send custom email (Admin only)
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

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Handle trigger notification
    if (action === 'trigger') {
      const validationResult = triggerNotificationSchema.safeParse(body);
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

      const { type, targetId } = validationResult.data;

      // Trigger appropriate notification
      switch (type) {
        case 'inquiry_new':
          await notifyNewInquiry(targetId);
          break;
        case 'inquiry_forwarded':
          await notifyInquiryForwarded(targetId);
          break;
        case 'listing_approved':
          await notifyListingApproved(targetId);
          break;
        case 'listing_rejected':
          await notifyListingRejected(targetId);
          break;
        case 'welcome':
          await notifyWelcome(targetId);
          break;
        case 'subscription_created':
          await notifySubscriptionCreated(targetId);
          break;
        case 'subscription_cancelled':
          await notifySubscriptionCancelled(targetId);
          break;
      }

      return NextResponse.json({
        success: true,
        message: `Notification "${type}" triggered for ${targetId}`,
      });
    }

    // Handle custom email
    const validationResult = sendCustomEmailSchema.safeParse(body);
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

    const { to, subject, message, html } = validationResult.data;

    const emailContent = html
      ? message
      : wrapEmailTemplate(`<p>${message.replace(/\n/g, '</p><p>')}</p>`, subject);

    const result = await sendEmail({
      to,
      subject,
      html: emailContent,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { messageId: result.messageId },
      message: 'Email sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
