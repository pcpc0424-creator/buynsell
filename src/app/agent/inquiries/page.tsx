'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AgentHeader } from '@/components/agent';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  listing: {
    id: string;
    title: string;
    mainImage: string | null;
    price: number;
  };
  user: { id: string; name: string | null; email: string; image: string | null } | null;
  status: string;
  createdAt: string;
  forwardedAt: string | null;
}

const statusOptions = ['ALL', 'FORWARDED', 'CLOSED'];

const statusColors: Record<string, string> = {
  FORWARDED: 'bg-purple-500/20 text-purple-400',
  CLOSED: 'bg-gray-500/20 text-gray-400',
};

export default function AgentInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/inquiries?${params.toString()}`);
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inquiries');
      }

      setInquiries(result.data);
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
  }, [statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleMarkAsClosed = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update inquiry');
      }

      setInquiries(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'CLOSED' } : i))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter inquiries by search term locally
  const filteredInquiries = inquiries.filter((inquiry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inquiry.name.toLowerCase().includes(search) ||
      inquiry.email.toLowerCase().includes(search) ||
      inquiry.listing.title.toLowerCase().includes(search)
    );
  });

  const newInquiriesCount = inquiries.filter(i => i.status === 'FORWARDED').length;

  if (loading && inquiries.length === 0) {
    return (
      <>
        <AgentHeader
          title="Inquiries"
          subtitle="View and respond to property inquiries"
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
        title="Inquiries"
        subtitle="View and respond to property inquiries"
      />

      <div className="p-8">
        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div
            className={`glass-ultra rounded-xl px-6 py-3 cursor-pointer transition-all ${
              statusFilter === 'FORWARDED' ? 'ring-2 ring-purple-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'FORWARDED' ? 'ALL' : 'FORWARDED')}
          >
            <p className="text-xl font-bold text-purple-400">{newInquiriesCount}</p>
            <p className="text-white/50 text-xs">New Inquiries</p>
          </div>
          <div
            className={`glass-ultra rounded-xl px-6 py-3 cursor-pointer transition-all ${
              statusFilter === 'CLOSED' ? 'ring-2 ring-gray-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'CLOSED' ? 'ALL' : 'CLOSED')}
          >
            <p className="text-xl font-bold text-gray-400">
              {inquiries.filter(i => i.status === 'CLOSED').length}
            </p>
            <p className="text-white/50 text-xs">Closed</p>
          </div>
          <div className="glass-ultra rounded-xl px-6 py-3">
            <p className="text-xl font-bold text-white">{pagination.total}</p>
            <p className="text-white/50 text-xs">Total</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="glass-ultra rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input
                  type="text"
                  placeholder="Search by name, email, or property..."
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
                    {status === 'ALL' ? 'All Inquiries' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="glass-ultra rounded-2xl p-6 mb-6 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button
                onClick={fetchInquiries}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Inquiries List */}
        {filteredInquiries.length > 0 ? (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="glass-ultra rounded-2xl p-6 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Property Info */}
                  <div className="flex items-center space-x-4 lg:w-64 flex-shrink-0">
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-white/5">
                      {inquiry.listing.mainImage ? (
                        <Image
                          src={inquiry.listing.mainImage}
                          alt={inquiry.listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-medium text-sm truncate">{inquiry.listing.title}</h4>
                      <p className="text-accent-purple text-sm font-semibold">{formatPrice(inquiry.listing.price)}</p>
                    </div>
                  </div>

                  {/* Inquiry Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {inquiry.user?.image ? (
                          <Image
                            src={inquiry.user.image}
                            alt={inquiry.name}
                            width={40}
                            height={40}
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-semibold text-sm">
                            {inquiry.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-white font-medium">{inquiry.name}</h4>
                          <p className="text-white/40 text-sm">{inquiry.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-white/30 text-xs hidden sm:block">{formatDate(inquiry.createdAt)}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[inquiry.status] || ''}`}>
                          {inquiry.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] rounded-xl p-4 mb-4">
                      <p className="text-white/70 text-sm">{inquiry.message}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-white/40 text-sm">
                        {inquiry.phone && (
                          <a href={`tel:${inquiry.phone}`} className="hover:text-white transition-colors">
                            <i className="fas fa-phone mr-1"></i>
                            {inquiry.phone}
                          </a>
                        )}
                        <a href={`mailto:${inquiry.email}`} className="hover:text-white transition-colors">
                          <i className="fas fa-envelope mr-1"></i>
                          Email
                        </a>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
                        >
                          <i className="fas fa-expand mr-1"></i> View Full
                        </button>
                        {inquiry.status === 'FORWARDED' && (
                          <button
                            onClick={() => handleMarkAsClosed(inquiry.id)}
                            disabled={actionLoading === inquiry.id}
                            className="px-4 py-2 rounded-lg bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 transition-all text-sm disabled:opacity-50"
                          >
                            {actionLoading === inquiry.id ? (
                              <i className="fas fa-spinner fa-spin mr-1"></i>
                            ) : (
                              <i className="fas fa-check mr-1"></i>
                            )}
                            Mark as Handled
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-ultra rounded-2xl p-12 text-center">
            <i className="fas fa-envelope text-5xl text-white/20 mb-4"></i>
            <h3 className="text-white font-semibold text-lg mb-2">No inquiries yet</h3>
            <p className="text-white/50 mb-6">
              {statusFilter !== 'ALL'
                ? `No ${statusFilter.toLowerCase()} inquiries found.`
                : 'When customers inquire about your listings, they will appear here.'}
            </p>
            <Link
              href="/agent/listings"
              className="inline-block px-6 py-3 bg-white/5 rounded-xl text-white/70 hover:bg-white/10 transition-colors"
            >
              View Your Listings
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 glass-ultra rounded-xl px-6 py-4">
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

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedInquiry(null)}
          ></div>
          <div className="relative glass-ultra rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <i className="fas fa-times"></i>
            </button>

            <h3 className="text-xl font-semibold text-white mb-6">Inquiry Details</h3>

            {/* Property */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-white/[0.02] rounded-xl">
              <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-white/5">
                {selectedInquiry.listing.mainImage ? (
                  <Image
                    src={selectedInquiry.listing.mainImage}
                    alt={selectedInquiry.listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <i className="fas fa-image"></i>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-white font-medium">{selectedInquiry.listing.title}</h4>
                <p className="text-accent-purple font-semibold">{formatPrice(selectedInquiry.listing.price)}</p>
                <Link
                  href={`/listings/${selectedInquiry.listing.id}`}
                  target="_blank"
                  className="text-white/40 text-sm hover:text-white transition-colors"
                >
                  View Listing <i className="fas fa-external-link-alt ml-1"></i>
                </Link>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h4 className="text-white/50 text-sm font-medium mb-3">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs mb-1">Name</p>
                  <p className="text-white">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Email</p>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-accent-blue hover:underline">
                    {selectedInquiry.email}
                  </a>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Phone</p>
                  {selectedInquiry.phone ? (
                    <a href={`tel:${selectedInquiry.phone}`} className="text-accent-blue hover:underline">
                      {selectedInquiry.phone}
                    </a>
                  ) : (
                    <p className="text-white/50">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Date</p>
                  <p className="text-white">{formatDate(selectedInquiry.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <h4 className="text-white/50 text-sm font-medium mb-3">Message</h4>
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-white/80 whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: ${selectedInquiry.listing.title}`}
                className="flex-1 py-3 rounded-xl bg-accent-purple text-white font-medium text-center hover:bg-accent-purple/80 transition-colors"
              >
                <i className="fas fa-envelope mr-2"></i>
                Reply via Email
              </a>
              {selectedInquiry.phone && (
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium text-center hover:bg-green-600 transition-colors"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
