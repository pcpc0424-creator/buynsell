'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string | null;
  image: string | null;
  agentProfile?: {
    rating: number;
    reviewCount: number;
    isVerified: boolean;
  } | null;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  mainImage: string;
  isFeatured: boolean;
  agent: Agent;
  _count?: {
    inquiries: number;
    favorites: number;
  };
}

interface PropertyListProps {
  properties: Property[];
  loading?: boolean;
  total?: number;
  onSortChange?: (sort: string) => void;
  sort?: string;
}

function PropertyList({ properties, loading, total = 0, onSortChange, sort = 'newest' }: PropertyListProps) {
  const formatPrice = (price: number, transactionType: string) => {
    const formatted = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
    return transactionType === 'RENT' ? `${formatted}/mo` : formatted;
  };

  const getPropertyTypeSlug = (type: string) => {
    return type.toLowerCase().replace('_', '-');
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-40 bg-white/10 rounded animate-pulse"></div>
          <div className="h-10 w-40 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-ultra rounded-3xl overflow-hidden">
              <div className="h-[240px] bg-white/10 animate-pulse"></div>
              <div className="p-5 space-y-3">
                <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse"></div>
                <div className="h-8 w-1/3 bg-white/10 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="glass-ultra rounded-3xl p-12 text-center">
        <i className="fas fa-home text-5xl text-white/20 mb-4"></i>
        <h3 className="text-xl font-semibold text-white mb-2">No properties found</h3>
        <p className="text-white/50">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/60">
          Showing <span className="text-white font-semibold">{properties.length}</span> of{' '}
          <span className="text-white font-semibold">{total}</span> properties
        </p>
        <select
          value={sort}
          onChange={(e) => onSortChange?.(e.target.value)}
          className="form-select w-auto text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="area">Largest Area</option>
        </select>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="property-card cursor-pointer group">
            <Link href={`/properties/${getPropertyTypeSlug(property.propertyType)}/${property.id}`}>
              <div className="relative h-[240px] overflow-hidden rounded-t-3xl">
                <Image
                  src={property.mainImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'}
                  alt={property.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                      property.transactionType === 'SALE' ? 'bg-accent-blue' : 'bg-accent-purple'
                    }`}
                  >
                    For {property.transactionType === 'SALE' ? 'Sale' : 'Rent'}
                  </span>
                  {property.isFeatured && (
                    <span className="px-3 py-1 rounded-full bg-yellow-500 text-white text-xs font-semibold">
                      <i className="fas fa-star mr-1"></i>Featured
                    </span>
                  )}
                </div>

                {/* Favorite Button */}
                <button
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-accent-pink hover:bg-black/50 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Add to favorites
                  }}
                >
                  <i className="far fa-heart"></i>
                </button>

                {/* Agent Badge */}
                {property.agent && (
                  <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/50">
                      <Image
                        src={property.agent.image || '/images/default-avatar.png'}
                        alt={property.agent.name || 'Agent'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-white text-sm font-medium drop-shadow-lg">
                      {property.agent.name}
                    </span>
                    {property.agent.agentProfile?.isVerified && (
                      <i className="fas fa-check-circle text-accent-blue text-xs"></i>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-accent-blue transition-colors">
                  {property.title}
                </h3>
                <p className="text-white/50 text-sm mb-3 flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-accent-blue"></i>
                  {property.city}
                </p>

                {/* Property Stats */}
                <div className="flex items-center space-x-4 text-white/60 text-sm mb-4">
                  {property.bedrooms !== null && property.bedrooms > 0 && (
                    <span className="flex items-center">
                      <i className="fas fa-bed mr-1"></i>
                      {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms !== null && property.bathrooms > 0 && (
                    <span className="flex items-center">
                      <i className="fas fa-bath mr-1"></i>
                      {property.bathrooms}
                    </span>
                  )}
                  {property.area !== null && property.area > 0 && (
                    <span className="flex items-center">
                      <i className="fas fa-ruler-combined mr-1"></i>
                      {property.area} sqm
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold gradient-text">
                    {formatPrice(property.price, property.transactionType)}
                  </span>
                  <span className="text-white/40 text-xs uppercase">
                    {property.propertyType.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(PropertyList);
