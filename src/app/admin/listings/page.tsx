'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/admin';
import { apiUrl, config } from '@/lib/config';

interface Listing {
  id: string;
  title: string;
  address: string;
  city: string;
  province: string;
  price: number;
  propertyType: string;
  transactionType: string;
  status: string;
  agent: { id: string; name: string; email: string };
  mainImage: string | null;
  images: { url: string }[];
  createdAt: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rejectionReason?: string;
  isFeatured?: boolean;
}

interface StatusCounts {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
}

const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const propertyTypes = ['ALL', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'COMMERCIAL', 'LOT', 'NEW_DEVELOPMENT'];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
};

export default function ListingsPage() {
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (typeFilter !== 'ALL') {
        params.set('propertyType', typeFilter);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const res = await fetch(apiUrl(`/api/listings?${params.toString()}`));
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch listings');
      }

      setListings(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      }));

      // Update status counts
      if (result.counts) {
        setStatusCounts({
          PENDING: result.counts.PENDING || 0,
          APPROVED: result.counts.APPROVED || 0,
          REJECTED: result.counts.REJECTED || 0,
        });
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchTerm, pagination.page, pagination.limit]);

  // Fetch status counts separately
  const fetchStatusCounts = async () => {
    try {
      const res = await fetch(apiUrl('/api/listings?limit=1'));
      const result = await res.json();
      if (result.success && result.counts) {
        setStatusCounts({
          PENDING: result.counts.PENDING || 0,
          APPROVED: result.counts.APPROVED || 0,
          REJECTED: result.counts.REJECTED || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    fetchStatusCounts();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(apiUrl(`/api/listings/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve listing');
      }

      // Update local state
      setListings(prev =>
        prev.map(l => (l.id === id ? { ...l, status: 'APPROVED' } : l))
      );
      setStatusCounts(prev => ({
        ...prev,
        PENDING: Math.max(0, prev.PENDING - 1),
        APPROVED: prev.APPROVED + 1,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (id: string) => {
    setSelectedListing(id);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedListing || !rejectReason.trim()) return;

    try {
      setActionLoading(selectedListing);
      const res = await fetch(apiUrl(`/api/listings/${selectedListing}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectReason.trim(),
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject listing');
      }

      // Update local state
      setListings(prev =>
        prev.map(l =>
          l.id === selectedListing
            ? { ...l, status: 'REJECTED', rejectionReason: rejectReason.trim() }
            : l
        )
      );
      setStatusCounts(prev => ({
        ...prev,
        PENDING: Math.max(0, prev.PENDING - 1),
        REJECTED: prev.REJECTED + 1,
      }));

      setShowRejectModal(false);
      setRejectReason('');
      setSelectedListing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (id: string) => {
    setSelectedListing(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedListing) return;

    try {
      setActionLoading(selectedListing);
      const res = await fetch(apiUrl(`/api/listings/${selectedListing}`), {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete listing');
      }

      // Remove from local state
      const deletedListing = listings.find(l => l.id === selectedListing);
      setListings(prev => prev.filter(l => l.id !== selectedListing));

      // Update status counts
      if (deletedListing) {
        setStatusCounts(prev => ({
          ...prev,
          [deletedListing.status]: Math.max(0, prev[deletedListing.status as keyof StatusCounts] - 1),
        }));
      }

      setShowDeleteModal(false);
      setSelectedListing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeature = async (listing: Listing) => {
    if (listing.isFeatured) {
      // 이미 Featured인 경우 Featured 관리 페이지로 이동
      window.location.href = `${config.basePath}/admin/featured`;
      return;
    }

    try {
      setActionLoading(listing.id);
      const res = await fetch(apiUrl('/api/admin/featured-listings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add to featured');
      }

      // Update local state
      setListings(prev =>
        prev.map(l => (l.id === listing.id ? { ...l, isFeatured: true } : l))
      );

      alert('메인에 노출되도록 설정되었습니다!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getImageUrl = (listing: Listing) => {
    if (listing.mainImage) return listing.mainImage;
    if (listing.images && listing.images.length > 0) return listing.images[0].url;
    return `${config.basePath}/images/placeholder-property.svg`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchListings();
  };

  if (loading && listings.length === 0) {
    return (
      <>
        <AdminHeader
          title="Listings Management"
          subtitle="Review and manage property listings"
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
        title="Listings Management"
        subtitle="Review and manage property listings"
      />

      <div className="p-8">
        {/* Filters */}
        <div className="glass-ultra rounded-2xl p-6 mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Search listings, agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-12"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="form-select"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All Status' : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="form-select"
              >
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Types' : type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            className={`glass-ultra rounded-xl p-4 text-center cursor-pointer transition-all ${
              statusFilter === 'PENDING' ? 'ring-2 ring-yellow-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          >
            <p className="text-2xl font-bold text-yellow-400">{statusCounts.PENDING}</p>
            <p className="text-slate-500 text-sm">Pending</p>
          </div>
          <div
            className={`glass-ultra rounded-xl p-4 text-center cursor-pointer transition-all ${
              statusFilter === 'APPROVED' ? 'ring-2 ring-green-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          >
            <p className="text-2xl font-bold text-green-400">{statusCounts.APPROVED}</p>
            <p className="text-slate-500 text-sm">Approved</p>
          </div>
          <div
            className={`glass-ultra rounded-xl p-4 text-center cursor-pointer transition-all ${
              statusFilter === 'REJECTED' ? 'ring-2 ring-red-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
          >
            <p className="text-2xl font-bold text-red-400">{statusCounts.REJECTED}</p>
            <p className="text-slate-500 text-sm">Rejected</p>
          </div>
        </div>

        {error && (
          <div className="glass-ultra rounded-2xl p-6 mb-6 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button
                onClick={fetchListings}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Listings Cards */}
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="glass-ultra rounded-2xl p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-start space-x-4">
                {/* Image */}
                <div className="relative w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                  <Image
                    src={getImageUrl(listing)}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${config.basePath}/images/placeholder-property.svg`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-slate-800 font-semibold truncate">{listing.title}</h4>
                      <p className="text-slate-400 text-sm truncate">
                        {listing.address || listing.city}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap ${
                        statusColors[listing.status] || 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-3">
                    <span className="font-semibold text-slate-800">{formatPrice(listing.price)}</span>
                    <span>•</span>
                    <span>{listing.propertyType}</span>
                    <span>•</span>
                    <span>{listing.agent?.name || 'N/A'}</span>
                    <span>•</span>
                    <span>{formatDate(listing.createdAt)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/properties/${listing.transactionType.toLowerCase()}/${listing.id}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium transition-all"
                    >
                      보기
                    </Link>
                    {listing.status === 'APPROVED' && (
                      <button
                        onClick={() => handleFeature(listing)}
                        disabled={actionLoading === listing.id}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                          listing.isFeatured
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {actionLoading === listing.id ? '...' : (listing.isFeatured ? '메인노출중' : '메인노출')}
                      </button>
                    )}
                    {listing.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(listing.id)}
                          disabled={actionLoading === listing.id}
                          className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-sm font-medium transition-all disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(listing.id)}
                          disabled={actionLoading === listing.id}
                          className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm font-medium transition-all disabled:opacity-50"
                        >
                          거절
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={actionLoading === listing.id}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium transition-all disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {listings.length === 0 && !loading && (
          <div className="glass-ultra rounded-2xl text-center py-12">
            <p className="text-slate-500">리스팅이 없습니다</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 glass-ultra rounded-2xl px-6 py-4">
            <p className="text-slate-500 text-sm">
              {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-slate-500 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          ></div>
          <div className="relative glass-ultra rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Reject Listing</h3>
            <p className="text-slate-500 text-sm mb-4">
              Please provide a reason for rejecting this listing.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="form-textarea mb-4"
              rows={4}
            ></textarea>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedListing(null);
                }}
                className="flex-1 py-3 rounded-xl glass-ultra text-slate-800 font-medium hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || actionLoading === selectedListing}
                className="flex-1 py-3 rounded-xl bg-red-500 text-slate-800 font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedListing ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          ></div>
          <div className="relative glass-ultra rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Delete Listing</h3>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to delete this listing? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedListing(null);
                }}
                className="flex-1 py-3 rounded-xl glass-ultra text-slate-800 font-medium hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading === selectedListing}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedListing ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
