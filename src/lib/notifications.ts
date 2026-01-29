import { prisma } from './prisma';
import { sendEmail, isEmailConfigured } from './email';
import * as templates from './email-templates';

/**
 * Notification Service
 * Handles sending notifications via email and in-app
 */

// ============================================
// INQUIRY NOTIFICATIONS
// ============================================

/**
 * Send notification when a new inquiry is submitted
 */
export async function notifyNewInquiry(inquiryId: string) {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        user: true,
        listing: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!inquiry) {
      console.error('[Notification] Inquiry not found:', inquiryId);
      return;
    }

    // Get admin email from settings or use default
    const adminEmailSetting = await prisma.systemSetting.findUnique({
      where: { key: 'contact_email' },
    });
    const adminEmail = adminEmailSetting?.value || process.env.ADMIN_EMAIL;

    // Send to admin
    if (adminEmail && isEmailConfigured()) {
      const adminTemplate = templates.newInquiryToAdmin({
        inquiryId: inquiry.id,
        userName: inquiry.name,
        userEmail: inquiry.email,
        userPhone: inquiry.phone || undefined,
        message: inquiry.message,
        listingTitle: inquiry.listing.title,
        listingId: inquiry.listing.id,
        listingPrice: inquiry.listing.price,
        listingImage: inquiry.listing.mainImage,
      });

      await sendEmail({
        to: adminEmail,
        subject: adminTemplate.subject,
        html: adminTemplate.html,
      });
    }

    // Send confirmation to user
    if (inquiry.email && isEmailConfigured()) {
      const userTemplate = templates.inquiryConfirmationToUser({
        userName: inquiry.name,
        listingTitle: inquiry.listing.title,
        listingId: inquiry.listing.id,
        listingPrice: inquiry.listing.price,
        listingImage: inquiry.listing.mainImage,
      });

      await sendEmail({
        to: inquiry.email,
        subject: userTemplate.subject,
        html: userTemplate.html,
      });
    }

    console.log('[Notification] New inquiry notifications sent for:', inquiryId);
  } catch (error) {
    console.error('[Notification] Error sending inquiry notifications:', error);
  }
}

/**
 * Send notification when inquiry is forwarded to agent
 */
export async function notifyInquiryForwarded(inquiryId: string) {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        user: true,
        listing: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!inquiry) {
      console.error('[Notification] Inquiry not found:', inquiryId);
      return;
    }

    // Get inquiry settings
    const settings = await prisma.inquirySetting.findFirst();

    // Send to agent if email notifications are enabled
    if (settings?.notifyAgentByEmail && inquiry.listing.agent.email && isEmailConfigured()) {
      const agentTemplate = templates.inquiryForwardedToAgent({
        agentName: inquiry.listing.agent.name || 'Agent',
        inquiryId: inquiry.id,
        userName: inquiry.name,
        userEmail: inquiry.email,
        userPhone: inquiry.phone || undefined,
        message: inquiry.message,
        listingTitle: inquiry.listing.title,
        listingId: inquiry.listing.id,
        listingPrice: inquiry.listing.price,
        listingImage: inquiry.listing.mainImage,
        adminNotes: inquiry.adminNotes || undefined,
      });

      await sendEmail({
        to: inquiry.listing.agent.email,
        subject: agentTemplate.subject,
        html: agentTemplate.html,
        replyTo: inquiry.email,
      });
    }

    // TODO: In-app notification if notifyAgentByApp is enabled

    console.log('[Notification] Inquiry forwarded notifications sent for:', inquiryId);
  } catch (error) {
    console.error('[Notification] Error sending forwarded notifications:', error);
  }
}

// ============================================
// LISTING NOTIFICATIONS
// ============================================

/**
 * Send notification when listing is approved
 */
export async function notifyListingApproved(listingId: string) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        agent: true,
      },
    });

    if (!listing) {
      console.error('[Notification] Listing not found:', listingId);
      return;
    }

    if (listing.agent.email && isEmailConfigured()) {
      const template = templates.listingApprovedEmail({
        agentName: listing.agent.name || 'Agent',
        listingTitle: listing.title,
        listingId: listing.id,
        listingPrice: listing.price,
        listingImage: listing.mainImage,
      });

      await sendEmail({
        to: listing.agent.email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log('[Notification] Listing approved notification sent for:', listingId);
  } catch (error) {
    console.error('[Notification] Error sending listing approved notification:', error);
  }
}

/**
 * Send notification when listing is rejected
 */
export async function notifyListingRejected(listingId: string) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        agent: true,
      },
    });

    if (!listing) {
      console.error('[Notification] Listing not found:', listingId);
      return;
    }

    if (listing.agent.email && isEmailConfigured()) {
      const template = templates.listingRejectedEmail({
        agentName: listing.agent.name || 'Agent',
        listingTitle: listing.title,
        listingId: listing.id,
        rejectionReason: listing.rejectionReason || undefined,
      });

      await sendEmail({
        to: listing.agent.email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log('[Notification] Listing rejected notification sent for:', listingId);
  } catch (error) {
    console.error('[Notification] Error sending listing rejected notification:', error);
  }
}

// ============================================
// USER NOTIFICATIONS
// ============================================

/**
 * Send welcome email to new user
 */
export async function notifyWelcome(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      console.error('[Notification] User not found:', userId);
      return;
    }

    if (isEmailConfigured()) {
      const template = templates.welcomeEmail({
        name: user.name || 'User',
        email: user.email,
      });

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log('[Notification] Welcome email sent to:', user.email);
  } catch (error) {
    console.error('[Notification] Error sending welcome email:', error);
  }
}

// ============================================
// SUBSCRIPTION NOTIFICATIONS
// ============================================

/**
 * Send subscription confirmation email
 */
export async function notifySubscriptionCreated(subscriptionId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: true,
      },
    });

    if (!subscription || !subscription.user.email) {
      console.error('[Notification] Subscription not found:', subscriptionId);
      return;
    }

    if (isEmailConfigured()) {
      const template = templates.subscriptionConfirmationEmail({
        userName: subscription.user.name || 'User',
        tier: subscription.tier,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      });

      await sendEmail({
        to: subscription.user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log('[Notification] Subscription confirmation sent for:', subscriptionId);
  } catch (error) {
    console.error('[Notification] Error sending subscription notification:', error);
  }
}

/**
 * Send subscription cancellation email
 */
export async function notifySubscriptionCancelled(subscriptionId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: true,
      },
    });

    if (!subscription || !subscription.user.email) {
      console.error('[Notification] Subscription not found:', subscriptionId);
      return;
    }

    if (isEmailConfigured()) {
      const template = templates.subscriptionCancelledEmail({
        userName: subscription.user.name || 'User',
        tier: subscription.tier,
        endDate: subscription.endDate,
      });

      await sendEmail({
        to: subscription.user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log('[Notification] Subscription cancellation sent for:', subscriptionId);
  } catch (error) {
    console.error('[Notification] Error sending cancellation notification:', error);
  }
}

/**
 * Send points purchase confirmation
 */
export async function notifyPointsPurchase(
  userId: string,
  points: number,
  amount: number,
  newBalance: number
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      console.error('[Notification] User not found:', userId);
      return;
    }

    if (isEmailConfigured()) {
      const template = templates.pointsPurchaseEmail({
        userName: user.name || 'User',
        points,
        amount,
        newBalance,
      });

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log('[Notification] Points purchase notification sent to:', user.email);
  } catch (error) {
    console.error('[Notification] Error sending points notification:', error);
  }
}
