'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin';
import { apiUrl, config } from '@/lib/config';

interface Agent {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  tier: string;
  isActive: boolean;
  createdAt: string;
  image: string | null;
  agentProfile?: {
    bio: string | null;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    yearsExperience: number;
  } | null;
  _count?: {
    listings: number;
  };
}

const tierColors: Record<string, string> = {
  GREEN: 'bg-green-100 text-green-700',
  SILVER: 'bg-gray-100 text-gray-700',
  GOLD: 'bg-yellow-100 text-yellow-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      params.set('role', 'AGENT');

      if (tierFilter !== 'ALL') {
        params.set('tier', tierFilter);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const res = await fetch(apiUrl(`/api/admin/users?${params.toString()}`));
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch agents');
      }

      setAgents(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, tierFilter, searchTerm]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAgents();
  };

  return (
    <>
      <AdminHeader title="Agents Management" subtitle="View and manage real estate agents" />
      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Agents</p>
                <p className="text-2xl font-bold text-slate-800">{pagination.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                <i className="fas fa-user-tie text-accent-blue text-xl"></i>
              </div>
            </div>
          </div>
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Verified</p>
                <p className="text-2xl font-bold text-slate-800">
                  {agents.filter(a => a.agentProfile?.isVerified).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <i className="fas fa-check-circle text-green-500 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Premium/Gold</p>
                <p className="text-2xl font-bold text-slate-800">
                  {agents.filter(a => a.tier === 'PREMIUM' || a.tier === 'GOLD').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <i className="fas fa-crown text-yellow-500 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Active</p>
                <p className="text-2xl font-bold text-slate-800">
                  {agents.filter(a => a.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <i className="fas fa-bolt text-purple-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-ultra rounded-2xl p-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-12"
                />
              </div>
            </div>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="form-select w-auto"
            >
              <option value="ALL">All Tiers</option>
              <option value="GREEN">Green</option>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
              <option value="PREMIUM">Premium</option>
            </select>
            <button type="submit" className="btn-premium px-6 py-2 rounded-xl text-white">
              Search
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {/* Agents List */}
        <div className="glass-ultra rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue mx-auto"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-user-tie text-4xl text-slate-300 mb-4"></i>
              <p className="text-slate-500">No agents found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Agent</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Tier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Listings</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={agent.image || `${config.basePath}/images/default-avatar.svg`}
                            alt={agent.name || 'Agent'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-slate-800 font-medium flex items-center gap-2">
                            {agent.name || 'Unnamed'}
                            {agent.agentProfile?.isVerified && (
                              <i className="fas fa-check-circle text-accent-blue text-sm"></i>
                            )}
                          </p>
                          <p className="text-slate-500 text-sm">
                            {agent.agentProfile?.yearsExperience || 0} years exp.
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 text-sm">{agent.email}</p>
                      <p className="text-slate-500 text-sm">{agent.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierColors[agent.tier] || 'bg-gray-100 text-gray-700'}`}>
                        {agent.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-star text-yellow-400"></i>
                        <span className="text-slate-800">
                          {agent.agentProfile?.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-slate-400 text-sm">
                          ({agent.agentProfile?.reviewCount || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-800">{agent._count?.listings || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-slate-500 text-sm">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} agents
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-50"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-50"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
