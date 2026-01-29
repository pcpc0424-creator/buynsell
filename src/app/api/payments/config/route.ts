import { NextRequest, NextResponse } from 'next/server';
import {
  isPayPalConfigured,
  getPayPalClientId,
  getPayPalMode,
  SUBSCRIPTION_PLANS,
  POINTS_PACKAGES,
  FEATURED_LISTING_PRICES,
} from '@/lib/paypal';

// GET /api/payments/config - Get payment configuration for frontend
export async function GET(_request: NextRequest) {
  try {
    const configured = isPayPalConfigured();

    return NextResponse.json({
      success: true,
      data: {
        paypal: {
          configured,
          clientId: configured ? getPayPalClientId() : null,
          mode: getPayPalMode(),
        },
        plans: {
          subscriptions: SUBSCRIPTION_PLANS,
          points: POINTS_PACKAGES,
          featuredListings: FEATURED_LISTING_PRICES,
        },
        currencies: {
          default: 'USD',
          supported: ['USD', 'PHP'],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment configuration' },
      { status: 500 }
    );
  }
}
