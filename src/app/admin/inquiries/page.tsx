'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/admin';
import { apiUrl } from '@/lib/config';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  listing: {
    id: string;
    title: string;
    agent: { id: string; name: string; email: string } | null;
  };
  user: { id: string; name: string | null; email: string } | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  forwardedAt: string | null;
}

interface StatusCounts {
  PENDING: number;
  REVIEWED: number;
  FORWARDED: number;
  CLOSED: number;
}

const statusOptions = ['ALL', 'PENDING', 'REVIEWED', 'FORWARDED', 'CLOSED'];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  REVIEWED: 'bg-blue-500/20 text-blue-400',
  FORWARDED: 'bg-purple-500/20 text-purple-400',
  CLOSED: 'bg-gray-500/20 text-gray-400',
};

export default function InquiriesPage() {
  const searchParams = useSearchParams();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    PENDING: 0,
    REVIEWED: 0,
    FORWARDED: 0,
    CLOSED: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
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

      const res = await fetch(apiUrl(`/api/inquiries?${params.toString()}`));
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

      if (result.counts) {
        setStatusCounts({
          PENDING: result.counts.PENDING || 0,
          REVIEWED: result.counts.REVIEWED || 0,
          FORWARDED: result.counts.FORWARDED || 0,
          CLOSED: result.counts.CLOSED || 0,
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

  const handleForward = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(apiUrl(`/api/inquiries/${id}/forward`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to forward inquiry');
      }

      // Update local state
      setInquiries(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'FORWARDED', forwardedAt: new Date().toISOString() } : i))
      );
      setStatusCounts(prev => ({
        ...prev,
        PENDING: Math.max(0, prev.PENDING - 1),
        FORWARDED: prev.FORWARDED + 1,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(apiUrl(`/api/inquiries/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update inquiry status');
      }

      // Update local state
      const inquiry = inquiries.find(i => i.id === id);
      if (inquiry) {
        setInquiries(prev =>
          prev.map(i => (i.id === id ? { ...i, status: newStatus } : i))
        );
        setStatusCounts(prev => ({
          ...prev,
          [inquiry.status]: Math.max(0, prev[inquiry.status as keyof StatusCounts] - 1),
          [newStatus]: prev[newStatus as keyof StatusCounts] + 1,
        }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;

    try {
      setActionLoading(selectedInquiry.id);
      const res = await fetch(apiUrl(`/api/inquiries/${selectedInquiry.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save notes');
      }

      // Update local state
      setInquiries(prev =>
        prev.map(i => (i.id === selectedInquiry.id ? { ...i, adminNotes } : i))
      );

      setSelectedInquiry(null);
      setAdminNotes('');
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

  if (loading && inquiries.length === 0) {
    return (
      <>
        <AdminHeader
          title="Inquiries Management"
          subtitle="Handle and forward property inquiries"
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
        title="Inquiries Management"
        subtitle="Handle and forward property inquiries"
      />

      <div className="p-8">
        {/* Filters */}
        <div className="glass-ultra rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
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
                    {status === 'ALL' ? 'All Status' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
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
              statusFilter === 'REVIEWED' ? 'ring-2 ring-blue-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'REVIEWED' ? 'ALL' : 'REVIEWED')}
          >
            <p className="text-2xl font-bold text-blue-400">{statusCounts.REVIEWED}</p>
            <p className="text-slate-500 text-sm">Reviewed</p>
          </div>
          <div
            className={`glass-ultra rounded-xl p-4 text-center cursor-pointer transition-all ${
              statusFilter === 'FORWARDED' ? 'ring-2 ring-purple-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'FORWARDED' ? 'ALL' : 'FORWARDED')}
          >
            <p className="text-2xl font-bold text-purple-400">{statusCounts.FORWARDED}</p>
            <p className="text-slate-500 text-sm">Forwarded</p>
          </div>
          <div
            className={`glass-ultra rounded-xl p-4 text-center cursor-pointer transition-all ${
              statusFilter === 'CLOSED' ? 'ring-2 ring-gray-400' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'CLOSED' ? 'ALL' : 'CLOSED')}
          >
            <p className="text-2xl font-bold text-gray-400">{statusCounts.CLOSED}</p>
            <p className="text-slate-500 text-sm">Closed</p>
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
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="glass-ultra rounded-2xl p-6 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-semibold">
                    {inquiry.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{inquiry.name}</h4>
                    <p className="text-slate-400 text-sm">{inquiry.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 text-sm">{formatDate(inquiry.createdAt)}</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[inquiry.status] || ''}`}>
                    {inquiry.status}
                  </span>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-xl p-4 mb-4">
                <p className="text-slate-500 text-sm mb-2">
                  <i className="fas fa-building mr-2 text-accent-blue"></i>
                  Re: <span className="text-white">{inquiry.listing.title}</span>
                  {inquiry.listing.agent && (
                    <>
                      <span className="text-slate-400 mx-2">|</span>
                      Agent: {inquiry.listing.agent.name}
                    </>
                  )}
                </p>
                <p className="text-slate-600">{inquiry.message}</p>
                {inquiry.adminNotes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-slate-400 text-xs mb-1">
                      <i className="fas fa-sticky-note mr-1"></i> Admin Notes:
                    </p>
                    <p className="text-slate-500 text-sm">{inquiry.adminNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-slate-400 text-sm">
                  <i className="fas fa-phone mr-2"></i>
                  {inquiry.phone || 'No phone'}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedInquiry(inquiry);
                      setAdminNotes(inquiry.adminNotes || '');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-white transition-all text-sm"
                  >
                    <i className="fas fa-edit mr-2"></i>Notes
                  </button>
                  {(inquiry.status === 'PENDING' || inquiry.status === 'REVIEWED') && (
                    <button
                      onClick={() => handleForward(inquiry.id)}
                      disabled={actionLoading === inquiry.id}
                      className="px-4 py-2 rounded-lg bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 transition-all text-sm disabled:opacity-50"
                    >
                      {actionLoading === inquiry.id ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-share mr-2"></i>
                      )}
                      Forward to Agent
                    </button>
                  )}
                  {inquiry.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange(inquiry.id, 'CLOSED')}
                      disabled={actionLoading === inquiry.id}
                      className="px-4 py-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-white transition-all text-sm disabled:opacity-50"
                    >
                      {actionLoading === inquiry.id ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-check-circle mr-2"></i>
                      )}
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredInquiries.length === 0 && !loading && (
            <div className="glass-ultra rounded-2xl p-12 text-center">
              <i className="fas fa-envelope text-4xl text-slate-300 mb-4"></i>
              <p className="text-slate-500">No inquiries found</p>
            </div>
          )}
        </div>

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

      {/* Admin Notes Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedInquiry(null)}
          ></div>
          <div className="relative glass-ultra rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold text-white mb-2">Admin Notes</h3>
            <p className="text-slate-500 text-sm mb-4">
              Inquiry from {selectedInquiry.name} about {selectedInquiry.listing.title}
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this inquiry..."
              className="form-textarea mb-4"
              rows={4}
            ></textarea>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedInquiry(null);
                  setAdminNotes('');
                }}
                className="flex-1 py-3 rounded-xl glass-ultra text-white font-medium hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={actionLoading === selectedInquiry.id}
                className="flex-1 py-3 rounded-xl btn-premium text-white font-medium disabled:opacity-50"
              >
                {actionLoading === selectedInquiry.id ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  'Save Notes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
