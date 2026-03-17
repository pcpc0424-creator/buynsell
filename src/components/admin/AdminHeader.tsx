'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { apiUrl } from '@/lib/config';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  type: 'inquiry' | 'listing' | 'user';
  title: string;
  message: string;
  link: string;
  createdAt: string;
  read: boolean;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Fetch pending items as notifications
        const [inquiriesRes, listingsRes] = await Promise.all([
          fetch(apiUrl('/api/inquiries?status=PENDING&limit=3')),
          fetch(apiUrl('/api/listings?status=PENDING&limit=3')),
        ]);

        const inquiriesData = await inquiriesRes.json();
        const listingsData = await listingsRes.json();

        const notifs: Notification[] = [];

        // Add pending inquiries
        if (inquiriesData.success && inquiriesData.data) {
          inquiriesData.data.forEach((inquiry: any) => {
            notifs.push({
              id: `inquiry-${inquiry.id}`,
              type: 'inquiry',
              title: 'New Inquiry',
              message: `Inquiry from ${inquiry.name} is pending`,
              link: '/admin/inquiries?status=PENDING',
              createdAt: inquiry.createdAt,
              read: false,
            });
          });
        }

        // Add pending listings
        if (listingsData.success && listingsData.data) {
          listingsData.data.forEach((listing: any) => {
            notifs.push({
              id: `listing-${listing.id}`,
              type: 'listing',
              title: 'Listing Pending Approval',
              message: `"${listing.title}" needs approval`,
              link: '/admin/listings?status=PENDING',
              createdAt: listing.createdAt,
              read: false,
            });
          });
        }

        // Sort by date
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifs.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'inquiry': return 'fa-envelope';
      case 'listing': return 'fa-building';
      case 'user': return 'fa-user';
      default: return 'fa-bell';
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all"
              title="Notifications"
            >
              <i className="fas fa-bell"></i>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-pink text-white text-xs flex items-center justify-center font-semibold">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  {notifications.length > 0 && (
                    <span className="text-xs text-slate-500">{notifications.length}</span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-8 text-center">
                      <i className="fas fa-spinner fa-spin text-slate-400"></i>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            notif.type === 'inquiry' ? 'bg-blue-100 text-blue-600' :
                            notif.type === 'listing' ? 'bg-purple-100 text-purple-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            <i className={`fas ${getIcon(notif.type)} text-sm`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                            <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatTime(notif.createdAt)}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <i className="fas fa-bell-slash text-slate-300 text-2xl mb-2"></i>
                      <p className="text-slate-500 text-sm">No notifications</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                    <Link
                      href="/admin/inquiries"
                      onClick={() => setShowNotifications(false)}
                      className="text-sm text-accent-blue hover:text-accent-purple transition-colors"
                    >
                      View all notifications →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || ''}
                width={40}
                height={40}
                className="rounded-xl"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-semibold">
                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-slate-800 font-medium text-sm">{session?.user?.name || 'Admin'}</p>
              <p className="text-slate-500 text-xs">{session?.user?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
