'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { apiUrl } from '@/lib/config';

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

const tierConfig: Record<string, { label: string; color: string; bgColor: string; gradient: string; icon: string }> = {
  GREEN: { label: 'Green', color: 'text-green-600', bgColor: 'bg-green-100', gradient: 'from-green-500 to-emerald-600', icon: 'fa-leaf' },
  SILVER: { label: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100', gradient: 'from-gray-400 to-gray-500', icon: 'fa-medal' },
  GOLD: { label: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100', gradient: 'from-yellow-400 to-amber-500', icon: 'fa-crown' },
  PREMIUM: { label: 'Premium', color: 'text-purple-600', bgColor: 'bg-purple-100', gradient: 'from-purple-500 to-indigo-600', icon: 'fa-gem' },
};

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'subscription' | 'points'>('subscription');
  const [policies, setPolicies] = useState<TierPolicy[]>([]);
  const [pointsPackages, setPointsPackages] = useState<PointsPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTier = (session?.user as { tier?: string })?.tier || 'GREEN';

  useEffect(() => {
    fetchData();
  }, []);

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

      if (configData.success && configData.data?.plans?.points) {
        setPointsPackages(configData.data.plans.points);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (tier: string) => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=/checkout?type=subscription&tier=${tier}`);
      return;
    }

    if (tier === currentTier) return;

    // Redirect to checkout page
    router.push(`/checkout?type=subscription&tier=${tier}`);
  };

  const handleBuyPoints = (packageId: string) => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=/checkout?type=points&package=${packageId}`);
      return;
    }

    // Redirect to checkout page
    router.push(`/checkout?type=points&package=${packageId}`);
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-slate-800 mb-4">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-8">
            Upgrade your account to unlock more features and get the most out of Buy & Sell
          </p>

          {session && (
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${tierConfig[currentTier]?.bgColor || 'bg-slate-100'} mb-8`}>
              <span className="text-slate-500">Current Plan:</span>
              <span className={`font-semibold ${tierConfig[currentTier]?.color || 'text-slate-800'}`}>
                <i className={`fas ${tierConfig[currentTier]?.icon} mr-1`}></i>
                {tierConfig[currentTier]?.label || currentTier}
              </span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex justify-center mb-12">
            <div className="bg-slate-100 rounded-full p-1 inline-flex">
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'subscription'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-crown mr-2"></i>Subscription Plans
              </button>
              <button
                onClick={() => setActiveTab('points')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'points'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-coins mr-2"></i>Buy Points
              </button>
            </div>
          </div>
        </div>
      </section>

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
                      className={`bg-white rounded-2xl overflow-hidden relative shadow-lg border-2 transition-all hover:shadow-xl flex flex-col ${
                        isPopular ? 'border-accent-blue' : ''
                      } ${isCurrentTier ? 'border-green-500' : 'border-transparent'}`}
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
                      <div className="p-6 flex-1 flex flex-col">
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-center text-slate-600">
                            <i className="fas fa-check text-green-500 mr-3 w-4"></i>
                            <span>{formatLimit(policy.dailyViewLimit)} daily views</span>
                          </li>
                          <li className="flex items-center text-slate-600">
                            <i className="fas fa-check text-green-500 mr-3 w-4"></i>
                            <span>{formatLimit(policy.monthlyViewLimit)} monthly views</span>
                          </li>
                          <li className="flex items-center text-slate-600">
                            <i className="fas fa-check text-green-500 mr-3 w-4"></i>
                            <span>{formatLimit(policy.listingLimit)} listings (agents)</span>
                          </li>
                          <li className="flex items-center text-slate-600">
                            <i className={`fas ${policy.maxViewablePrice ? 'fa-times text-red-400' : 'fa-check text-green-500'} mr-3 w-4`}></i>
                            <span>
                              {policy.maxViewablePrice
                                ? `Max ₱${policy.maxViewablePrice.toLocaleString()}`
                                : 'No price limit'}
                            </span>
                          </li>
                          <li className="flex items-center text-slate-600">
                            <i className="fas fa-info-circle text-accent-blue mr-3 w-4"></i>
                            <span>{policy.pointsPerView} pts per view</span>
                          </li>
                        </ul>

                        {policy.description && (
                          <p className="text-slate-400 text-sm mb-6">{policy.description}</p>
                        )}

                        <button
                          onClick={() => handleSubscribe(policy.tier)}
                          disabled={isCurrentTier || isFree}
                          className={`w-full py-3 rounded-xl font-semibold transition-all mt-auto ${
                            isCurrentTier
                              ? 'bg-green-100 text-green-600 cursor-default'
                              : isFree
                              ? 'bg-slate-100 text-slate-400 cursor-default'
                              : 'btn-premium text-white hover:shadow-lg'
                          }`}
                        >
                          {isCurrentTier ? (
                            'Current Plan'
                          ) : isFree ? (
                            'Free Tier'
                          ) : (
                            'Get Started'
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
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Buy Points</h2>
              <p className="text-slate-500">
                Use points to view properties and list your properties
              </p>
              {session && (
                <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-accent-blue/10">
                  <i className="fas fa-coins text-accent-blue"></i>
                  <span className="text-slate-700">
                    Current Balance: <strong>{(session.user as { points?: number })?.points || 0}</strong> points
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
                      className={`bg-white rounded-2xl overflow-hidden relative shadow-lg border-2 transition-all hover:shadow-xl flex flex-col ${
                        isBestValue ? 'border-purple-500' : 'border-transparent'
                      }`}
                    >
                      {isBestValue && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-accent-blue text-white text-center text-xs py-1 font-medium">
                          BEST VALUE
                        </div>
                      )}

                      <div className="p-6 flex-1 flex flex-col">
                        <div className={`text-center mb-4 ${isBestValue ? 'pt-4' : ''}`}>
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-coins text-white text-2xl"></i>
                          </div>
                          <div className="text-3xl font-bold text-slate-800 mb-1">
                            {totalPoints.toLocaleString()}
                          </div>
                          <div className="text-slate-500 text-sm">points</div>
                          {pkg.bonus > 0 && (
                            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                              +{pkg.bonus} bonus
                            </div>
                          )}
                        </div>

                        <div className="text-center mb-6">
                          <span className="text-2xl font-bold text-slate-800">
                            ${pkg.price.toFixed(2)}
                          </span>
                          <span className="text-slate-500 text-sm ml-1">USD</span>
                          <p className="text-slate-400 text-xs mt-1">
                            ${(pkg.price / totalPoints * 100).toFixed(2)} per 100 pts
                          </p>
                        </div>

                        <button
                          onClick={() => handleBuyPoints(pkg.id)}
                          className="w-full py-3 rounded-xl font-semibold btn-premium text-white transition-all hover:shadow-lg mt-auto"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Points Info */}
            <div className="mt-12 bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-slate-800 font-semibold mb-4">
                <i className="fas fa-info-circle text-accent-blue mr-2"></i>
                How Points Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-4">
                  <i className="fas fa-eye text-accent-blue mb-2 text-lg"></i>
                  <p className="text-slate-800 font-medium mb-1">View Properties</p>
                  <p className="text-slate-500">Points are deducted when viewing property details (based on your tier)</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <i className="fas fa-building text-accent-purple mb-2 text-lg"></i>
                  <p className="text-slate-800 font-medium mb-1">List Properties</p>
                  <p className="text-slate-500">Agents can use points to list properties beyond tier limits</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <i className="fas fa-infinity text-green-500 mb-2 text-lg"></i>
                  <p className="text-slate-800 font-medium mb-1">Never Expire</p>
                  <p className="text-slate-500">Your points never expire and can be used anytime</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Payment Methods */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm mb-4">Secure payment powered by</p>
          <div className="flex items-center justify-center space-x-8">
            <div className="text-slate-400">
              <i className="fab fa-paypal text-3xl"></i>
            </div>
            <div className="text-slate-400">
              <i className="fab fa-cc-visa text-3xl"></i>
            </div>
            <div className="text-slate-400">
              <i className="fab fa-cc-mastercard text-3xl"></i>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
