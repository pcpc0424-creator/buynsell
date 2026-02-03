'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/config';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  tier?: string;
  points?: number;
}

interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string;
  paypalOrderId: string | null;
  amount: number;
  createdAt: string;
  user: User;
  type: 'subscription';
}

interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string | null;
  referenceId: string | null;
  referenceType: string | null;
  balanceAfter: number;
  createdAt: string;
  user: User;
}

interface Stats {
  totalRevenue: number;
  activeSubscriptions: number;
  totalPointsSold: number;
  monthlyRevenue: number;
}

const tierConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  GREEN: { label: 'Green', color: 'text-green-600', bgColor: 'bg-green-100' },
  SILVER: { label: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  GOLD: { label: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  PREMIUM: { label: 'Premium', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
  EXPIRED: { label: 'Expired', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function AdminPaymentsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'subscription' | 'points'>('all');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual grant modal
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantType, setGrantType] = useState<'subscription' | 'points'>('subscription');
  const [grantUserId, setGrantUserId] = useState('');
  const [grantTier, setGrantTier] = useState('SILVER');
  const [grantMonths, setGrantMonths] = useState('1');
  const [grantPoints, setGrantPoints] = useState('100');
  const [grantNote, setGrantNote] = useState('');
  const [granting, setGranting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPayments();
      fetchUsers();
    }
  }, [status, activeTab, search, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: activeTab,
        search,
        status: statusFilter,
      });

      const res = await fetch(apiUrl(`/api/admin/payments?${params}`));
      const data = await res.json();

      if (data.success) {
        setSubscriptions(data.data?.subscriptions || []);
        setPointsTransactions(data.data?.pointsTransactions || []);
        setStats(data.data?.stats || null);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/users?limit=100'));
      const data = await res.json();
      if (data.success) {
        setUsers(data.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleManualGrant = async () => {
    if (!grantUserId) {
      alert('Please select a user');
      return;
    }

    try {
      setGranting(true);
      const body = {
        type: grantType,
        userId: grantUserId,
        tier: grantType === 'subscription' ? grantTier : undefined,
        months: grantType === 'subscription' ? grantMonths : undefined,
        points: grantType === 'points' ? grantPoints : undefined,
        note: grantNote,
      };

      const res = await fetch(apiUrl('/api/admin/payments/manual'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.data.message);
        setShowGrantModal(false);
        setGrantUserId('');
        setGrantNote('');
        fetchPayments();
      } else {
        alert(data.error || 'Failed to grant');
      }
    } catch (error) {
      console.error('Error granting:', error);
      alert('An error occurred');
    } finally {
      setGranting(false);
    }
  };

  const handleUpdateStatus = async (subscriptionId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/payments/${subscriptionId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        fetchPayments();
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Payment Management</h1>
              <p className="text-slate-500 text-sm">Manage subscriptions and point purchases</p>
            </div>
            <button
              onClick={() => setShowGrantModal(true)}
              className="btn-premium text-white px-6 py-2 rounded-lg font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              Manual Grant
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-800">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.activeSubscriptions}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-users text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Points Sold</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalPointsSold.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <i className="fas fa-coins text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">This Month</p>
                  <p className="text-2xl font-bold text-slate-800">${stats.monthlyRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <i className="fas fa-chart-line text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'subscription' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('points')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'points' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Points
              </button>
            </div>

            <div className="flex gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or order ID..."
                  className="w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                />
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              </div>

              {/* Status Filter */}
              {activeTab !== 'points' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Subscriptions */}
            {(activeTab === 'all' || activeTab === 'subscription') && subscriptions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-800">
                    <i className="fas fa-crown text-yellow-500 mr-2"></i>
                    Subscriptions
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {subscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                                {sub.user.image ? (
                                  <img src={sub.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <i className="fas fa-user text-slate-400"></i>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{sub.user.name || 'No name'}</p>
                                <p className="text-slate-500 text-sm">{sub.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierConfig[sub.tier]?.bgColor} ${tierConfig[sub.tier]?.color}`}>
                              {tierConfig[sub.tier]?.label || sub.tier}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[sub.status]?.bgColor} ${statusConfig[sub.status]?.color}`}>
                              {statusConfig[sub.status]?.label || sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-800">
                            {sub.amount > 0 ? `$${sub.amount.toFixed(2)}` : 'Manual'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            <div>{formatDate(sub.startDate)}</div>
                            <div className="text-slate-400">~ {formatDate(sub.endDate)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-500 text-xs font-mono">
                              {sub.paypalOrderId ? sub.paypalOrderId.substring(0, 15) + '...' : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {sub.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleUpdateStatus(sub.id, 'CANCELLED')}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                            {sub.status === 'CANCELLED' && (
                              <button
                                onClick={() => handleUpdateStatus(sub.id, 'ACTIVE')}
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Points Transactions */}
            {(activeTab === 'all' || activeTab === 'points') && pointsTransactions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-800">
                    <i className="fas fa-coins text-purple-500 mr-2"></i>
                    Points Purchases
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Balance After</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pointsTransactions.map((pt) => (
                        <tr key={pt.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                                {pt.user.image ? (
                                  <img src={pt.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <i className="fas fa-user text-slate-400"></i>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{pt.user.name || 'No name'}</p>
                                <p className="text-slate-500 text-sm">{pt.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-green-600 font-semibold">+{pt.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-800">
                            {pt.balanceAfter.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {pt.description || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-500 text-xs font-mono">
                              {pt.referenceId ? pt.referenceId.substring(0, 15) + '...' : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {formatDate(pt.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {subscriptions.length === 0 && pointsTransactions.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <i className="fas fa-receipt text-4xl text-slate-300 mb-4"></i>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No payments found</h3>
                <p className="text-slate-500">Payments will appear here once users make purchases.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Manual Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Manual Grant</h2>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Grant Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={grantType === 'subscription'}
                    onChange={() => setGrantType('subscription')}
                    className="mr-2"
                  />
                  <span>Subscription</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={grantType === 'points'}
                    onChange={() => setGrantType('points')}
                    className="mr-2"
                  />
                  <span>Points</span>
                </label>
              </div>
            </div>

            {/* User Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">User</label>
              <select
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {grantType === 'subscription' ? (
              <>
                {/* Tier */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tier</label>
                  <select
                    value={grantTier}
                    onChange={(e) => setGrantTier(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  >
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>

                {/* Months */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Duration (months)</label>
                  <select
                    value={grantMonths}
                    onChange={(e) => setGrantMonths(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  >
                    <option value="1">1 month</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Points */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Points</label>
                  <input
                    type="number"
                    value={grantPoints}
                    onChange={(e) => setGrantPoints(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Note */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Note (optional)</label>
              <input
                type="text"
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="Reason for manual grant"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowGrantModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualGrant}
                disabled={granting}
                className="flex-1 btn-premium text-white px-4 py-2 rounded-lg"
              >
                {granting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  'Grant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
