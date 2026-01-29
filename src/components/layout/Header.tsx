'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/properties', label: 'Properties' },
    { href: '/agents', label: 'Agents' },
    { href: '/notice', label: 'Notice' },
  ];

  return (
    <>
      <nav className={`nav-premium fixed top-0 left-0 right-0 z-50 py-5 ${isScrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/30">
                <i className="fas fa-home text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold font-display text-slate-800">
                Buy <span className="gradient-text">&</span> Sell
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link text-slate-500 hover:text-slate-800 font-medium transition-colors ${
                    pathname === link.href ? 'active text-slate-800' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
              ) : session ? (
                <>
                  <Link
                    href="/sell"
                    className="btn-premium text-white font-semibold px-7 py-3 rounded-full"
                  >
                    SELL
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 glass-ultra rounded-full px-3 py-2 hover:bg-slate-50 transition-all"
                    >
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || ''}
                          width={32}
                          height={32}
                          loading="lazy"
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-sm font-semibold">
                          {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="text-slate-600 text-sm">{session.user?.name?.split(' ')[0]}</span>
                      <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}></i>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 glass-ultra rounded-xl p-2 shadow-xl">
                        <div className="px-3 py-2 border-b border-slate-200 mb-2">
                          <p className="text-slate-800 font-medium text-sm">{session.user?.name}</p>
                          <p className="text-slate-400 text-xs truncate">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-tachometer-alt w-5"></i>
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/listings"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-building w-5"></i>
                          My Listings
                        </Link>
                        <Link
                          href="/dashboard/favorites"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-heart w-5"></i>
                          Favorites
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-cog w-5"></i>
                          Settings
                        </Link>
                        <div className="border-t border-slate-200 mt-2 pt-2">
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-all text-sm"
                          >
                            <i className="fas fa-sign-out-alt w-5"></i>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`transition-colors px-4 py-2 ${
                      pathname === '/login' ? 'text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`transition-colors px-4 py-2 ${
                      pathname === '/register' ? 'text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Register
                  </Link>
                  <Link
                    href="/sell"
                    className="btn-premium text-white font-semibold px-7 py-3 rounded-full"
                  >
                    SELL
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-slate-700 text-2xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="h-full flex flex-col justify-center items-center p-8">
          <button
            className="absolute top-8 right-8 text-slate-700 text-3xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="space-y-8 text-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-4xl font-display font-bold text-slate-800 hover:text-accent-blue transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-12 space-y-4 text-center">
            {session ? (
              <>
                <div className="flex items-center justify-center space-x-3 mb-6">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || ''}
                      width={48}
                      height={48}
                      loading="lazy"
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-lg font-semibold">
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-slate-800 font-medium">{session.user?.name}</p>
                    <p className="text-slate-400 text-sm">{session.user?.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="block text-slate-500 hover:text-slate-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/sell"
                  className="btn-premium text-white font-semibold px-10 py-4 rounded-full text-lg inline-block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  SELL Property
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="block text-red-500 hover:text-red-600 transition-colors mx-auto mt-4"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-slate-500 hover:text-slate-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block text-slate-500 hover:text-slate-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
                <Link
                  href="/sell"
                  className="btn-premium text-white font-semibold px-10 py-4 rounded-full text-lg inline-block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  SELL Property
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
