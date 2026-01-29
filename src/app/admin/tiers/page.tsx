'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin';
import { apiUrl } from '@/lib/config';

interface TierPolicy {
  id: string;
  tier: string;
  dailyViewLimit: number;
  monthlyViewLimit: number;
  listingLimit: number;
  maxViewablePrice: number | null;
  monthlySubscriptionPrice: number | null;
  pointsPerView: number;
  pointsPerListing: number;
  description: string | null;
  userCount?: number;
}

const tierConfig: Record<string, { label: string; color: string; icon: string }> = {
  GREEN: { label: 'Green (Free)', color: 'from-green-500 to-emerald-600', icon: 'fa-leaf' },
  SILVER: { label: 'Silver', color: 'from-gray-400 to-gray-500', icon: 'fa-medal' },
  GOLD: { label: 'Gold', color: 'from-yellow-400 to-amber-500', icon: 'fa-crown' },
  PREMIUM: { label: 'Premium', color: 'from-purple-500 to-indigo-600', icon: 'fa-gem' },
};

export default function TierPoliciesPage() {
  const [policies, setPolicies] = useState<TierPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TierPolicy>>({});

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl('/api/admin/tier-policies'));
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch policies');
      }

      setPolicies(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (policy: TierPolicy) => {
    setEditingTier(policy.tier);
    setEditForm({
      dailyViewLimit: policy.dailyViewLimit,
      monthlyViewLimit: policy.monthlyViewLimit,
      listingLimit: policy.listingLimit,
      maxViewablePrice: policy.maxViewablePrice,
      monthlySubscriptionPrice: policy.monthlySubscriptionPrice,
      pointsPerView: policy.pointsPerView,
      pointsPerListing: policy.pointsPerListing,
      description: policy.description,
    });
  };

  const handleSave = async () => {
    if (!editingTier) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(apiUrl('/api/admin/tier-policies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policies: [{
            tier: editingTier,
            ...editForm,
          }],
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save policy');
      }

      setSuccess('Policy saved successfully!');
      setEditingTier(null);
      fetchPolicies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingTier(null);
    setEditForm({});
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  const formatPrice = (value: number | null) => {
    return value === null ? 'N/A' : `$${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <>
        <AdminHeader
          title="Tier Policies"
          subtitle="Manage user tier limits and pricing"
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
        title="Tier Policies"
        subtitle="Manage user tier limits and pricing"
      />

      <div className="p-8">
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

        {/* Tier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {policies.map((policy) => {
            const config = tierConfig[policy.tier];
            const isEditing = editingTier === policy.tier;

            return (
              <div
                key={policy.id}
                className="glass-ultra rounded-2xl overflow-hidden"
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${config.color} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
                        <i className={`fas ${config.icon} text-white text-xl`}></i>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{config.label}</h3>
                        <p className="text-slate-600 text-sm">{policy.userCount || 0} users</p>
                      </div>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => handleEdit(policy)}
                        className="px-4 py-2 bg-slate-200 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all"
                      >
                        <i className="fas fa-edit mr-2"></i>Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Daily View Limit */}
                      <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">
                          Daily View Limit
                          <span className="text-slate-400 ml-2">(-1 = unlimited)</span>
                        </label>
                        <input
                          type="number"
                          value={editForm.dailyViewLimit ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, dailyViewLimit: parseInt(e.target.value) || 0 })}
                          className="form-input"
                          min={-1}
                        />
                      </div>

                      {/* Monthly View Limit */}
                      <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">
                          Monthly View Limit
                          <span className="text-slate-400 ml-2">(-1 = unlimited)</span>
                        </label>
                        <input
                          type="number"
                          value={editForm.monthlyViewLimit ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, monthlyViewLimit: parseInt(e.target.value) || 0 })}
                          className="form-input"
                          min={-1}
                        />
                      </div>

                      {/* Listing Limit */}
                      <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">
                          Listing Limit (Agents)
                        </label>
                        <input
                          type="number"
                          value={editForm.listingLimit ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, listingLimit: parseInt(e.target.value) || 0 })}
                          className="form-input"
                          min={0}
                        />
                      </div>

                      {/* Max Viewable Price */}
                      <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">
                          Max Viewable Price (PHP)
                          <span className="text-slate-400 ml-2">(empty = no limit)</span>
                        </label>
                        <input
                          type="number"
                          value={editForm.maxViewablePrice ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, maxViewablePrice: e.target.value ? parseFloat(e.target.value) : null })}
                          className="form-input"
                          min={0}
                          placeholder="No limit"
                        />
                      </div>

                      {/* Subscription Price */}
                      <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">
                          Monthly Subscription Price (USD)
                        </label>
                        <input
                          type="number"
                          value={editForm.monthlySubscriptionPrice ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, monthlySubscriptionPrice: e.target.value ? parseFloat(e.target.value) : null })}
                          className="form-input"
                          min={0}
                          step={0.01}
                          placeholder="Free tier"
                        />
                      </div>

                      {/* Points Per View */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 text-sm font-medium mb-2">
                            Points Per View
                          </label>
                          <input
                            type="number"
                            value={editForm.pointsPerView ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, pointsPerView: parseInt(e.target.value) || 0 })}
                            className="form-input"
                            min={0}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 text-sm font-medium mb-2">
                            Points Per Listing
                          </label>
                          <input
                            type="number"
                            value={editForm.pointsPerListing ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, pointsPerListing: parseInt(e.target.value) || 0 })}
                            className="form-input"
                            min={0}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">
                          Description
                        </label>
                        <textarea
                          value={editForm.description ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="form-textarea"
                          rows={2}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="btn-premium px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save mr-2"></i>Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-6 py-2 bg-slate-200 hover:bg-slate-200 rounded-lg text-white font-medium transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* View Limits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-100 rounded-xl p-4">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Daily Views</p>
                          <p className="text-slate-800 font-semibold text-lg">{formatLimit(policy.dailyViewLimit)}</p>
                        </div>
                        <div className="bg-slate-100 rounded-xl p-4">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Monthly Views</p>
                          <p className="text-slate-800 font-semibold text-lg">{formatLimit(policy.monthlyViewLimit)}</p>
                        </div>
                      </div>

                      {/* Other Limits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-100 rounded-xl p-4">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Listing Limit</p>
                          <p className="text-slate-800 font-semibold text-lg">{formatLimit(policy.listingLimit)}</p>
                        </div>
                        <div className="bg-slate-100 rounded-xl p-4">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Max Price</p>
                          <p className="text-slate-800 font-semibold text-lg">
                            {policy.maxViewablePrice ? `₱${policy.maxViewablePrice.toLocaleString()}` : 'No limit'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-100 rounded-xl p-4">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Subscription</p>
                          <p className="text-slate-800 font-semibold text-lg">{formatPrice(policy.monthlySubscriptionPrice)}/mo</p>
                        </div>
                        <div className="bg-slate-100 rounded-xl p-4">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Points/View</p>
                          <p className="text-slate-800 font-semibold text-lg">{policy.pointsPerView} pts</p>
                        </div>
                      </div>

                      {/* Description */}
                      {policy.description && (
                        <div className="bg-slate-100 rounded-xl p-4">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Description</p>
                          <p className="text-slate-600 text-sm">{policy.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-8 glass-ultra rounded-2xl p-6">
          <h3 className="text-slate-800 font-semibold mb-4">
            <i className="fas fa-info-circle text-accent-blue mr-2"></i>
            Policy Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-slate-800 font-medium mb-1">View Limits</p>
              <p className="text-slate-500">Number of property details a user can view. Set -1 for unlimited.</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-slate-800 font-medium mb-1">Listing Limit</p>
              <p className="text-slate-500">Maximum properties an agent can list. Only applies to AGENT role.</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-slate-800 font-medium mb-1">Max Viewable Price</p>
              <p className="text-slate-500">Users can only see properties up to this price. Leave empty for no limit.</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-slate-800 font-medium mb-1">Subscription Price</p>
              <p className="text-slate-500">Monthly fee to upgrade to this tier (in USD).</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-slate-800 font-medium mb-1">Points Per View</p>
              <p className="text-slate-500">Points deducted when viewing property details.</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-slate-800 font-medium mb-1">Points Per Listing</p>
              <p className="text-slate-500">Points required for agents to list a property.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
