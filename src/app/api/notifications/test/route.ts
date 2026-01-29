import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail, isEmailConfigured, wrapEmailTemplate } from '@/lib/email';

// POST /api/notifications/test - Send test email (Admin only)
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address required' },
        { status: 400 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        config: {
          SMTP_HOST: !!process.env.SMTP_HOST,
          SMTP_PORT: process.env.SMTP_PORT || '587',
          SMTP_USER: !!process.env.SMTP_USER,
          SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
          EMAIL_FROM: process.env.EMAIL_FROM || 'not set',
        },
      }, { status: 503 });
    }

    const testContent = `
      <h2>Test Email</h2>
      <p>This is a test email from Buy & Sell Philippines.</p>
      <p>If you received this email, your email configuration is working correctly!</p>
      <div class="info-box">
        <p><strong>Sent to:</strong> ${email}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Sent by:</strong> ${session.user.email}</p>
      </div>
      <p style="text-align: center;">
        <a href="#" class="button">Test Button</a>
      </p>
    `;

    const result = await sendEmail({
      to: email,
      subject: 'Test Email - Buy & Sell Philippines',
      html: wrapEmailTemplate(testContent, 'Test Email'),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { messageId: result.messageId },
      message: `Test email sent to ${email}`,
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/test - Check email configuration
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

    const configured = isEmailConfigured();

    return NextResponse.json({
      success: true,
      data: {
        configured,
        config: {
          SMTP_HOST: process.env.SMTP_HOST ? 'set' : 'not set',
          SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
          SMTP_USER: process.env.SMTP_USER ? 'set' : 'not set',
          SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'set' : 'not set',
          EMAIL_FROM: process.env.EMAIL_FROM || 'not set',
          EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Buy & Sell Philippines (default)',
        },
      },
    });
  } catch (error) {
    console.error('Error checking email config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}
