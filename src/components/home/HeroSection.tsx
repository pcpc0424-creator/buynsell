'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');

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
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
              <span className="text-white/70">20,000+ Properties Available</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.1] mb-8">
              <span className="gradient-text">Buy. Sell.</span>
              <br />
              <span className="text-white">Connect.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-white/60 font-light mb-4">
              Your property journey starts here.
            </p>
            <p className="text-lg text-white/40 mb-10">
              Smart, simple, and powered by <span className="text-accent-blue">Worldwidelink</span>.
            </p>

            {/* Search Box */}
            <div className="glass-ultra rounded-3xl p-6 max-w-xl">
              <p className="text-white/50 text-sm mb-4">Find your needs. Buy & Sell has it all.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-blue transition-colors"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all"
                  />
                </div>
                <button className="btn-premium text-white font-semibold px-8 py-4 rounded-2xl whitespace-nowrap">
                  <i className="fas fa-arrow-right mr-2"></i>Search
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-12 mt-12">
              {stats.map((stat, index) => (
                <div key={index} className={`stat-item ${index < stats.length - 1 ? 'pr-12' : ''}`}>
                  <div className="text-4xl font-bold font-display text-white">
                    {stat.value}
                    <span className="gradient-text">{stat.suffix}</span>
                  </div>
                  <div className="text-white/40 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="hidden lg:block relative">
            <div className="relative">
              {/* Main Image */}
              <div className="relative z-10 rounded-3xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Luxury Property"
                  width={800}
                  height={500}
                  className="w-full h-[500px] object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent"></div>
              </div>

              {/* Floating Card 1 */}
              <div className="absolute -bottom-8 -left-8 glass-ultra rounded-2xl p-5 z-20">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                    <i className="fas fa-chart-line text-white text-xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-display text-white">Best Prices</div>
                    <div className="text-white/40 text-sm">Guaranteed</div>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 */}
              <div className="absolute -top-6 -right-6 glass-ultra rounded-2xl p-4 z-20">
                <div className="flex items-center space-x-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400"></i>
                  ))}
                </div>
                <div className="text-white font-semibold">12,000+ Reviews</div>
                <div className="text-white/40 text-xs">Trusted Worldwide</div>
              </div>

              {/* Decorative Ring */}
              <div className="absolute -inset-4 border border-white/5 rounded-[40px] z-0"></div>
              <div className="absolute -inset-8 border border-white/[0.02] rounded-[48px] z-0"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center">
        <span className="text-white/30 text-xs uppercase tracking-[0.2em] mb-4">Scroll to explore</span>
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-2">
          <div className="w-1 h-2 bg-accent-blue rounded-full animate-bounce"></div>
        </div>
      </div>
    </section>
  );
}
