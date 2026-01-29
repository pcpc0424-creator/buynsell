'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { apiUrl } from '@/lib/config';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  paypalOrderId: string | null;
  createdAt: string;
}

interface PointsTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

interface UserStats {
  tier: string;
  points: number;
  dailyViews: number;
  monthlyViews: number;
  dailyLimit: number;
  monthlyLimit: number;
}

const tierConfig: Record<string, { label: string; color: string; gradient: string; icon: string }> = {
  GREEN: { label: 'Green', color: 'text-green-400', gradient: 'from-green-500 to-emerald-600', icon: 'fa-leaf' },
  SILVER: { label: 'Silver', color: 'text-gray-300', gradient: 'from-gray-400 to-gray-500', icon: 'fa-medal' },
  GOLD: { label: 'Gold', color: 'text-yellow-400', gradient: 'from-yellow-400 to-amber-500', icon: 'fa-crown' },
  PREMIUM: { label: 'Premium', color: 'text-purple-400', gradient: 'from-purple-500 to-indigo-600', icon: 'fa-gem' },
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  EXPIRED: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-yellow-500/20 text-yellow-400',
};

export default function SubscriptionPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'points'>('overview');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/my/subscription');
    } else if (authStatus === 'authenticated') {
      fetchData();
    }
  }, [authStatus, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersRes, pointsRes, userRes] = await Promise.all([
        fetch(apiUrl('/api/payments/orders')),
        fetch(apiUrl('/api/payments/points')),
        fetch(apiUrl('/api/users/me')),
      ]);

      const ordersData = await ordersRes.json();
      const pointsData = await pointsRes.json();
      const userData = await userRes.json();

      if (ordersData.success) {
        setSubscriptions(ordersData.data.subscriptions || []);
        setPointsHistory(ordersData.data.pointsTransactions || []);
      }

      if (userData.success && userData.data) {
        setUserStats({
          tier: userData.data.tier,
          points: userData.data.points || 0,
          dailyViews: userData.data.dailyViews || 0,
          monthlyViews: userData.data.monthlyViews || 0,
          dailyLimit: userData.data.tierPolicy?.dailyViewLimit || -1,
          monthlyLimit: userData.data.tierPolicy?.monthlyViewLimit || -1,
        });
      }

      if (pointsData.success) {
        setPointsHistory(pointsData.data?.history || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? Your tier will be downgraded at the end of the billing period.')) {
      return;
    }

    try {
      setCancellingId(subscriptionId);
      setError(null);

      const res = await fetch(apiUrl(`/api/payments/subscriptions/${subscriptionId}/cancel`), {
        method: 'POST',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setSuccess('Subscription cancelled successfully. Changes will take effect at the end of your billing period.');
      fetchData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  if (authStatus === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
        </div>
        <Footer />
      </>
    );
  }

  const currentTier = userStats?.tier || (session?.user as any)?.tier || 'GREEN';
  const config = tierConfig[currentTier];

  return (
    <>
      <Header />

      <section className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-slate-800 mb-4">
              My <span className="gradient-text">Subscription</span>
            </h1>
            <p className="text-slate-500">Manage your subscription and points</p>
          </div>

          {error && (
            <div className="glass-ultra rounded-2xl p-4 mb-6 border border-red-500/20">
              <div className="flex items-center text-red-400">
                <i className="fas fa-exclamation-circle mr-3"></i>
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-slate-500 hover:text-slate-800">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="glass-ultra rounded-2xl p-4 mb-6 border border-green-500/20">
              <div className="flex items-center text-green-400">
                <i className="fas fa-check-circle mr-3"></i>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Current Plan Card */}
          <div className={`glass-ultra rounded-2xl overflow-hidden mb-8`}>
            <div className={`bg-gradient-to-r ${config.gradient} p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center">
                    <i className={`fas ${config.icon} text-white text-2xl`}></i>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">Current Plan</p>
                    <h2 className="text-white font-bold text-2xl">{config.label}</h2>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="px-6 py-2 bg-slate-200 hover:bg-white/30 rounded-xl text-white font-medium transition-all"
                >
                  <i className="fas fa-arrow-up mr-2"></i>Upgrade
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-100 rounded-xl p-4 text-center">
                  <i className="fas fa-coins text-accent-blue text-xl mb-2"></i>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Points Balance</p>
                  <p className="text-slate-800 font-bold text-xl">{userStats?.points?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-slate-100 rounded-xl p-4 text-center">
                  <i className="fas fa-eye text-green-400 text-xl mb-2"></i>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Daily Views</p>
                  <p className="text-slate-800 font-bold text-xl">
                    {userStats?.dailyViews || 0} / {formatLimit(userStats?.dailyLimit || -1)}
                  </p>
                </div>
                <div className="bg-slate-100 rounded-xl p-4 text-center">
                  <i className="fas fa-calendar text-purple-400 text-xl mb-2"></i>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Monthly Views</p>
                  <p className="text-slate-800 font-bold text-xl">
                    {userStats?.monthlyViews || 0} / {formatLimit(userStats?.monthlyLimit || -1)}
                  </p>
                </div>
                <div className="bg-slate-100 rounded-xl p-4 text-center">
                  <i className="fas fa-star text-yellow-400 text-xl mb-2"></i>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Member Since</p>
                  <p className="text-slate-800 font-bold text-lg">
                    {session?.user && formatDate((session.user as any).createdAt || new Date().toISOString())}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-accent-blue text-white'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <i className="fas fa-chart-pie mr-2"></i>Overview
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-5 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-accent-blue text-white'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <i className="fas fa-history mr-2"></i>Subscription History
            </button>
            <button
              onClick={() => setActiveTab('points')}
              className={`px-5 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'points'
                  ? 'bg-accent-blue text-white'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <i className="fas fa-coins mr-2"></i>Points History
            </button>
          </div>

          {/* Tab Content */}
          <div className="glass-ultra rounded-2xl p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Overview</h3>

                {/* Active Subscription */}
                {subscriptions.filter((s) => s.status === 'ACTIVE').length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-slate-600 text-sm font-medium">Active Subscription</h4>
                    {subscriptions
                      .filter((s) => s.status === 'ACTIVE')
                      .map((sub) => (
                        <div key={sub.id} className="bg-slate-100 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-slate-800 font-medium">
                              {tierConfig[sub.tier]?.label} Plan
                            </p>
                            <p className="text-slate-500 text-sm">
                              Renews on {formatDate(sub.endDate)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[sub.status]}`}>
                              {sub.status}
                            </span>
                            <button
                              onClick={() => handleCancelSubscription(sub.id)}
                              disabled={cancellingId === sub.id}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              {cancellingId === sub.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                'Cancel'
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-xl p-6 text-center">
                    <i className="fas fa-info-circle text-3xl text-slate-400 mb-3"></i>
                    <p className="text-slate-500">No active subscription</p>
                    <Link
                      href="/pricing"
                      className="inline-block mt-4 px-6 py-2 btn-premium rounded-xl text-white font-medium"
                    >
                      View Plans
                    </Link>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/pricing"
                    className="bg-slate-100 hover:bg-slate-200 rounded-xl p-4 flex items-center space-x-4 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                      <i className="fas fa-arrow-up text-accent-blue"></i>
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">Upgrade Plan</p>
                      <p className="text-slate-500 text-sm">Get more views and features</p>
                    </div>
                  </Link>
                  <Link
                    href="/pricing?tab=points"
                    className="bg-slate-100 hover:bg-slate-200 rounded-xl p-4 flex items-center space-x-4 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                      <i className="fas fa-coins text-accent-purple"></i>
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">Buy Points</p>
                      <p className="text-slate-500 text-sm">Top up your points balance</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Subscription History</h3>

                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-receipt text-4xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500">No subscription history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-slate-100 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${tierConfig[sub.tier]?.gradient} flex items-center justify-center`}>
                            <i className={`fas ${tierConfig[sub.tier]?.icon} text-white text-sm`}></i>
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium">{tierConfig[sub.tier]?.label} Plan</p>
                            <p className="text-slate-500 text-sm">
                              {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[sub.status]}`}>
                            {sub.status}
                          </span>
                          <p className="text-slate-500 text-sm mt-1">${sub.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'points' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Points History</h3>
                  <div className="flex items-center space-x-2 text-slate-500">
                    <i className="fas fa-coins text-accent-blue"></i>
                    <span>Balance: <strong className="text-slate-800">{userStats?.points?.toLocaleString() || 0}</strong></span>
                  </div>
                </div>

                {pointsHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-coins text-4xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500">No points transactions</p>
                    <Link
                      href="/pricing?tab=points"
                      className="inline-block mt-4 px-6 py-2 btn-premium rounded-xl text-white font-medium"
                    >
                      Buy Points
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pointsHistory.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-slate-100 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tx.type === 'CREDIT' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            <i className={`fas ${tx.type === 'CREDIT' ? 'fa-plus' : 'fa-minus'} ${
                              tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                            }`}></i>
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium">{tx.description || tx.type}</p>
                            <p className="text-slate-500 text-sm">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.type === 'CREDIT' ? '+' : '-'}{Math.abs(tx.amount ?? 0).toLocaleString()}
                          </p>
                          <p className="text-slate-400 text-xs">Balance: {(tx.balanceAfter ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
