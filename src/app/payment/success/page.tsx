'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { apiUrl } from '@/lib/config';

function PaymentSuccessContent() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();

  const orderId = searchParams.get('token') || searchParams.get('orderId') || '';
  const type = searchParams.get('type') || 'subscription';
  const tier = searchParams.get('tier') || '';
  const points = searchParams.get('points') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message?: string;
    subscription?: { tier: string };
    points?: number;
    newBalance?: number;
  } | null>(null);

  useEffect(() => {
    if (orderId) {
      capturePayment();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const capturePayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/api/payments/orders/${orderId}/capture`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          tier,
          points: points ? parseInt(points) : undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to complete payment');
      }

      setResult(data.data);

      // Update session to reflect new tier/points
      if (session) {
        await update();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-blue mx-auto mb-4"></div>
            <p className="text-slate-600">Processing your payment...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-lg mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-times text-4xl text-red-500"></i>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h1>
              <p className="text-slate-500 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/pricing"
                  className="btn-premium text-white font-semibold px-8 py-3 rounded-full"
                >
                  Try Again
                </Link>
                <Link
                  href="/contact"
                  className="bg-slate-100 text-slate-700 font-semibold px-8 py-3 rounded-full hover:bg-slate-200 transition-all"
                >
                  Contact Support
                </Link>
              </div>
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

      <div className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-lg mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Success Animation */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
              <i className="fas fa-check text-4xl text-green-500"></i>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h1>
            <p className="text-slate-500 mb-6">
              {result?.message || 'Your payment has been processed successfully.'}
            </p>

            {/* Order Details */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-slate-800 mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID</span>
                    <span className="text-slate-800 font-mono text-xs">{orderId.substring(0, 20)}...</span>
                  </div>
                )}
                {type === 'subscription' && result?.subscription && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan</span>
                    <span className="text-slate-800 font-semibold">{result.subscription.tier} Membership</span>
                  </div>
                )}
                {type === 'points' && result?.points && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Points Added</span>
                      <span className="text-slate-800 font-semibold">+{result.points.toLocaleString()}</span>
                    </div>
                    {result.newBalance && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">New Balance</span>
                        <span className="text-accent-blue font-semibold">{result.newBalance.toLocaleString()} pts</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="text-green-600 font-semibold">
                    <i className="fas fa-check-circle mr-1"></i>
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-2">
                <i className="fas fa-info-circle mr-2"></i>
                What&apos;s Next?
              </h3>
              {type === 'subscription' ? (
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your account has been upgraded</li>
                  <li>• New features are now available</li>
                  <li>• A confirmation email will be sent</li>
                </ul>
              ) : (
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Points have been added to your account</li>
                  <li>• Use points to view properties</li>
                  <li>• A confirmation email will be sent</li>
                </ul>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {type === 'subscription' ? (
                <Link
                  href="/my/subscription"
                  className="btn-premium text-white font-semibold px-8 py-3 rounded-full"
                >
                  View My Account
                </Link>
              ) : (
                <Link
                  href="/properties"
                  className="btn-premium text-white font-semibold px-8 py-3 rounded-full"
                >
                  Browse Properties
                </Link>
              )}
              <Link
                href="/"
                className="bg-slate-100 text-slate-700 font-semibold px-8 py-3 rounded-full hover:bg-slate-200 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* Receipt Note */}
          <p className="text-center text-slate-400 text-sm mt-6">
            <i className="fas fa-envelope mr-1"></i>
            A receipt has been sent to {session?.user?.email}
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default function PaymentSuccessPage() {
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
      <PaymentSuccessContent />
    </Suspense>
  );
}
