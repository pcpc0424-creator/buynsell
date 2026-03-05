'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { AgentHeader } from '@/components/agent';
import { apiUrl, getImageUrl, isLocalUpload } from '@/lib/config';

interface ListingImage {
  url: string;
}

interface RecentListing {
  id: string;
  title: string;
  price: number;
  status: string;
  mainImage: string | null;
  images: ListingImage[];
}

interface InquiryUser {
  name: string;
}

interface InquiryListing {
  title: string;
}

interface RecentInquiry {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  user: InquiryUser | null;
  listing: InquiryListing | null;
}

interface DashboardData {
  listings: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  inquiries: {
    total: number;
    new: number;
  };
  recentListings: RecentListing[];
  recentInquiries: RecentInquiry[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  FORWARDED: 'bg-purple-500/20 text-purple-400',
  CLOSED: 'bg-gray-500/20 text-gray-400',
};

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch listings and inquiries in parallel
      const [listingsRes, inquiriesRes] = await Promise.all([
        fetch(apiUrl('/api/listings/my?limit=5')),
        fetch(apiUrl('/api/inquiries?limit=5')),
      ]);

      const [listingsData, inquiriesData] = await Promise.all([
        listingsRes.json(),
        inquiriesRes.json(),
      ]);

      const listings = {
        total: listingsData.pagination?.total || 0,
        approved: listingsData.counts?.APPROVED || 0,
        pending: listingsData.counts?.PENDING || 0,
        rejected: listingsData.counts?.REJECTED || 0,
      };

      const inquiries = {
        total: inquiriesData.pagination?.total || 0,
        new: inquiriesData.data?.filter((i: RecentInquiry) => i.status === 'FORWARDED').length || 0,
      };

      setData({
        listings,
        inquiries,
        recentListings: listingsData.data || [],
        recentInquiries: inquiriesData.data || [],
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <AgentHeader
          title="Dashboard"
          subtitle={`Welcome back, ${session?.user?.name || 'Agent'}!`}
        />
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-purple"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AgentHeader
          title="Dashboard"
          subtitle={`Welcome back, ${session?.user?.name || 'Agent'}!`}
        />
        <div className="p-8">
          <div className="glass-ultra rounded-2xl p-6 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg hover:bg-accent-purple/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AgentHeader
        title="Dashboard"
        subtitle={`Welcome back, ${session?.user?.name || 'Agent'}!`}
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-ultra rounded-2xl p-6 hover:bg-slate-200 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-purple/5 flex items-center justify-center text-accent-purple">
                <i className="fas fa-building text-lg"></i>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{data?.listings.total || 0}</h3>
            <p className="text-slate-500 text-sm">Total Listings</p>
          </div>

          <div className="glass-ultra rounded-2xl p-6 hover:bg-slate-200 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center text-green-400">
                <i className="fas fa-check-circle text-lg"></i>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{data?.listings.approved || 0}</h3>
            <p className="text-slate-500 text-sm">Active Listings</p>
          </div>

          <div className="glass-ultra rounded-2xl p-6 hover:bg-slate-200 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center text-yellow-400">
                <i className="fas fa-clock text-lg"></i>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{data?.listings.pending || 0}</h3>
            <p className="text-slate-500 text-sm">Pending Approval</p>
          </div>

          <div className="glass-ultra rounded-2xl p-6 hover:bg-slate-200 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 flex items-center justify-center text-accent-blue">
                <i className="fas fa-envelope text-lg"></i>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{data?.inquiries.total || 0}</h3>
            <p className="text-slate-500 text-sm">Total Inquiries</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Listings */}
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">My Listings</h2>
              <Link
                href="/agent/listings"
                className="text-accent-purple hover:text-accent-pink transition-colors text-sm"
              >
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            <div className="space-y-4">
              {data?.recentListings && data.recentListings.length > 0 ? (
                data.recentListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-slate-100">
                        {(listing.mainImage || listing.images?.[0]?.url) ? (
                          <Image
                            src={getImageUrl(listing.mainImage || listing.images[0].url)}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            unoptimized={isLocalUpload(listing.mainImage || listing.images[0].url)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-slate-800 font-medium truncate text-sm">{listing.title}</h4>
                        <p className="text-slate-400 text-xs">{formatPrice(listing.price)}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[listing.status]}`}>
                      {listing.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-building text-3xl text-slate-300 mb-3"></i>
                  <p className="text-slate-400 text-sm">No listings yet</p>
                  <Link
                    href="/sell"
                    className="inline-block mt-3 px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg text-sm hover:bg-accent-purple/30 transition-colors"
                  >
                    Create Your First Listing
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Inquiries */}
          <div className="glass-ultra rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Recent Inquiries</h2>
              <Link
                href="/agent/inquiries"
                className="text-accent-purple hover:text-accent-pink transition-colors text-sm"
              >
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            <div className="space-y-4">
              {data?.recentInquiries && data.recentInquiries.length > 0 ? (
                data.recentInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-semibold text-sm">
                        {(inquiry.user?.name || inquiry.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-slate-800 font-medium text-sm">{inquiry.user?.name || inquiry.name}</h4>
                        <p className="text-slate-400 text-xs truncate">{inquiry.listing?.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[inquiry.status]}`}>
                        {inquiry.status}
                      </span>
                      <p className="text-slate-400 text-xs mt-1">{formatDate(inquiry.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-envelope text-3xl text-slate-300 mb-3"></i>
                  <p className="text-slate-400 text-sm">No inquiries yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/sell"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-plus text-accent-purple text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">Add New Listing</span>
            </Link>
            <Link
              href="/agent/listings"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-list text-accent-blue text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">Manage Listings</span>
            </Link>
            <Link
              href="/agent/inquiries"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-pink/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-envelope-open text-accent-pink text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">View Inquiries</span>
            </Link>
            <Link
              href="/agent/profile"
              className="glass-ultra rounded-xl p-4 text-center hover:bg-slate-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-edit text-accent-cyan text-xl"></i>
              </div>
              <span className="text-slate-800 font-medium text-sm">Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
