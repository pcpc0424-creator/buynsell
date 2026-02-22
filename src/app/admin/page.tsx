'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin';
import { apiUrl } from '@/lib/config';

interface RecentListing {
  id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  agent?: { name: string | null };
}

interface RecentInquiry {
  id: string;
  name: string;
  status: string;
  listing?: { title: string };
  createdAt: string;
  user?: { name: string | null };
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  tier: string;
  createdAt: string;
}

interface DashboardData {
  users: {
    total: number;
    newToday: number;
    newThisMonth: number;
    byRole: Record<string, number>;
    byTier: Record<string, number>;
  };
  listings: {
    total: number;
    byStatus: Record<string, number>;
    newToday: number;
    newThisMonth: number;
    pendingApproval: number;
  };
  inquiries: {
    total: number;
    byStatus: Record<string, number>;
    newToday: number;
    pendingReview: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  recent: {
    listings: RecentListing[];
    inquiries: RecentInquiry[];
    users: RecentUser[];
  };
}

const colorClasses: Record<string, string> = {
  blue: 'from-accent-blue/20 to-accent-blue/5 text-accent-blue',
  purple: 'from-accent-purple/20 to-accent-purple/5 text-accent-purple',
  pink: 'from-accent-pink/20 to-accent-pink/5 text-accent-pink',
  cyan: 'from-accent-cyan/20 to-accent-cyan/5 text-accent-cyan',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  REVIEWED: 'bg-blue-500/20 text-blue-400',
  FORWARDED: 'bg-purple-500/20 text-purple-400',
  CLOSED: 'bg-gray-500/20 text-gray-400',
};

function formatCurrency(value: number | undefined | null): string {
  const num = value ?? 0;
  if (num >= 1000000) {
    return `₱${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `₱${(num / 1000).toFixed(0)}K`;
  }
  return `₱${num.toLocaleString()}`;
}

function formatPrice(value: number | undefined | null): string {
  return `₱${(value ?? 0).toLocaleString()}`;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/admin/dashboard'));
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const stats = data ? [
    {
      label: 'Total Users',
      value: (data.users?.total ?? 0).toLocaleString(),
      change: `+${data.users?.newThisMonth ?? 0} this month`,
      changeType: (data.users?.newThisMonth ?? 0) > 0 ? 'positive' : 'neutral',
      icon: 'fa-users',
      color: 'blue',
    },
    {
      label: 'Active Listings',
      value: (data.listings?.byStatus?.['APPROVED'] ?? 0).toLocaleString(),
      change: `+${data.listings?.newThisMonth ?? 0} this month`,
      changeType: (data.listings?.newThisMonth ?? 0) > 0 ? 'positive' : 'neutral',
      icon: 'fa-building',
      color: 'purple',
    },
    {
      label: 'Pending Approval',
      value: (data.listings?.pendingApproval ?? 0).toString(),
      change: `+${data.listings?.newToday ?? 0} today`,
      changeType: 'neutral',
      icon: 'fa-clock',
      color: 'pink',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(data.revenue?.total ?? 0),
      change: `+${formatCurrency(data.revenue?.thisMonth ?? 0)} this month`,
      changeType: (data.revenue?.thisMonth ?? 0) > 0 ? 'positive' : 'neutral',
      icon: 'fa-peso-sign',
      color: 'cyan',
    },
  ] : [];

  if (loading) {
    return (
      <>
        <AdminHeader
          title="Dashboard"
          subtitle="Welcome back! Here's what's happening with your platform."
        />
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminHeader
          title="Dashboard"
          subtitle="Welcome back! Here's what's happening with your platform."
        />
        <div className="p-8">
          <div className="glass-ultra rounded-2xl p-6 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-lg hover:bg-accent-blue/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your platform."
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-ultra rounded-2xl p-6 hover:bg-slate-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center`}
                >
                  <i className={`fas ${stat.icon} text-lg`}></i>
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive'
                      ? 'text-green-400'
                      : stat.changeType === 'negative'
                      ? 'text-red-400'
                      : 'text-slate-500'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Listings */}
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Pending Listings</h2>
              <Link
                href="/admin/listings?status=PENDING"
                className="text-accent-blue hover:text-accent-purple transition-colors text-sm"
              >
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            <div className="space-y-4">
              {data?.recent.listings && data.recent.listings.length > 0 ? (
                data.recent.listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-800 font-medium truncate">{listing.title}</h4>
                      <p className="text-slate-400 text-sm">by {listing.agent?.name || 'Unknown'}</p>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <span className="text-slate-500 text-sm hidden sm:block">
                        {formatPrice(listing.price)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[listing.status]}`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">No pending listings</p>
              )}
            </div>
          </div>

          {/* Recent Inquiries */}
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Pending Inquiries</h2>
              <Link
                href="/admin/inquiries?status=PENDING"
                className="text-accent-blue hover:text-accent-purple transition-colors text-sm"
              >
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            <div className="space-y-4">
              {data?.recent.inquiries && data.recent.inquiries.length > 0 ? (
                data.recent.inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-800 font-medium">{inquiry.user?.name || inquiry.name}</h4>
                      <p className="text-slate-400 text-sm truncate">Re: {inquiry.listing?.title}</p>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <span className="text-slate-400 text-xs hidden sm:block">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[inquiry.status]}`}>
                        {inquiry.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">No pending inquiries</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/listings?status=PENDING"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-check-circle text-yellow-400 text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">Review Listings</span>
              {data && data.listings.pendingApproval > 0 && (
                <span className="block text-yellow-400 text-xs mt-1">
                  {data.listings.pendingApproval} pending
                </span>
              )}
            </Link>
            <Link
              href="/admin/inquiries?status=PENDING"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-envelope-open text-accent-blue text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">Handle Inquiries</span>
              {data && data.inquiries.pendingReview > 0 && (
                <span className="block text-accent-blue text-xs mt-1">
                  {data.inquiries.pendingReview} pending
                </span>
              )}
            </Link>
            <Link
              href="/admin/users"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-plus text-accent-purple text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">Manage Users</span>
              {data && data.users.newToday > 0 && (
                <span className="block text-accent-purple text-xs mt-1">
                  {data.users.newToday} new today
                </span>
              )}
            </Link>
            <Link
              href="/admin/settings"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-cog text-accent-cyan text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">Settings</span>
            </Link>
          </div>
        </div>

        {/* Recent Users */}
        {data?.recent.users && data.recent.users.length > 0 && (
          <div className="mt-8">
            <div className="glass-ultra rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Recent Registrations</h2>
                <Link
                  href="/admin/users"
                  className="text-accent-blue hover:text-accent-purple transition-colors text-sm"
                >
                  View All <i className="fas fa-arrow-right ml-1"></i>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-200">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Tier</th>
                      <th className="pb-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recent.users.map((user) => (
                      <tr key={user.id} className="text-slate-700">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-slate-800">{user.name || 'N/A'}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'AGENT' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            user.tier === 'PREMIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                            user.tier === 'GOLD' ? 'bg-amber-500/20 text-amber-400' :
                            user.tier === 'SILVER' ? 'bg-gray-400/20 text-gray-300' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {user.tier}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
