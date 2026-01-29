import { wrapEmailTemplate } from './email';

const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Email Templates for Buy & Sell Philippines
 */

// ============================================
// USER AUTHENTICATION
// ============================================

export function welcomeEmail(data: { name: string; email: string }) {
  const content = `
    <h2>Welcome to Buy & Sell Philippines, ${data.name}!</h2>
    <p>Thank you for joining our community. You can now:</p>
    <ul>
      <li>Browse thousands of property listings</li>
      <li>Save your favorite properties</li>
      <li>Contact agents directly</li>
      <li>Get notified about new listings</li>
    </ul>
    <p style="text-align: center;">
      <a href="${APP_URL}/properties" class="button">Start Browsing Properties</a>
    </p>
    <p>If you have any questions, feel free to contact our support team.</p>
  `;

  return {
    subject: 'Welcome to Buy & Sell Philippines!',
    html: wrapEmailTemplate(content, 'Welcome'),
  };
}

export function passwordResetEmail(data: { name: string; resetUrl: string }) {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${data.name},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p style="text-align: center;">
      <a href="${data.resetUrl}" class="button">Reset Password</a>
    </p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <div class="info-box">
      <strong>Security Tip:</strong> Never share your password with anyone.
    </div>
  `;

  return {
    subject: 'Reset Your Password - Buy & Sell Philippines',
    html: wrapEmailTemplate(content, 'Password Reset'),
  };
}

// ============================================
// INQUIRY NOTIFICATIONS
// ============================================

export function newInquiryToAdmin(data: {
  inquiryId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  message: string;
  listingTitle: string;
  listingId: string;
  listingPrice: number;
  listingImage?: string;
}) {
  const content = `
    <h2>New Property Inquiry</h2>
    <p>A new inquiry has been submitted and requires your review.</p>

    <div class="property-card">
      ${data.listingImage ? `<img src="${data.listingImage}" alt="${data.listingTitle}" class="property-image">` : ''}
      <div class="property-details">
        <h3 style="margin: 0 0 10px 0;">${data.listingTitle}</h3>
        <p class="property-price">₱${data.listingPrice.toLocaleString()}</p>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">Inquirer Details</h3>
      <p><strong>Name:</strong> ${data.userName}</p>
      <p><strong>Email:</strong> ${data.userEmail}</p>
      ${data.userPhone ? `<p><strong>Phone:</strong> ${data.userPhone}</p>` : ''}
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">Message</h3>
      <p>${data.message}</p>
    </div>

    <p style="text-align: center;">
      <a href="${APP_URL}/admin/inquiries" class="button">Review Inquiry</a>
    </p>
  `;

  return {
    subject: `New Inquiry: ${data.listingTitle}`,
    html: wrapEmailTemplate(content, 'New Inquiry'),
  };
}

export function inquiryForwardedToAgent(data: {
  agentName: string;
  inquiryId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  message: string;
  listingTitle: string;
  listingId: string;
  listingPrice: number;
  listingImage?: string;
  adminNotes?: string;
}) {
  const content = `
    <h2>New Lead for Your Listing</h2>
    <p>Hello ${data.agentName},</p>
    <p>Great news! You have received a new inquiry for your property listing.</p>

    <div class="property-card">
      ${data.listingImage ? `<img src="${data.listingImage}" alt="${data.listingTitle}" class="property-image">` : ''}
      <div class="property-details">
        <h3 style="margin: 0 0 10px 0;">${data.listingTitle}</h3>
        <p class="property-price">₱${data.listingPrice.toLocaleString()}</p>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">Interested Buyer</h3>
      <p><strong>Name:</strong> ${data.userName}</p>
      <p><strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail}</a></p>
      ${data.userPhone ? `<p><strong>Phone:</strong> <a href="tel:${data.userPhone}">${data.userPhone}</a></p>` : ''}
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">Their Message</h3>
      <p>${data.message}</p>
    </div>

    ${data.adminNotes ? `
    <div class="info-box" style="background-color: #fef3c7;">
      <h3 style="margin-top: 0;">Admin Notes</h3>
      <p>${data.adminNotes}</p>
    </div>
    ` : ''}

    <p style="text-align: center;">
      <a href="mailto:${data.userEmail}?subject=Re: ${encodeURIComponent(data.listingTitle)}" class="button">Reply to Inquiry</a>
    </p>

    <p><strong>Tip:</strong> Respond quickly to increase your chances of closing the deal!</p>
  `;

  return {
    subject: `New Lead: ${data.listingTitle}`,
    html: wrapEmailTemplate(content, 'New Lead'),
  };
}

export function inquiryConfirmationToUser(data: {
  userName: string;
  listingTitle: string;
  listingId: string;
  listingPrice: number;
  listingImage?: string;
}) {
  const content = `
    <h2>Inquiry Received</h2>
    <p>Hello ${data.userName},</p>
    <p>Thank you for your inquiry! We have received your message and will get back to you soon.</p>

    <div class="property-card">
      ${data.listingImage ? `<img src="${data.listingImage}" alt="${data.listingTitle}" class="property-image">` : ''}
      <div class="property-details">
        <h3 style="margin: 0 0 10px 0;">${data.listingTitle}</h3>
        <p class="property-price">₱${data.listingPrice.toLocaleString()}</p>
      </div>
    </div>

    <p>What happens next:</p>
    <ol>
      <li>Our team will review your inquiry</li>
      <li>We'll connect you with the property agent</li>
      <li>The agent will contact you directly</li>
    </ol>

    <p style="text-align: center;">
      <a href="${APP_URL}/properties" class="button">Browse More Properties</a>
    </p>
  `;

  return {
    subject: `Inquiry Received: ${data.listingTitle}`,
    html: wrapEmailTemplate(content, 'Inquiry Confirmation'),
  };
}

// ============================================
// LISTING NOTIFICATIONS
// ============================================

export function listingApprovedEmail(data: {
  agentName: string;
  listingTitle: string;
  listingId: string;
  listingPrice: number;
  listingImage?: string;
}) {
  const content = `
    <h2>Your Listing Has Been Approved!</h2>
    <p>Hello ${data.agentName},</p>
    <p>Great news! Your property listing has been approved and is now live on our platform.</p>

    <div class="property-card">
      ${data.listingImage ? `<img src="${data.listingImage}" alt="${data.listingTitle}" class="property-image">` : ''}
      <div class="property-details">
        <h3 style="margin: 0 0 10px 0;">${data.listingTitle}</h3>
        <p class="property-price">₱${data.listingPrice.toLocaleString()}</p>
      </div>
    </div>

    <p style="text-align: center;">
      <a href="${APP_URL}/properties/view/${data.listingId}" class="button">View Your Listing</a>
    </p>

    <div class="info-box">
      <h3 style="margin-top: 0;">Tips to Get More Inquiries</h3>
      <ul>
        <li>Add more high-quality photos</li>
        <li>Write a detailed description</li>
        <li>Set a competitive price</li>
        <li>Consider featuring your listing</li>
      </ul>
    </div>
  `;

  return {
    subject: `Listing Approved: ${data.listingTitle}`,
    html: wrapEmailTemplate(content, 'Listing Approved'),
  };
}

export function listingRejectedEmail(data: {
  agentName: string;
  listingTitle: string;
  listingId: string;
  rejectionReason?: string;
}) {
  const content = `
    <h2>Listing Review Update</h2>
    <p>Hello ${data.agentName},</p>
    <p>We've reviewed your property listing and unfortunately it couldn't be approved at this time.</p>

    <div class="info-box">
      <h3 style="margin-top: 0;">Listing</h3>
      <p><strong>${data.listingTitle}</strong></p>
    </div>

    ${data.rejectionReason ? `
    <div class="info-box" style="background-color: #fef2f2;">
      <h3 style="margin-top: 0;">Reason</h3>
      <p>${data.rejectionReason}</p>
    </div>
    ` : ''}

    <p>You can edit your listing and resubmit it for review:</p>

    <p style="text-align: center;">
      <a href="${APP_URL}/agent/listings/${data.listingId}/edit" class="button">Edit Listing</a>
    </p>

    <p>If you have any questions, please contact our support team.</p>
  `;

  return {
    subject: `Listing Update: ${data.listingTitle}`,
    html: wrapEmailTemplate(content, 'Listing Update'),
  };
}

// ============================================
// SUBSCRIPTION & PAYMENT
// ============================================

export function subscriptionConfirmationEmail(data: {
  userName: string;
  tier: string;
  amount: number;
  startDate: Date;
  endDate: Date;
}) {
  const content = `
    <h2>Subscription Confirmed!</h2>
    <p>Hello ${data.userName},</p>
    <p>Thank you for upgrading to <strong>${data.tier}</strong>! Your subscription is now active.</p>

    <div class="info-box">
      <h3 style="margin-top: 0;">Subscription Details</h3>
      <p><strong>Plan:</strong> ${data.tier}</p>
      <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
      <p><strong>Start Date:</strong> ${data.startDate.toLocaleDateString()}</p>
      <p><strong>Next Billing:</strong> ${data.endDate.toLocaleDateString()}</p>
    </div>

    <p>Enjoy your premium benefits:</p>
    <ul>
      <li>Increased viewing limits</li>
      <li>More listing slots</li>
      <li>Priority support</li>
      <li>Advanced features</li>
    </ul>

    <p style="text-align: center;">
      <a href="${APP_URL}/account/subscription" class="button">Manage Subscription</a>
    </p>
  `;

  return {
    subject: `Welcome to ${data.tier} - Subscription Confirmed`,
    html: wrapEmailTemplate(content, 'Subscription Confirmed'),
  };
}

export function subscriptionCancelledEmail(data: {
  userName: string;
  tier: string;
  endDate: Date;
}) {
  const content = `
    <h2>Subscription Cancelled</h2>
    <p>Hello ${data.userName},</p>
    <p>Your ${data.tier} subscription has been cancelled as requested.</p>

    <div class="info-box">
      <p><strong>Important:</strong> Your premium benefits will remain active until <strong>${data.endDate.toLocaleDateString()}</strong>.</p>
    </div>

    <p>We're sorry to see you go. If you change your mind, you can always resubscribe.</p>

    <p style="text-align: center;">
      <a href="${APP_URL}/pricing" class="button">View Plans</a>
    </p>

    <p>If you have any feedback about your experience, we'd love to hear it.</p>
  `;

  return {
    subject: 'Subscription Cancelled - Buy & Sell Philippines',
    html: wrapEmailTemplate(content, 'Subscription Cancelled'),
  };
}

export function pointsPurchaseEmail(data: {
  userName: string;
  points: number;
  amount: number;
  newBalance: number;
}) {
  const content = `
    <h2>Points Purchase Successful!</h2>
    <p>Hello ${data.userName},</p>
    <p>Your points purchase has been completed.</p>

    <div class="info-box">
      <h3 style="margin-top: 0;">Purchase Details</h3>
      <p><strong>Points Added:</strong> ${data.points.toLocaleString()}</p>
      <p><strong>Amount Paid:</strong> $${data.amount.toFixed(2)}</p>
      <p><strong>New Balance:</strong> ${data.newBalance.toLocaleString()} points</p>
    </div>

    <p style="text-align: center;">
      <a href="${APP_URL}/account/points" class="button">View Points Balance</a>
    </p>
  `;

  return {
    subject: 'Points Purchase Confirmed',
    html: wrapEmailTemplate(content, 'Points Purchase'),
  };
}

// ============================================
// AGENT NOTIFICATIONS
// ============================================

export function agentVerificationEmail(data: {
  agentName: string;
  status: 'approved' | 'pending' | 'rejected';
  reason?: string;
}) {
  const statusMessages = {
    approved: {
      title: 'Agent Verification Approved!',
      message: 'Congratulations! Your agent profile has been verified. You can now list properties on our platform.',
      color: '#10b981',
    },
    pending: {
      title: 'Agent Verification In Progress',
      message: 'Your agent verification request has been received and is being reviewed. We\'ll notify you once the review is complete.',
      color: '#f59e0b',
    },
    rejected: {
      title: 'Agent Verification Update',
      message: 'Unfortunately, we couldn\'t verify your agent profile at this time.',
      color: '#ef4444',
    },
  };

  const status = statusMessages[data.status];

  const content = `
    <h2>${status.title}</h2>
    <p>Hello ${data.agentName},</p>
    <p>${status.message}</p>

    ${data.reason ? `
    <div class="info-box" style="background-color: #fef2f2;">
      <h3 style="margin-top: 0;">Details</h3>
      <p>${data.reason}</p>
    </div>
    ` : ''}

    ${data.status === 'approved' ? `
    <p style="text-align: center;">
      <a href="${APP_URL}/agent/listings/new" class="button">Create Your First Listing</a>
    </p>
    ` : ''}
  `;

  return {
    subject: status.title,
    html: wrapEmailTemplate(content, status.title),
  };
}
