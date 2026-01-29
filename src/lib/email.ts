import nodemailer from 'nodemailer';

/**
 * Email Configuration
 *
 * Set these environment variables:
 * - SMTP_HOST: SMTP server host
 * - SMTP_PORT: SMTP server port (usually 587 for TLS, 465 for SSL)
 * - SMTP_USER: SMTP username
 * - SMTP_PASSWORD: SMTP password
 * - EMAIL_FROM: Default from address
 * - EMAIL_FROM_NAME: Default from name
 */

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
}

// Create transporter
function createTransporter() {
  if (!isEmailConfigured()) {
    throw new Error('Email service not configured');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// Get default from address
function getFromAddress(): string {
  const name = process.env.EMAIL_FROM_NAME || 'Buy & Sell Philippines';
  const email = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@example.com';
  return `"${name}" <${email}>`;
}

// Email options interface
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

// Send email function
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isEmailConfigured()) {
      console.log('[Email] Service not configured, skipping email send');
      console.log('[Email] Would send to:', options.to);
      console.log('[Email] Subject:', options.subject);
      return { success: false, error: 'Email service not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || getFromAddress(),
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('[Email] Sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Email] Error sending:', error);
    return { success: false, error: error.message };
  }
}

// Strip HTML tags for plain text version
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Base email template wrapper
export function wrapEmailTemplate(content: string, title: string): string {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background-color: white;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #2563eb;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
    .property-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin: 20px 0;
    }
    .property-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .property-details {
      padding: 15px;
    }
    .property-price {
      color: #2563eb;
      font-size: 20px;
      font-weight: bold;
    }
    .info-box {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .divider {
      border-top: 1px solid #e5e7eb;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Buy & Sell Philippines</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${year} Buy & Sell Philippines. All rights reserved.</p>
      <p>Find your dream property in the Philippines</p>
    </div>
  </div>
</body>
</html>
`;
}
