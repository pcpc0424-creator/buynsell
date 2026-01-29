'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin';

interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  clickCount: number;
  viewCount: number;
  order: number;
  createdAt: string;
}

const positionOptions = [
  { value: 'MAIN_BANNER', label: 'Main Banner', icon: 'fa-tv', description: 'Homepage hero section' },
  { value: 'SIDEBAR', label: 'Sidebar', icon: 'fa-columns', description: 'Side panel ads' },
  { value: 'LIST_TOP', label: 'List Top', icon: 'fa-arrow-up', description: 'Top of property listings' },
  { value: 'LIST_BOTTOM', label: 'List Bottom', icon: 'fa-arrow-down', description: 'Bottom of property listings' },
  { value: 'PROPERTY_DETAIL', label: 'Property Detail', icon: 'fa-building', description: 'Property detail page' },
];

const defaultFormData = {
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: 'MAIN_BANNER',
  isActive: true,
  startDate: '',
  endDate: '',
};

export default function AdsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (positionFilter !== 'ALL') {
        params.set('position', positionFilter);
      }

      const res = await fetch(`/api/admin/advertisements?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch ads');
      }

      setAds(data.data);
      setCounts(data.counts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [positionFilter]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleCreate = () => {
    setEditingAd(null);
    setFormData(defaultFormData);
    setShowModal(true);
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || '',
      position: ad.position,
      isActive: ad.isActive,
      startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (ad: Advertisement) => {
    if (!confirm(`Are you sure you want to delete "${ad.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete ad');
      }

      setSuccess('Advertisement deleted successfully!');
      fetchAds();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update ad');
      }

      fetchAds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setFormData({ ...formData, imageUrl: data.data.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.imageUrl) {
      setError('Title and image are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        linkUrl: formData.linkUrl || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      const url = editingAd
        ? `/api/admin/advertisements/${editingAd.id}`
        : '/api/admin/advertisements';

      const res = await fetch(url, {
        method: editingAd ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save ad');
      }

      setSuccess(editingAd ? 'Advertisement updated!' : 'Advertisement created!');
      setShowModal(false);
      fetchAds();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getPositionLabel = (position: string) => {
    return positionOptions.find((p) => p.value === position)?.label || position;
  };

  const getPositionIcon = (position: string) => {
    return positionOptions.find((p) => p.value === position)?.icon || 'fa-ad';
  };

  if (loading) {
    return (
      <>
        <AdminHeader
          title="Advertisements"
          subtitle="Manage banners and promotional content"
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
        title="Advertisements"
        subtitle="Manage banners and promotional content"
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

        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPositionFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                positionFilter === 'ALL'
                  ? 'bg-accent-blue text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              All ({ads.length})
            </button>
            {positionOptions.map((pos) => (
              <button
                key={pos.value}
                onClick={() => setPositionFilter(pos.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  positionFilter === pos.value
                    ? 'bg-accent-blue text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <i className={`fas ${pos.icon} mr-2`}></i>
                {pos.label} ({counts[pos.value] || 0})
              </button>
            ))}
          </div>

          <button
            onClick={handleCreate}
            className="btn-premium px-6 py-2 rounded-lg text-white font-medium"
          >
            <i className="fas fa-plus mr-2"></i>New Ad
          </button>
        </div>

        {/* Ads Grid */}
        {ads.length === 0 ? (
          <div className="glass-ultra rounded-2xl p-12 text-center">
            <i className="fas fa-ad text-4xl text-white/30 mb-4"></i>
            <p className="text-white/50">No advertisements found</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-2 bg-accent-blue hover:bg-accent-blue/80 rounded-lg text-white font-medium transition-all"
            >
              Create your first ad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className={`glass-ultra rounded-2xl overflow-hidden ${
                  !ad.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <div className="relative aspect-video bg-white/5">
                  {ad.imageUrl && (
                    <Image
                      src={ad.imageUrl}
                      alt={ad.title}
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ad.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {ad.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                      <i className={`fas ${getPositionIcon(ad.position)} mr-1`}></i>
                      {getPositionLabel(ad.position)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 truncate">{ad.title}</h3>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-sm text-white/50 mb-4">
                    <span>
                      <i className="fas fa-eye mr-1"></i>
                      {ad.viewCount.toLocaleString()} views
                    </span>
                    <span>
                      <i className="fas fa-mouse-pointer mr-1"></i>
                      {ad.clickCount.toLocaleString()} clicks
                    </span>
                  </div>

                  {/* Date Range */}
                  {(ad.startDate || ad.endDate) && (
                    <div className="text-xs text-white/40 mb-4">
                      <i className="fas fa-calendar mr-1"></i>
                      {ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'Always'}
                      {' - '}
                      {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'Ongoing'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        ad.isActive
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      <i className={`fas ${ad.isActive ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                      {ad.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(ad)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(ad)}
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-all"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-ultra rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    {editingAd ? 'Edit Advertisement' : 'New Advertisement'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                    placeholder="Ad title"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Image *</label>
                  {formData.imageUrl ? (
                    <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden mb-2">
                      <Image
                        src={formData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-accent-blue/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue mx-auto"></div>
                      ) : (
                        <>
                          <i className="fas fa-cloud-upload-alt text-3xl text-white/30 mb-2"></i>
                          <p className="text-white/50 text-sm">Click to upload image</p>
                        </>
                      )}
                    </label>
                  )}
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="form-input mt-2"
                    placeholder="Or enter image URL"
                  />
                </div>

                {/* Link URL */}
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Link URL</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="form-input"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="form-select"
                  >
                    {positionOptions.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label} - {pos.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Active */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue"
                  />
                  <span className="text-white/70">Active (visible on site)</span>
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
                        <i className="fas fa-save mr-2"></i>
                        {editingAd ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
