'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { config } from '@/lib/config';

const menuItems = [
  {
    href: '/agent',
    icon: 'fa-tachometer-alt',
    label: 'Dashboard',
  },
  {
    href: '/agent/listings',
    icon: 'fa-building',
    label: 'My Listings',
    badge: 'listings',
  },
  {
    href: '/agent/inquiries',
    icon: 'fa-envelope',
    label: 'Inquiries',
    badge: 'inquiries',
  },
  {
    href: '/agent/profile',
    icon: 'fa-user',
    label: 'Profile',
  },
  {
    href: '/agent/listings/new',
    icon: 'fa-plus-circle',
    label: 'Add Listing',
  },
];

interface AgentSidebarProps {
  listingsCount?: number;
  inquiriesCount?: number;
}

export default function AgentSidebar({ listingsCount = 0, inquiriesCount = 0 }: AgentSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40 shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/agent" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
            <i className="fas fa-home text-white"></i>
          </div>
          <div>
            <span className="text-lg font-bold font-display text-slate-800">Buy & Sell</span>
            <span className="block text-xs text-slate-500">Agent Portal</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/agent' && pathname?.startsWith(item.href));
            const badgeCount = item.badge === 'listings'
              ? listingsCount
              : item.badge === 'inquiries'
              ? inquiriesCount
              : 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-accent-purple/10 text-accent-purple'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`fas ${item.icon} w-5 text-center`}></i>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-accent-pink text-white text-xs font-semibold">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <Link
          href="/"
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all"
        >
          <i className="fas fa-external-link-alt w-5 text-center"></i>
          <span className="font-medium">View Site</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: `${config.basePath}/login` })}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
        >
          <i className="fas fa-sign-out-alt w-5 text-center"></i>
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
