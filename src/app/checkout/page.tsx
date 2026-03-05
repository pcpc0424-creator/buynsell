'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { apiUrl } from '@/lib/config';

interface TierPolicy {
  tier: string;
  monthlySubscriptionPrice: number | null;
  dailyViewLimit: number;
  monthlyViewLimit: number;
  listingLimit: number;
}

interface PointsPackage {
  id: string;
  points: number;
  price: number;
  currency: string;
  bonus: number;
}

const tierConfig: Record<string, { label: string; gradient: string; icon: string }> = {
  GREEN: { label: 'Green', gradient: 'from-green-500 to-emerald-600', icon: 'fa-leaf' },
  SILVER: { label: 'Silver', gradient: 'from-gray-400 to-gray-500', icon: 'fa-medal' },
  GOLD: { label: 'Gold', gradient: 'from-yellow-400 to-amber-500', icon: 'fa-crown' },
  PREMIUM: { label: 'Premium', gradient: 'from-purple-500 to-indigo-600', icon: 'fa-gem' },
};

function CheckoutContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') || 'subscription'; // subscription or points
  const tier = searchParams.get('tier') || '';
  const packageId = searchParams.get('package') || '';

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<TierPolicy[]>([]);
  const [pointsPackages, setPointsPackages] = useState<PointsPackage[]>([]);
  const [paypalConfigured, setPaypalConfigured] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const selectedPolicy = policies.find(p => p.tier === tier);
  const selectedPackage = pointsPackages.find(p => p.id === packageId);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout?' + searchParams.toString());
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesRes, configRes] = await Promise.all([
        fetch(apiUrl('/api/tier-policies')),
        fetch(apiUrl('/api/payments/config')),
      ]);

      const policiesData = await policiesRes.json();
      const configData = await configRes.json();

      if (policiesData.success) {
        setPolicies(policiesData.data);
      }

      if (configData.success) {
        setPaypalConfigured(configData.data?.paypal?.configured || false);
        if (configData.data?.plans?.points) {
          setPointsPackages(configData.data.plans.points);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    // If PayPal is not configured, redirect to contact
    if (!paypalConfigured) {
      const subject = type === 'subscription'
        ? `Upgrade to ${tier}`
        : `Purchase ${selectedPackage?.points} points`;
      router.push(`/contact?subject=${encodeURIComponent(subject)}`);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const body = type === 'subscription'
        ? { type: 'subscription', tier }
        : { type: 'points', packageId };

      const res = await fetch(apiUrl('/api/payments/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Redirect to PayPal
      if (data.data.approveUrl) {
        window.location.href = data.data.approveUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getOrderSummary = () => {
    if (type === 'subscription' && selectedPolicy) {
      return {
        title: `${tierConfig[tier]?.label || tier} Membership`,
        description: 'Monthly subscription',
        price: selectedPolicy.monthlySubscriptionPrice || 0,
        currency: 'USD',
      };
    } else if (type === 'points' && selectedPackage) {
      return {
        title: `${(selectedPackage.points + selectedPackage.bonus).toLocaleString()} Points`,
        description: selectedPackage.bonus > 0 ? `${selectedPackage.points} + ${selectedPackage.bonus} bonus` : `${selectedPackage.points} points`,
        price: selectedPackage.price,
        currency: 'USD',
      };
    }
    return null;
  };

  const orderSummary = getOrderSummary();

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!orderSummary) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-32 pb-20">
          <div className="max-w-lg mx-auto px-6 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Selection</h1>
              <p className="text-slate-500 mb-6">Please select a valid plan or package to proceed.</p>
              <Link
                href="/pricing"
                className="btn-premium text-white font-semibold px-8 py-3 rounded-full inline-block"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Checkout</h1>
            <p className="text-slate-500">Complete your purchase</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  <i className="fas fa-shopping-cart mr-2 text-accent-blue"></i>
                  Order Summary
                </h2>

                <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                  {type === 'subscription' && (
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${tierConfig[tier]?.gradient} flex items-center justify-center mr-4`}>
                      <i className={`fas ${tierConfig[tier]?.icon} text-white text-xl`}></i>
                    </div>
                  )}
                  {type === 'points' && (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple flex items-center justify-center mr-4">
                      <i className="fas fa-coins text-white text-xl"></i>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{orderSummary.title}</h3>
                    <p className="text-slate-500 text-sm">{orderSummary.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-800">${orderSummary.price.toFixed(2)}</span>
                    <span className="text-slate-500 text-sm ml-1">{orderSummary.currency}</span>
                  </div>
                </div>

                {type === 'subscription' && selectedPolicy && (
                  <div className="mt-4 p-4 border border-slate-200 rounded-xl">
                    <h4 className="font-medium text-slate-700 mb-2">Plan Features:</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center">
                        <i className="fas fa-check text-green-500 mr-2 w-4"></i>
                        {selectedPolicy.dailyViewLimit === -1 ? 'Unlimited' : selectedPolicy.dailyViewLimit} daily views
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-green-500 mr-2 w-4"></i>
                        {selectedPolicy.monthlyViewLimit === -1 ? 'Unlimited' : selectedPolicy.monthlyViewLimit} monthly views
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-green-500 mr-2 w-4"></i>
                        {selectedPolicy.listingLimit === -1 ? 'Unlimited' : selectedPolicy.listingLimit} listings (for agents)
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  <i className="fas fa-credit-card mr-2 text-accent-blue"></i>
                  Payment Method
                </h2>

                {paypalConfigured ? (
                  <div className="border-2 border-accent-blue rounded-xl p-4 bg-blue-50">
                    <div className="flex items-center">
                      <input type="radio" checked readOnly className="mr-3" />
                      <i className="fab fa-paypal text-2xl text-blue-600 mr-3"></i>
                      <div>
                        <p className="font-medium text-slate-800">PayPal</p>
                        <p className="text-sm text-slate-500">Pay securely with PayPal</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-yellow-300 rounded-xl p-4 bg-yellow-50">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5"></i>
                      <div>
                        <p className="font-medium text-slate-800">Manual Payment</p>
                        <p className="text-sm text-slate-500">
                          Online payment is being set up. Click &quot;Proceed to Payment&quot; to contact us for manual processing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center text-sm text-slate-500">
                  <i className="fas fa-lock mr-2 text-green-500"></i>
                  Your payment information is secure and encrypted
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Payment Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>${orderSummary.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-800">
                    <span>Total</span>
                    <span>${orderSummary.price.toFixed(2)} {orderSummary.currency}</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                <label className="flex items-start mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm text-slate-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-accent-blue hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-accent-blue hover:underline">Privacy Policy</Link>
                  </span>
                </label>

                <button
                  onClick={handlePayment}
                  disabled={processing || !agreed}
                  className="w-full btn-premium text-white font-semibold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : paypalConfigured ? (
                    <>
                      <i className="fab fa-paypal mr-2"></i>
                      Pay with PayPal
                    </>
                  ) : (
                    <>
                      <i className="fas fa-envelope mr-2"></i>
                      Proceed to Payment
                    </>
                  )}
                </button>

                <Link
                  href="/pricing"
                  className="block text-center mt-4 text-slate-500 hover:text-slate-700 text-sm"
                >
                  <i className="fas fa-arrow-left mr-1"></i>
                  Back to Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
        </div>
        <Footer />
      </>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
