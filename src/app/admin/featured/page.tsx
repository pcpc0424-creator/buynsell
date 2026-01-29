'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin';

interface Listing {
  id: string;
  title: string;
  mainImage: string | null;
  price: number;
  transactionType: string;
  propertyType: string;
  city: string;
  status: string;
  agent: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface FeaturedListing {
  id: string;
  listingId: string;
  position: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  listing: Listing;
}

export default function FeaturedListingsPage() {
  const [featured, setFeatured] = useState<FeaturedListing[]>([]);
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedListing | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [editForm, setEditForm] = useState({
    position: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      }

      const res = await fetch(`/api/admin/featured-listings?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch featured listings');
      }

      setFeatured(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchAvailableListings = useCallback(async () => {
    try {
      const res = await fetch('/api/listings?status=APPROVED&limit=100');
      const data = await res.json();

      if (data.success) {
        // Filter out already featured listings
        const featuredIds = featured.map((f) => f.listingId);
        const available = data.data.filter((l: Listing) => !featuredIds.includes(l.id));
        setAvailableListings(available);
      }
    } catch (err) {
      console.error('Failed to fetch available listings:', err);
    }
  }, [featured]);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableListings();
    }
  }, [showAddModal, fetchAvailableListings]);

  const handleAddToFeatured = async (listingId: string) => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch('/api/admin/featured-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add to featured');
      }

      setSuccess('Listing added to featured!');
      setShowAddModal(false);
      fetchFeatured();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromFeatured = async (item: FeaturedListing) => {
    if (!confirm(`Remove "${item.listing.title}" from featured listings?`)) return;

    try {
      const res = await fetch(`/api/admin/featured-listings/${item.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove from featured');
      }

      setSuccess('Listing removed from featured!');
      fetchFeatured();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleActive = async (item: FeaturedListing) => {
    try {
      const res = await fetch(`/api/admin/featured-listings/${item.id}`, {
        method: 'PATCH',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to toggle status');
      }

      fetchFeatured();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (item: FeaturedListing) => {
    setEditingItem(item);
    setEditForm({
      position: item.position,
      isActive: item.isActive,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        position: editForm.position,
        isActive: editForm.isActive,
      };

      if (editForm.startDate) {
        payload.startDate = new Date(editForm.startDate).toISOString();
      }
      if (editForm.endDate) {
        payload.endDate = new Date(editForm.endDate).toISOString();
      } else {
        payload.endDate = null;
      }

      const res = await fetch(`/api/admin/featured-listings/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update');
      }

      setSuccess('Featured listing updated!');
      setShowEditModal(false);
      setEditingItem(null);
      fetchFeatured();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    await reorderItems(index, index - 1);
  };

  const handleMoveDown = async (index: number) => {
    if (index === featured.length - 1) return;
    await reorderItems(index, index + 1);
  };

  const reorderItems = async (fromIndex: number, toIndex: number) => {
    try {
      const newFeatured = [...featured];
      const [moved] = newFeatured.splice(fromIndex, 1);
      newFeatured.splice(toIndex, 0, moved);

      // Update positions
      const order = newFeatured.map((item, idx) => ({
        id: item.id,
        position: idx,
      }));

      const res = await fetch('/api/admin/featured-listings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to reorder');
      }

      fetchFeatured();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredAvailable = availableListings.filter(
    (l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = featured.filter((f) => f.isActive).length;
  const inactiveCount = featured.filter((f) => !f.isActive).length;

  if (loading) {
    return (
      <>
        <AdminHeader
          title="Featured Listings"
          subtitle="Manage prominently displayed properties"
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
        title="Featured Listings"
        subtitle="Manage prominently displayed properties"
      />

      <div className="p-8">
        {error && (
          <div className="glass-ultra rounded-2xl p-4 mb-6 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-white/50 hover:text-white">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Total Featured</p>
                <p className="text-3xl font-bold text-white mt-1">{featured.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <i className="fas fa-star text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Active</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{activeCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <i className="fas fa-check text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Inactive</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{inactiveCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <i className="fas fa-pause text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-accent-blue text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              All ({featured.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <i className="fas fa-check mr-2"></i>Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <i className="fas fa-pause mr-2"></i>Inactive
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-premium px-6 py-2 rounded-lg text-white font-medium"
          >
            <i className="fas fa-plus mr-2"></i>Add Featured
          </button>
        </div>

        {/* Featured List */}
        {featured.length === 0 ? (
          <div className="glass-ultra rounded-2xl p-12 text-center">
            <i className="fas fa-star text-4xl text-white/30 mb-4"></i>
            <p className="text-white/50">No featured listings</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-2 bg-accent-blue hover:bg-accent-blue/80 rounded-lg text-white font-medium transition-all"
            >
              Add your first featured listing
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {featured.map((item, index) => (
              <div
                key={item.id}
                className={`glass-ultra rounded-2xl overflow-hidden transition-all ${
                  !item.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Position & Reorder */}
                  <div className="flex md:flex-col items-center justify-center p-4 bg-white/5 border-b md:border-b-0 md:border-r border-white/10">
                    <span className="text-2xl font-bold text-accent-blue mr-4 md:mr-0 md:mb-2">
                      #{index + 1}
                    </span>
                    <div className="flex md:flex-col gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-lg bg-white/10 text-white/50 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <i className="fas fa-chevron-up"></i>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === featured.length - 1}
                        className="w-8 h-8 rounded-lg bg-white/10 text-white/50 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <i className="fas fa-chevron-down"></i>
                      </button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0 bg-white/5">
                    <Image
                      src={item.listing.mainImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'}
                      alt={item.listing.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {item.listing.title}
                        </h3>
                        <p className="text-white/50 text-sm mb-2">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {item.listing.city}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.listing.transactionType === 'SALE'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {item.listing.transactionType === 'SALE' ? 'For Sale' : 'For Rent'}
                          </span>
                          <span className="text-white/50">
                            {item.listing.propertyType.replace('_', ' ')}
                          </span>
                          <span className="text-accent-blue font-semibold">
                            {formatPrice(item.listing.price)}
                          </span>
                        </div>

                        {/* Agent */}
                        <div className="flex items-center mt-3 text-sm text-white/50">
                          <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                            <Image
                              src={item.listing.agent.image || '/images/default-avatar.png'}
                              alt={item.listing.agent.name || 'Agent'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span>{item.listing.agent.name}</span>
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="text-sm text-white/40">
                        <p>
                          <i className="fas fa-calendar-plus mr-1"></i>
                          Start: {new Date(item.startDate).toLocaleDateString()}
                        </p>
                        {item.endDate && (
                          <p>
                            <i className="fas fa-calendar-minus mr-1"></i>
                            End: {new Date(item.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center justify-center gap-2 p-4 border-t md:border-t-0 md:border-l border-white/10">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        item.isActive
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      <i className={`fas ${item.isActive ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                      {item.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all"
                    >
                      <i className="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button
                      onClick={() => handleRemoveFromFeatured(item)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-all"
                    >
                      <i className="fas fa-times mr-1"></i>Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Featured Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-ultra rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Add Featured Listing</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                {/* Search */}
                <div className="mt-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search listings..."
                      className="form-input pl-10"
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/30"></i>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {filteredAvailable.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-home text-4xl text-white/30 mb-4"></i>
                    <p className="text-white/50">No available listings to feature</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAvailable.map((listing) => (
                      <div
                        key={listing.id}
                        className="flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                        onClick={() => handleAddToFeatured(listing.id)}
                      >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={listing.mainImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{listing.title}</h4>
                          <p className="text-white/50 text-sm truncate">{listing.city}</p>
                          <p className="text-accent-blue text-sm font-medium">
                            {formatPrice(listing.price)}
                          </p>
                        </div>
                        <button
                          disabled={saving}
                          className="ml-4 px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {saving ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <>
                              <i className="fas fa-plus mr-1"></i>Add
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-ultra rounded-2xl w-full max-w-md">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Edit Featured Listing</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingItem(null);
                    }}
                    className="text-white/50 hover:text-white"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {/* Listing Info */}
                <div className="flex items-center p-3 bg-white/5 rounded-xl">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={editingItem.listing.mainImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'}
                      alt={editingItem.listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{editingItem.listing.title}</h4>
                    <p className="text-white/50 text-sm">{editingItem.listing.city}</p>
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Position</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                  <p className="text-white/40 text-xs mt-1">Lower numbers appear first</p>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Active */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue"
                  />
                  <span className="text-white/70">Active (visible on homepage)</span>
                </label>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-premium flex-1 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingItem(null);
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
