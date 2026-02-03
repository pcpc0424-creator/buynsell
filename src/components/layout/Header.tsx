'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { config } from '@/lib/config';

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
    { href: '/properties?transactionType=SALE', label: 'Buy' },
    { href: '/properties?transactionType=RENT', label: 'Rent' },
    { href: '/agents', label: 'Agents' },
    { href: '/services', label: 'Services' },
    { href: '/pricing', label: 'Membership' },
  ];

  const propertyCategories = [
    { href: '/properties/house', icon: 'fa-home', label: 'House' },
    { href: '/properties/condo', icon: 'fa-building', label: 'Condo' },
    { href: '/properties/townhouse', icon: 'fa-city', label: 'Townhouse' },
    { href: '/properties/commercial', icon: 'fa-store', label: 'Commercial' },
    { href: '/properties/lot', icon: 'fa-map', label: 'Lot' },
    { href: '/properties/new-development', icon: 'fa-hammer', label: 'New' },
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
                    href="/properties?transactionType=SALE"
                    className="text-slate-600 hover:text-accent-blue font-semibold px-5 py-3 rounded-full border border-slate-300 hover:border-accent-blue transition-all"
                  >
                    BUY
                  </Link>
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
                        {session.user?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <i className="fas fa-shield-alt w-5"></i>
                            Admin Dashboard
                          </Link>
                        )}
                        {session.user?.role === 'AGENT' && (
                          <Link
                            href="/agent"
                            className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <i className="fas fa-briefcase w-5"></i>
                            Agent Dashboard
                          </Link>
                        )}
                        <Link
                          href="/my/subscription"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-tachometer-alt w-5"></i>
                          My Account
                        </Link>
                        <Link
                          href="/properties"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-building w-5"></i>
                          Browse Properties
                        </Link>
                        <Link
                          href="/pricing"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-crown w-5"></i>
                          Pricing & Plans
                        </Link>
                        <Link
                          href="/support"
                          className="flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="fas fa-question-circle w-5"></i>
                          Support
                        </Link>
                        <div className="border-t border-slate-200 mt-2 pt-2">
                          <button
                            onClick={() => signOut({ callbackUrl: `${config.basePath}/` })}
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
                    href="/properties?transactionType=SALE"
                    className="text-slate-600 hover:text-accent-blue font-semibold px-5 py-3 rounded-full border border-slate-300 hover:border-accent-blue transition-all"
                  >
                    BUY
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
        <div className="h-full w-full flex flex-col justify-start items-center px-6 pt-20 pb-8 overflow-y-auto box-border">
          <button
            className="absolute top-8 right-8 text-slate-700 text-3xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>

          {/* Navigation Links */}
          <div className="space-y-6 text-center mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-2xl font-display font-bold text-slate-800 hover:text-accent-blue transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Property Categories */}
          <div className="w-full max-w-xs mb-8">
            <p className="text-slate-400 text-sm text-center mb-4">Property Categories</p>
            <div className="grid grid-cols-3 gap-2">
              {propertyCategories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className="flex flex-col items-center p-3 rounded-xl bg-slate-100 hover:bg-accent-blue/10 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className={`fas ${category.icon} text-accent-blue text-lg mb-1`}></i>
                  <span className="text-slate-700 text-xs font-medium">{category.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* User Section */}
          <div className="space-y-4 text-center">
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
                {session.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block text-slate-500 hover:text-slate-800 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                {session.user?.role === 'AGENT' && (
                  <Link
                    href="/agent"
                    className="block text-slate-500 hover:text-slate-800 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Agent Dashboard
                  </Link>
                )}
                <Link
                  href="/my/subscription"
                  className="block text-slate-500 hover:text-slate-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Account
                </Link>
                <div className="flex space-x-4 justify-center mt-4">
                  <Link
                    href="/properties?transactionType=SALE"
                    className="text-slate-600 hover:text-accent-blue font-semibold px-8 py-4 rounded-full text-lg border border-slate-300 hover:border-accent-blue transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    BUY
                  </Link>
                  <Link
                    href="/sell"
                    className="btn-premium text-white font-semibold px-8 py-4 rounded-full text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    SELL
                  </Link>
                </div>
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
                <div className="flex space-x-4 justify-center mt-4">
                  <Link
                    href="/properties?transactionType=SALE"
                    className="text-slate-600 hover:text-accent-blue font-semibold px-8 py-4 rounded-full text-lg border border-slate-300 hover:border-accent-blue transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    BUY
                  </Link>
                  <Link
                    href="/sell"
                    className="btn-premium text-white font-semibold px-8 py-4 rounded-full text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    SELL
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
