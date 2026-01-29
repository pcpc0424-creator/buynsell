'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin';
import { apiUrl } from '@/lib/config';

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  tier: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
  image: string | null;
  _count?: {
    listings: number;
    inquiries: number;
  };
}

interface UserStats {
  total: number;
  agents: number;
  active: number;
  premiumGold: number;
}

const roleOptions = ['ALL', 'USER', 'AGENT', 'ADMIN'];
const tierOptions = ['ALL', 'GREEN', 'SILVER', 'GOLD', 'PREMIUM'];

const roleColors: Record<string, string> = {
  USER: 'bg-blue-500/20 text-blue-400',
  AGENT: 'bg-purple-500/20 text-purple-400',
  ADMIN: 'bg-red-500/20 text-red-400',
};

const tierColors: Record<string, string> = {
  GREEN: 'bg-green-500/20 text-green-400',
  SILVER: 'bg-gray-500/20 text-gray-400',
  GOLD: 'bg-yellow-500/20 text-yellow-400',
  PREMIUM: 'bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 text-accent-blue',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ role: '', tier: '', loyaltyPoints: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({ total: 0, agents: 0, active: 0, premiumGold: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      if (roleFilter !== 'ALL') {
        params.set('role', roleFilter);
      }
      if (tierFilter !== 'ALL') {
        params.set('tier', tierFilter);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const res = await fetch(apiUrl(`/api/admin/users?${params.toString()}`));
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      }));

      // Calculate stats
      if (result.counts) {
        setStats({
          total: result.counts.total || 0,
          agents: result.counts.byRole?.AGENT || 0,
          active: result.counts.active || 0,
          premiumGold: (result.counts.byTier?.PREMIUM || 0) + (result.counts.byTier?.GOLD || 0),
        });
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, tierFilter, searchTerm, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      const res = await fetch(apiUrl(`/api/admin/users/${userId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user status');
      }

      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      tier: user.tier,
      loyaltyPoints: user.loyaltyPoints,
    });
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(selectedUser.id);
      const res = await fetch(apiUrl(`/api/admin/users/${selectedUser.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editForm.role,
          tier: editForm.tier,
          loyaltyPoints: editForm.loyaltyPoints,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === selectedUser.id
            ? { ...u, role: editForm.role, tier: editForm.tier, loyaltyPoints: editForm.loyaltyPoints }
            : u
        )
      );

      setSelectedUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <>
        <AdminHeader
          title="Users Management"
          subtitle="Manage user accounts, roles, and tiers"
        />
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Users Management"
        subtitle="Manage user accounts, roles, and tiers"
      />

      <div className="p-8">
        {/* Filters */}
        <div className="glass-ultra rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="form-input pl-12"
                />
              </div>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="form-select"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role === 'ALL' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={tierFilter}
                onChange={(e) => {
                  setTierFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="form-select"
              >
                {tierOptions.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier === 'ALL' ? 'All Tiers' : tier}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-ultra rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-500 text-sm">Total Users</p>
          </div>
          <div className="glass-ultra rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent-purple">{stats.agents}</p>
            <p className="text-slate-500 text-sm">Agents</p>
          </div>
          <div className="glass-ultra rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            <p className="text-slate-500 text-sm">Active</p>
          </div>
          <div className="glass-ultra rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.premiumGold}</p>
            <p className="text-slate-500 text-sm">Premium/Gold</p>
          </div>
        </div>

        {error && (
          <div className="glass-ultra rounded-2xl p-6 mb-6 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button
                onClick={fetchUsers}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="glass-ultra rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-slate-500 text-sm font-medium px-6 py-4">User</th>
                  <th className="text-left text-slate-500 text-sm font-medium px-6 py-4">Contact</th>
                  <th className="text-left text-slate-500 text-sm font-medium px-6 py-4">Role</th>
                  <th className="text-left text-slate-500 text-sm font-medium px-6 py-4">Tier</th>
                  <th className="text-left text-slate-500 text-sm font-medium px-6 py-4">Points</th>
                  <th className="text-left text-slate-500 text-sm font-medium px-6 py-4">Status</th>
                  <th className="text-left text-slate-500 text-sm font-medium px-6 py-4">Joined</th>
                  <th className="text-right text-slate-500 text-sm font-medium px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-200 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || 'User'}
                            width={40}
                            height={40}
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-semibold">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white font-medium">{user.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{user.email}</p>
                      <p className="text-slate-400 text-xs">{user.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${roleColors[user.role] || ''}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${tierColors[user.tier] || ''}`}>
                        {user.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{(user.loyaltyPoints ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-500 text-sm">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-white transition-all"
                          title="Edit User"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          disabled={actionLoading === user.id}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {actionLoading === user.id ? (
                            <i className="fas fa-spinner fa-spin text-sm"></i>
                          ) : (
                            <i className={`fas ${user.isActive ? 'fa-ban' : 'fa-check'} text-sm`}></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <i className="fas fa-users text-4xl text-slate-300 mb-4"></i>
              <p className="text-slate-500">No users found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <p className="text-slate-500 text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-slate-500 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          ></div>
          <div className="relative glass-ultra rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-6">Edit User</h3>

            <div className="flex items-center space-x-4 mb-6">
              {selectedUser.image ? (
                <Image
                  src={selectedUser.image}
                  alt={selectedUser.name || 'User'}
                  width={60}
                  height={60}
                  className="rounded-xl"
                />
              ) : (
                <div className="w-15 h-15 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-xl font-semibold" style={{ width: 60, height: 60 }}>
                  {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-medium">{selectedUser.name || 'N/A'}</p>
                <p className="text-slate-500 text-sm">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="form-select"
                >
                  <option value="USER">User</option>
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Tier</label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tier: e.target.value }))}
                  className="form-select"
                >
                  <option value="GREEN">Green</option>
                  <option value="SILVER">Silver</option>
                  <option value="GOLD">Gold</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Loyalty Points</label>
                <input
                  type="number"
                  value={editForm.loyaltyPoints}
                  onChange={(e) => setEditForm(prev => ({ ...prev, loyaltyPoints: parseInt(e.target.value) || 0 }))}
                  className="form-input"
                  min={0}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 rounded-xl glass-ultra text-white font-medium hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={actionLoading === selectedUser.id}
                className="flex-1 py-3 rounded-xl btn-premium text-white font-medium disabled:opacity-50"
              >
                {actionLoading === selectedUser.id ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
