'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/admin';

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

      const res = await fetch(`/api/listings?${params.toString()}`);
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
      const res = await fetch('/api/listings?limit=1');
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
      const res = await fetch(`/api/listings/${id}/status`, {
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
      const res = await fetch(`/api/listings/${selectedListing}/status`, {
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
    return '/images/placeholder-property.jpg';
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
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
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
            <p className="text-white/50 text-sm">Pending</p>
          </div>
          <div
            className={`glass-ultra rounded-xl p-4 text-center cursor-pointer transition-all ${
              statusFilter === 'APPROVED' ? 'ring-2 ring-green-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          >
            <p className="text-2xl font-bold text-green-400">{statusCounts.APPROVED}</p>
            <p className="text-white/50 text-sm">Approved</p>
          </div>
          <div
            className={`glass-ultra rounded-xl p-4 text-center cursor-pointer transition-all ${
              statusFilter === 'REJECTED' ? 'ring-2 ring-red-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
          >
            <p className="text-2xl font-bold text-red-400">{statusCounts.REJECTED}</p>
            <p className="text-white/50 text-sm">Rejected</p>
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

        {/* Listings Table */}
        <div className="glass-ultra rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/50 text-sm font-medium px-6 py-4">Property</th>
                  <th className="text-left text-white/50 text-sm font-medium px-6 py-4">Agent</th>
                  <th className="text-left text-white/50 text-sm font-medium px-6 py-4">Type</th>
                  <th className="text-left text-white/50 text-sm font-medium px-6 py-4">Price</th>
                  <th className="text-left text-white/50 text-sm font-medium px-6 py-4">Status</th>
                  <th className="text-left text-white/50 text-sm font-medium px-6 py-4">Date</th>
                  <th className="text-right text-white/50 text-sm font-medium px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                          <Image
                            src={getImageUrl(listing)}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder-property.jpg';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-medium truncate">{listing.title}</h4>
                          <p className="text-white/40 text-sm truncate">
                            {listing.address || `${listing.city}, ${listing.province}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{listing.agent?.name || 'N/A'}</p>
                      <p className="text-white/40 text-xs">{listing.agent?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 text-sm">{listing.propertyType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{formatPrice(listing.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          statusColors[listing.status] || 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {listing.status}
                      </span>
                      {listing.rejectionReason && (
                        <p className="text-red-400/60 text-xs mt-1 truncate max-w-[120px]" title={listing.rejectionReason}>
                          {listing.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/50 text-sm">{formatDate(listing.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/listings/${listing.id}`}
                          target="_blank"
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all"
                          title="View Details"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </Link>
                        {listing.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(listing.id)}
                              disabled={actionLoading === listing.id}
                              className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                              title="Approve"
                            >
                              {actionLoading === listing.id ? (
                                <i className="fas fa-spinner fa-spin text-sm"></i>
                              ) : (
                                <i className="fas fa-check text-sm"></i>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(listing.id)}
                              disabled={actionLoading === listing.id}
                              className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                              title="Reject"
                            >
                              <i className="fas fa-times text-sm"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {listings.length === 0 && !loading && (
            <div className="text-center py-12">
              <i className="fas fa-building text-4xl text-white/20 mb-4"></i>
              <p className="text-white/50">No listings found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-white/50 text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-white/60 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          ></div>
          <div className="relative glass-ultra rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Reject Listing</h3>
            <p className="text-white/60 text-sm mb-4">
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
                className="flex-1 py-3 rounded-xl glass-ultra text-white font-medium hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || actionLoading === selectedListing}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}
