'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';

interface TierPolicy {
  tier: string;
  dailyViewLimit: number;
  monthlyViewLimit: number;
  listingLimit: number;
  maxViewablePrice: number | null;
  monthlySubscriptionPrice: number | null;
  pointsPerView: number;
  pointsPerListing: number;
  description: string | null;
}

interface PointsPackage {
  id: string;
  points: number;
  price: number;
  currency: string;
  bonus: number;
}

const tierConfig: Record<string, { label: string; color: string; gradient: string; icon: string }> = {
  GREEN: { label: 'Green', color: 'text-green-400', gradient: 'from-green-500 to-emerald-600', icon: 'fa-leaf' },
  SILVER: { label: 'Silver', color: 'text-gray-300', gradient: 'from-gray-400 to-gray-500', icon: 'fa-medal' },
  GOLD: { label: 'Gold', color: 'text-yellow-400', gradient: 'from-yellow-400 to-amber-500', icon: 'fa-crown' },
  PREMIUM: { label: 'Premium', color: 'text-purple-400', gradient: 'from-purple-500 to-indigo-600', icon: 'fa-gem' },
};

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'subscription' | 'points'>('subscription');
  const [policies, setPolicies] = useState<TierPolicy[]>([]);
  const [pointsPackages, setPointsPackages] = useState<PointsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTier = (session?.user as any)?.tier || 'GREEN';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesRes, configRes] = await Promise.all([
        fetch('/api/admin/tier-policies'),
        fetch('/api/payments/config'),
      ]);

      const policiesData = await policiesRes.json();
      const configData = await configRes.json();

      if (policiesData.success) {
        setPolicies(policiesData.data);
      }

      if (configData.success && configData.data?.plans?.points) {
        setPointsPackages(configData.data.plans.points);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    if (tier === currentTier) return;

    try {
      setProcessing(tier);
      setError(null);

      const res = await fetch('/api/payments/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          tier,
        }),
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
      setProcessing(null);
    }
  };

  const handleBuyPoints = async (packageId: string) => {
    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    try {
      setProcessing(packageId);
      setError(null);

      const res = await fetch('/api/payments/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'points',
          packageId,
        }),
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
      setProcessing(null);
    }
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Upgrade your account to unlock more features and get the most out of Buy & Sell
          </p>

          {session && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 mb-8">
              <span className="text-white/60">Current Plan:</span>
              <span className={`font-semibold ${tierConfig[currentTier]?.color || 'text-white'}`}>
                <i className={`fas ${tierConfig[currentTier]?.icon} mr-1`}></i>
                {tierConfig[currentTier]?.label || currentTier}
              </span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex justify-center mb-12">
            <div className="glass-ultra rounded-full p-1 inline-flex">
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'subscription'
                    ? 'bg-accent-blue text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <i className="fas fa-crown mr-2"></i>Subscription Plans
              </button>
              <button
                onClick={() => setActiveTab('points')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'points'
                    ? 'bg-accent-blue text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <i className="fas fa-coins mr-2"></i>Buy Points
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
          <div className="glass-ultra rounded-2xl p-4 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-white/50 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      {activeTab === 'subscription' && (
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {policies.map((policy) => {
                  const config = tierConfig[policy.tier];
                  const isCurrentTier = policy.tier === currentTier;
                  const isFree = policy.tier === 'GREEN';
                  const isPopular = policy.tier === 'GOLD';

                  return (
                    <div
                      key={policy.tier}
                      className={`glass-ultra rounded-2xl overflow-hidden relative ${
                        isPopular ? 'ring-2 ring-accent-blue' : ''
                      } ${isCurrentTier ? 'ring-2 ring-green-500' : ''}`}
                    >
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 bg-accent-blue text-white text-center text-xs py-1 font-medium">
                          MOST POPULAR
                        </div>
                      )}
                      {isCurrentTier && (
                        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1 font-medium">
                          CURRENT PLAN
                        </div>
                      )}

                      {/* Header */}
                      <div className={`bg-gradient-to-r ${config.gradient} p-6 ${isPopular || isCurrentTier ? 'pt-8' : ''}`}>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <i className={`fas ${config.icon} text-white text-xl`}></i>
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-xl">{config.label}</h3>
                          </div>
                        </div>
                        <div className="text-white">
                          {isFree ? (
                            <span className="text-3xl font-bold">Free</span>
                          ) : (
                            <>
                              <span className="text-3xl font-bold">
                                ${policy.monthlySubscriptionPrice?.toFixed(2)}
                              </span>
                              <span className="text-white/70">/month</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="p-6">
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-center text-white/70">
                            <i className="fas fa-check text-green-400 mr-3 w-4"></i>
                            <span>{formatLimit(policy.dailyViewLimit)} daily views</span>
                          </li>
                          <li className="flex items-center text-white/70">
                            <i className="fas fa-check text-green-400 mr-3 w-4"></i>
                            <span>{formatLimit(policy.monthlyViewLimit)} monthly views</span>
                          </li>
                          <li className="flex items-center text-white/70">
                            <i className="fas fa-check text-green-400 mr-3 w-4"></i>
                            <span>{formatLimit(policy.listingLimit)} listings (agents)</span>
                          </li>
                          <li className="flex items-center text-white/70">
                            <i className={`fas ${policy.maxViewablePrice ? 'fa-times text-red-400' : 'fa-check text-green-400'} mr-3 w-4`}></i>
                            <span>
                              {policy.maxViewablePrice
                                ? `Max ₱${policy.maxViewablePrice.toLocaleString()}`
                                : 'No price limit'}
                            </span>
                          </li>
                          <li className="flex items-center text-white/70">
                            <i className="fas fa-info-circle text-accent-blue mr-3 w-4"></i>
                            <span>{policy.pointsPerView} pts per view</span>
                          </li>
                        </ul>

                        {policy.description && (
                          <p className="text-white/40 text-sm mb-6">{policy.description}</p>
                        )}

                        <button
                          onClick={() => handleSubscribe(policy.tier)}
                          disabled={isCurrentTier || isFree || processing === policy.tier}
                          className={`w-full py-3 rounded-xl font-semibold transition-all ${
                            isCurrentTier
                              ? 'bg-green-500/20 text-green-400 cursor-default'
                              : isFree
                              ? 'bg-white/10 text-white/50 cursor-default'
                              : 'btn-premium text-white'
                          }`}
                        >
                          {processing === policy.tier ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : isCurrentTier ? (
                            'Current Plan'
                          ) : isFree ? (
                            'Free Tier'
                          ) : (
                            'Subscribe Now'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Points Packages */}
      {activeTab === 'points' && (
        <section className="pb-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white mb-2">Buy Points</h2>
              <p className="text-white/60">
                Use points to view properties and list your properties
              </p>
              {session && (
                <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-accent-blue/20">
                  <i className="fas fa-coins text-accent-blue"></i>
                  <span className="text-white">
                    Current Balance: <strong>{(session.user as any)?.points || 0}</strong> points
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pointsPackages.map((pkg, index) => {
                  const isBestValue = index === pointsPackages.length - 1;
                  const totalPoints = pkg.points + pkg.bonus;

                  return (
                    <div
                      key={pkg.id}
                      className={`glass-ultra rounded-2xl overflow-hidden relative ${
                        isBestValue ? 'ring-2 ring-accent-purple' : ''
                      }`}
                    >
                      {isBestValue && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-accent-purple to-accent-blue text-white text-center text-xs py-1 font-medium">
                          BEST VALUE
                        </div>
                      )}

                      <div className="p-6">
                        <div className={`text-center mb-4 ${isBestValue ? 'pt-4' : ''}`}>
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-coins text-white text-2xl"></i>
                          </div>
                          <div className="text-3xl font-bold text-white mb-1">
                            {totalPoints.toLocaleString()}
                          </div>
                          <div className="text-white/50 text-sm">points</div>
                          {pkg.bonus > 0 && (
                            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                              +{pkg.bonus} bonus
                            </div>
                          )}
                        </div>

                        <div className="text-center mb-6">
                          <span className="text-2xl font-bold text-white">
                            ${pkg.price.toFixed(2)}
                          </span>
                          <span className="text-white/50 text-sm ml-1">USD</span>
                          <p className="text-white/40 text-xs mt-1">
                            ${(pkg.price / totalPoints * 100).toFixed(2)} per 100 pts
                          </p>
                        </div>

                        <button
                          onClick={() => handleBuyPoints(pkg.id)}
                          disabled={processing === pkg.id}
                          className="w-full py-3 rounded-xl font-semibold btn-premium text-white transition-all"
                        >
                          {processing === pkg.id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            'Buy Now'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Points Info */}
            <div className="mt-12 glass-ultra rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">
                <i className="fas fa-info-circle text-accent-blue mr-2"></i>
                How Points Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/5 rounded-xl p-4">
                  <i className="fas fa-eye text-accent-blue mb-2"></i>
                  <p className="text-white font-medium mb-1">View Properties</p>
                  <p className="text-white/50">Points are deducted when viewing property details (based on your tier)</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <i className="fas fa-building text-accent-purple mb-2"></i>
                  <p className="text-white font-medium mb-1">List Properties</p>
                  <p className="text-white/50">Agents can use points to list properties beyond tier limits</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <i className="fas fa-infinity text-green-400 mb-2"></i>
                  <p className="text-white font-medium mb-1">Never Expire</p>
                  <p className="text-white/50">Your points never expire and can be used anytime</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Payment Methods */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-white/40 text-sm mb-4">Secure payment powered by</p>
          <div className="flex items-center justify-center space-x-8">
            <div className="text-white/60">
              <i className="fab fa-paypal text-3xl"></i>
            </div>
            <div className="text-white/60">
              <i className="fab fa-cc-visa text-3xl"></i>
            </div>
            <div className="text-white/60">
              <i className="fab fa-cc-mastercard text-3xl"></i>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
