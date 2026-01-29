'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AgentHeader } from '@/components/agent';

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
  mainImage: string | null;
  images: { url: string }[];
  createdAt: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  views: number;
  rejectionReason?: string;
}

interface StatusCounts {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
}

const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function AgentListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
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

      const res = await fetch(`/api/listings/my?${params.toString()}`);
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
  }, [statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

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
    return null;
  };

  // Filter listings by search term locally
  const filteredListings = listings.filter((listing) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      listing.title.toLowerCase().includes(search) ||
      listing.city?.toLowerCase().includes(search) ||
      listing.address?.toLowerCase().includes(search)
    );
  });

  if (loading && listings.length === 0) {
    return (
      <>
        <AgentHeader
          title="My Listings"
          subtitle="Manage your property listings"
        />
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-purple"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AgentHeader
        title="My Listings"
        subtitle="Manage your property listings"
      />

      <div className="p-8">
        {/* Stats & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-4">
            <div
              className={`glass-ultra rounded-xl px-6 py-3 text-center cursor-pointer transition-all ${
                statusFilter === 'PENDING' ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            >
              <p className="text-xl font-bold text-yellow-600">{statusCounts.PENDING}</p>
              <p className="text-slate-500 text-xs">Pending</p>
            </div>
            <div
              className={`glass-ultra rounded-xl px-6 py-3 text-center cursor-pointer transition-all ${
                statusFilter === 'APPROVED' ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
            >
              <p className="text-xl font-bold text-green-600">{statusCounts.APPROVED}</p>
              <p className="text-slate-500 text-xs">Active</p>
            </div>
            <div
              className={`glass-ultra rounded-xl px-6 py-3 text-center cursor-pointer transition-all ${
                statusFilter === 'REJECTED' ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
            >
              <p className="text-xl font-bold text-red-600">{statusCounts.REJECTED}</p>
              <p className="text-slate-500 text-xs">Rejected</p>
            </div>
          </div>

          <Link
            href="/agent/listings/new"
            className="btn-premium px-6 py-3 rounded-xl text-slate-800 font-semibold flex items-center justify-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Add New Listing</span>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="glass-ultra rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Search your listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-12"
                />
              </div>
            </div>
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
          </div>
        </div>

        {error && (
          <div className="glass-ultra rounded-2xl p-6 mb-6 border border-red-200">
            <div className="flex items-center text-red-600">
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

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="glass-ultra rounded-2xl overflow-hidden hover:bg-slate-50 transition-all group"
              >
                {/* Image */}
                <div className="relative h-48 bg-slate-100">
                  {getImageUrl(listing) ? (
                    <Image
                      src={getImageUrl(listing)!}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <i className="fas fa-image text-4xl"></i>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[listing.status]}`}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-black/50 text-slate-800">
                      {listing.transactionType === 'SALE' ? 'For Sale' : 'For Rent'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-slate-800 font-semibold text-lg mb-1 truncate">{listing.title}</h3>
                  <p className="text-slate-400 text-sm mb-3 truncate">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {listing.address || `${listing.city}, ${listing.province}`}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-accent-purple font-bold text-lg">{formatPrice(listing.price)}</span>
                    <span className="text-slate-400 text-xs">{formatDate(listing.createdAt)}</span>
                  </div>

                  <div className="flex items-center text-slate-500 text-sm space-x-4 mb-4">
                    {listing.bedrooms > 0 && (
                      <span><i className="fas fa-bed mr-1"></i> {listing.bedrooms}</span>
                    )}
                    {listing.bathrooms > 0 && (
                      <span><i className="fas fa-bath mr-1"></i> {listing.bathrooms}</span>
                    )}
                    <span><i className="fas fa-ruler-combined mr-1"></i> {listing.area}m²</span>
                  </div>

                  {listing.rejectionReason && listing.status === 'REJECTED' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-600 text-xs">
                        <i className="fas fa-exclamation-circle mr-1"></i>
                        {listing.rejectionReason}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Link
                      href={`/listings/${listing.id}`}
                      target="_blank"
                      className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-center text-sm hover:bg-slate-200 transition-colors"
                    >
                      <i className="fas fa-eye mr-1"></i> View
                    </Link>
                    <Link
                      href={`/sell?edit=${listing.id}`}
                      className="flex-1 py-2 rounded-lg bg-accent-purple/20 text-accent-purple text-center text-sm hover:bg-accent-purple/30 transition-colors"
                    >
                      <i className="fas fa-edit mr-1"></i> Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-ultra rounded-2xl p-12 text-center">
            <i className="fas fa-building text-5xl text-slate-300 mb-4"></i>
            <h3 className="text-slate-800 font-semibold text-lg mb-2">No listings found</h3>
            <p className="text-slate-500 mb-6">
              {statusFilter !== 'ALL'
                ? `You don't have any ${statusFilter.toLowerCase()} listings.`
                : 'Start by creating your first property listing.'}
            </p>
            <Link
              href="/sell"
              className="inline-block px-6 py-3 btn-premium rounded-xl text-slate-800 font-semibold"
            >
              <i className="fas fa-plus mr-2"></i>
              Create New Listing
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 glass-ultra rounded-xl px-6 py-4">
            <p className="text-slate-500 text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-slate-600 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
