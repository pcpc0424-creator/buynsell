import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/paypal';

/**
 * PayPal Webhook Handler
 *
 * To set up webhooks:
 * 1. Go to PayPal Developer Dashboard
 * 2. Select your app
 * 3. Under "Webhooks", add a webhook URL pointing to this endpoint
 * 4. Subscribe to relevant events:
 *    - PAYMENT.CAPTURE.COMPLETED
 *    - BILLING.SUBSCRIPTION.ACTIVATED
 *    - BILLING.SUBSCRIPTION.CANCELLED
 *    - BILLING.SUBSCRIPTION.EXPIRED
 *    - BILLING.SUBSCRIPTION.PAYMENT.FAILED
 */

// PayPal webhook event types
type PayPalEventType =
  | 'PAYMENT.CAPTURE.COMPLETED'
  | 'PAYMENT.CAPTURE.DENIED'
  | 'PAYMENT.CAPTURE.REFUNDED'
  | 'BILLING.SUBSCRIPTION.ACTIVATED'
  | 'BILLING.SUBSCRIPTION.CANCELLED'
  | 'BILLING.SUBSCRIPTION.EXPIRED'
  | 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'
  | 'BILLING.SUBSCRIPTION.UPDATED';

interface PayPalWebhookEvent {
  id: string;
  event_type: PayPalEventType;
  resource_type: string;
  resource: any;
  create_time: string;
  summary: string;
}

// POST /api/payments/webhook - Handle PayPal webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};

    // Extract relevant headers for verification
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(headers, body);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event: PayPalWebhookEvent = JSON.parse(body);

    console.log(`Received PayPal webhook: ${event.event_type}`, event.id);

    // Handle different event types
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(event);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handler functions for different event types

async function handlePaymentCompleted(event: PayPalWebhookEvent) {
  const { resource } = event;
  const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;

  console.log(`Payment completed for order: ${orderId}`);

  // Find subscription by PayPal order ID and activate it
  const subscription = await prisma.subscription.findFirst({
    where: { paypalOrderId: orderId },
  });

  if (subscription && subscription.status !== 'ACTIVE') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' },
    });

    // Update user tier
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { tier: subscription.tier },
    });

    console.log(`Subscription ${subscription.id} activated`);
  }
}

async function handlePaymentDenied(event: PayPalWebhookEvent) {
  const { resource } = event;
  const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;

  console.log(`Payment denied for order: ${orderId}`);

  // Mark subscription as failed if exists
  await prisma.subscription.updateMany({
    where: { paypalOrderId: orderId },
    data: { status: 'CANCELLED' },
  });
}

async function handlePaymentRefunded(event: PayPalWebhookEvent) {
  const { resource } = event;
  const orderId = resource.supplementary_data?.related_ids?.order_id;

  console.log(`Payment refunded for order: ${orderId}`);

  // Handle refund logic - could involve:
  // - Reverting points if it was a points purchase
  // - Downgrading subscription
  // - Logging for admin review
}

async function handleSubscriptionActivated(event: PayPalWebhookEvent) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const _planId = resource.plan_id;

  console.log(`Subscription activated: ${subscriptionId}`);

  // Find and activate subscription
  const subscription = await prisma.subscription.findFirst({
    where: { paypalOrderId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { tier: subscription.tier },
    });
  }
}

async function handleSubscriptionCancelled(event: PayPalWebhookEvent) {
  const { resource } = event;
  const subscriptionId = resource.id;

  console.log(`Subscription cancelled: ${subscriptionId}`);

  // Update subscription status
  const subscription = await prisma.subscription.findFirst({
    where: { paypalOrderId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELLED' },
    });

    // Check if user has other active subscriptions
    const otherActive = await prisma.subscription.findFirst({
      where: {
        userId: subscription.userId,
        status: 'ACTIVE',
        id: { not: subscription.id },
      },
    });

    // Downgrade if no other active subscriptions
    if (!otherActive) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { tier: 'GREEN' },
      });
    }
  }
}

async function handleSubscriptionExpired(event: PayPalWebhookEvent) {
  const { resource } = event;
  const subscriptionId = resource.id;

  console.log(`Subscription expired: ${subscriptionId}`);

  // Same logic as cancelled
  await handleSubscriptionCancelled(event);
}

async function handleSubscriptionPaymentFailed(event: PayPalWebhookEvent) {
  const { resource } = event;
  const subscriptionId = resource.id;

  console.log(`Subscription payment failed: ${subscriptionId}`);

  // Could implement grace period logic here
  // For now, just log it
  // TODO: Send notification to user about failed payment
}
