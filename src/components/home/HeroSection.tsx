'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiUrl, getImageUrl, isLocalUpload } from '@/lib/config';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

interface FeaturedListing {
  id: string;
  listing: {
    id: string;
    title: string;
    transactionType: string;
    mainImage: string | null;
    images?: { url: string }[];
  };
}

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState<FeaturedListing | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(apiUrl('/api/featured-listings?limit=1'));
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          setFeatured(data.data[0]);
        }
      } catch (error) {
        console.error('Error fetching featured listing:', error);
      }
    };
    fetchFeatured();
  }, []);

  const listing = featured?.listing;
  const heroImageUrl = listing?.mainImage
    ? getImageUrl(listing.mainImage)
    : listing?.images?.[0]?.url
      ? getImageUrl(listing.images[0].url)
      : DEFAULT_IMAGE;
  const isLocal = listing?.mainImage ? isLocalUpload(listing.mainImage) : false;
  const detailUrl = listing ? `/properties/${listing.transactionType.toLowerCase()}/${listing.id}` : null;

  const stats = [
    { value: '20K', suffix: '+', label: 'Properties' },
    { value: '500', suffix: '+', label: 'Agents' },
    { value: '10K', suffix: '+', label: 'Happy Clients' },
  ];

  return (
    <section className="hero-section relative">
      <div className="grid-lines"></div>
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>
      <div className="glow-orb glow-orb-3"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 pt-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full glass-ultra text-sm mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
              <span className="text-slate-600">20,000+ Properties Available</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.1] mb-8">
              <span className="gradient-text">Buy. Sell.</span>
              <br />
              <span className="text-slate-800">Connect.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-slate-500 font-light mb-4">
              Your property journey starts here.
            </p>
            <p className="text-lg text-slate-400 mb-10">
              Smart, simple, and powered by <span className="text-accent-blue">Worldwidelink</span>.
            </p>

            {/* Search Box */}
            <div className="glass-ultra rounded-3xl p-6 max-w-xl">
              <p className="text-slate-500 text-sm mb-4">Find your needs. Buy & Sell has it all.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent-blue transition-colors"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties..."
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 transition-all"
                  />
                </div>
                <button className="btn-premium text-white font-semibold px-8 py-4 rounded-2xl whitespace-nowrap">
                  <i className="fas fa-arrow-right mr-2"></i>Search
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-12 mt-12">
              {stats.map((stat, index) => (
                <div key={index} className={`stat-item ${index < stats.length - 1 ? 'sm:pr-12' : ''}`}>
                  <div className="text-2xl sm:text-4xl font-bold font-display text-slate-800">
                    {stat.value}
                    <span className="gradient-text">{stat.suffix}</span>
                  </div>
                  <div className="text-slate-500 text-xs sm:text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Mobile Hero Image */}
            <div className="lg:hidden mt-10 relative">
              {detailUrl ? (
                <Link
                  href={detailUrl}
                  className="relative rounded-2xl overflow-hidden shadow-xl block cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                >
                  <Image
                    src={heroImageUrl}
                    alt={listing?.title || "Hero Property"}
                    width={800}
                    height={400}
                    className="w-full h-[250px] object-cover"
                    priority
                    unoptimized={isLocal}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                </Link>
              ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={heroImageUrl}
                    alt="Hero Property"
                    width={800}
                    height={400}
                    className="w-full h-[250px] object-cover"
                    priority
                    unoptimized={isLocal}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                </div>
              )}
              {/* Mobile Floating Cards */}
              <div className="absolute -bottom-4 left-4 glass-ultra rounded-xl p-3 z-20 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                    <i className="fas fa-chart-line text-white text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Best Prices</div>
                    <div className="text-slate-500 text-xs">Guaranteed</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-3 right-4 glass-ultra rounded-xl p-2 z-20 shadow-lg">
                <div className="flex items-center space-x-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400 text-xs"></i>
                  ))}
                </div>
                <div className="text-slate-800 text-xs font-semibold">12,000+ Reviews</div>
              </div>
            </div>
          </div>

          {/* Hero Visual - Desktop */}
          <div className="hidden lg:block relative">
            <div className="relative">
              {/* Main Image */}
              {detailUrl ? (
                <Link
                  href={detailUrl}
                  className="relative z-10 rounded-3xl overflow-hidden shadow-2xl block cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                >
                  <Image
                    src={heroImageUrl}
                    alt={listing?.title || "Hero Property"}
                    width={800}
                    height={500}
                    className="w-full h-[500px] object-cover"
                    priority
                    unoptimized={isLocal}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                </Link>
              ) : (
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={heroImageUrl}
                    alt="Hero Property"
                    width={800}
                    height={500}
                    className="w-full h-[500px] object-cover"
                    priority
                    unoptimized={isLocal}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                </div>
              )}

              {/* Floating Card 1 */}
              <div className="absolute -bottom-8 -left-8 glass-ultra rounded-2xl p-5 z-20 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                    <i className="fas fa-chart-line text-white text-xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-display text-slate-800">Best Prices</div>
                    <div className="text-slate-500 text-sm">Guaranteed</div>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 */}
              <div className="absolute -top-6 -right-6 glass-ultra rounded-2xl p-4 z-20 shadow-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400"></i>
                  ))}
                </div>
                <div className="text-slate-800 font-semibold">12,000+ Reviews</div>
                <div className="text-slate-500 text-xs">Trusted Worldwide</div>
              </div>

              {/* Decorative Ring */}
              <div className="absolute -inset-4 border border-slate-200 rounded-[40px] z-0"></div>
              <div className="absolute -inset-8 border border-slate-100 rounded-[48px] z-0"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-4">Scroll to explore</span>
        <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center p-2">
          <div className="w-1 h-2 bg-accent-blue rounded-full animate-bounce"></div>
        </div>
      </div>
    </section>
  );
}
