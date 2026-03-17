/**
 * PayPal Configuration and Utilities
 *
 * To enable PayPal integration:
 * 1. Create a PayPal Developer account at https://developer.paypal.com
 * 2. Create an app in the Dashboard
 * 3. Get Client ID and Secret
 * 4. Set environment variables:
 *    - PAYPAL_CLIENT_ID
 *    - PAYPAL_CLIENT_SECRET
 *    - PAYPAL_MODE (sandbox or live)
 */

// PayPal API URLs
const PAYPAL_API = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
};

// Get current mode
export function getPayPalMode(): 'sandbox' | 'live' {
  return (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox';
}

// Get API base URL
export function getPayPalApiUrl(): string {
  return PAYPAL_API[getPayPalMode()];
}

// Check if PayPal is configured
export function isPayPalConfigured(): boolean {
  return !!(
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET
  );
}

// Get PayPal client ID (safe for frontend)
export function getPayPalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID || '';
}

/**
 * Get PayPal access token
 * This would be used to authenticate API requests
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured');
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${getPayPalApiUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Payment types supported
 */
export type PaymentType = 'subscription' | 'points' | 'featured_listing';

/**
 * Payment status
 */
export type PaymentStatus =
  | 'CREATED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

/**
 * Order creation payload
 */
export interface CreateOrderPayload {
  type: PaymentType;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: {
    userId?: string;
    tier?: string;
    points?: number;
    listingId?: string;
    [key: string]: any;
  };
}

/**
 * Order response
 */
export interface PayPalOrder {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  type: PaymentType;
  approveUrl?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Subscription plans configuration
 * These would typically be created in PayPal Dashboard
 */
export const SUBSCRIPTION_PLANS = {
  SILVER: {
    name: 'Silver Membership',
    description: 'Basic paid tier with expanded limits',
    price: 9.99,
    currency: 'USD',
    interval: 'MONTH',
    // PayPal Plan ID would go here after creating in dashboard
    paypalPlanId: process.env.PAYPAL_SILVER_PLAN_ID || '',
  },
  GOLD: {
    name: 'Gold Membership',
    description: 'Premium tier for serious users',
    price: 29.99,
    currency: 'USD',
    interval: 'MONTH',
    paypalPlanId: process.env.PAYPAL_GOLD_PLAN_ID || '',
  },
  PREMIUM: {
    name: 'Premium Membership',
    description: 'Unlimited access for professionals',
    price: 99.99,
    currency: 'USD',
    interval: 'MONTH',
    paypalPlanId: process.env.PAYPAL_PREMIUM_PLAN_ID || '',
  },
};

/**
 * Points packages configuration
 */
export const POINTS_PACKAGES = [
  {
    id: 'points_100',
    points: 100,
    price: 4.99,
    currency: 'USD',
    bonus: 0,
  },
  {
    id: 'points_500',
    points: 500,
    price: 19.99,
    currency: 'USD',
    bonus: 50, // 10% bonus
  },
  {
    id: 'points_1000',
    points: 1000,
    price: 34.99,
    currency: 'USD',
    bonus: 150, // 15% bonus
  },
  {
    id: 'points_5000',
    points: 5000,
    price: 149.99,
    currency: 'USD',
    bonus: 1000, // 20% bonus
  },
];

/**
 * Featured listing pricing
 */
export const FEATURED_LISTING_PRICES = {
  '7_days': { days: 7, price: 9.99, currency: 'USD' },
  '14_days': { days: 14, price: 14.99, currency: 'USD' },
  '30_days': { days: 30, price: 24.99, currency: 'USD' },
};

/**
 * Create PayPal order - calls actual PayPal API
 */
export async function createPayPalOrder(
  payload: CreateOrderPayload
): Promise<PayPalOrder> {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }

  // Get access token
  const accessToken = await getPayPalAccessToken();
  const apiUrl = getPayPalApiUrl();

  // Determine return URLs based on environment
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const returnUrl = `${baseUrl}/payment/success`;
  const cancelUrl = `${baseUrl}/payment/cancel`;

  // Create order request
  const orderRequest = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: payload.currency || 'USD',
          value: payload.amount.toFixed(2),
        },
        description: payload.description || `${payload.type} purchase`,
        custom_id: JSON.stringify({
          type: payload.type,
          ...payload.metadata,
        }),
      },
    ],
    application_context: {
      brand_name: 'BuyNSell Philippines',
      landing_page: 'LOGIN',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const response = await fetch(`${apiUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(orderRequest),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('PayPal create order error:', errorData);
    throw new Error(errorData.message || 'Failed to create PayPal order');
  }

  const orderData = await response.json();

  // Find approve URL from links
  const approveLink = orderData.links?.find((link: any) => link.rel === 'approve');

  return {
    id: orderData.id,
    status: orderData.status as PaymentStatus,
    amount: payload.amount,
    currency: payload.currency || 'USD',
    type: payload.type,
    approveUrl: approveLink?.href,
    createdAt: new Date(),
    metadata: payload.metadata,
  };
}

/**
 * Capture PayPal order - calls actual PayPal API
 */
export async function capturePayPalOrder(orderId: string): Promise<PayPalOrder & { captureData?: any }> {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured');
  }

  const accessToken = await getPayPalAccessToken();
  const apiUrl = getPayPalApiUrl();

  const response = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('PayPal capture order error:', errorData);
    throw new Error(errorData.message || 'Failed to capture PayPal order');
  }

  const captureData = await response.json();
  const purchaseUnit = captureData.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];

  return {
    id: captureData.id,
    status: captureData.status as PaymentStatus,
    amount: parseFloat(capture?.amount?.value || '0'),
    currency: capture?.amount?.currency_code || 'USD',
    type: 'subscription', // Will be parsed from custom_id
    createdAt: new Date(),
    captureData,
  };
}

/**
 * Create PayPal subscription (placeholder)
 */
export async function createPayPalSubscription(
  _planId: string,
  _userId: string
): Promise<{ subscriptionId: string; approveUrl: string }> {
  // TODO: Implement actual PayPal subscription creation
  // POST /v1/billing/subscriptions

  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured');
  }

  const mockSubId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    subscriptionId: mockSubId,
    approveUrl: `https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=${mockSubId}`,
  };
}

/**
 * Cancel PayPal subscription (placeholder)
 */
export async function cancelPayPalSubscription(
  _subscriptionId: string,
  _reason?: string
): Promise<boolean> {
  // TODO: Implement actual PayPal subscription cancellation
  // POST /v1/billing/subscriptions/{subscription_id}/cancel

  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured');
  }

  return true;
}

/**
 * Verify webhook signature (placeholder)
 */
export async function verifyWebhookSignature(
  _headers: Record<string, string>,
  _body: string
): Promise<boolean> {
  // TODO: Implement actual webhook signature verification
  // POST /v1/notifications/verify-webhook-signature

  return true;
}
