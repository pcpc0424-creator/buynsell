'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiUrl, config } from '@/lib/config';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  transactionType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  mainImage: string | null;
  images: { url: string }[];
  isFeatured: boolean;
}

// Fallback mock data
const mockProperties = [
  {
    id: '1',
    title: 'The Riviera Estate',
    address: 'Makati City, Metro Manila',
    city: 'Makati City',
    price: 85000000,
    transactionType: 'SALE',
    propertyType: 'HOUSE',
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    mainImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    images: [],
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Modern Skyline Condo',
    address: 'BGC, Taguig City',
    city: 'Taguig City',
    price: 25500000,
    transactionType: 'SALE',
    propertyType: 'CONDO',
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    mainImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    images: [],
    isFeatured: false,
  },
  {
    id: '3',
    title: 'Beachfront Villa',
    address: 'Cebu City, Cebu',
    city: 'Cebu City',
    price: 120000,
    transactionType: 'RENT',
    propertyType: 'HOUSE',
    bedrooms: 4,
    bathrooms: 3,
    area: 320,
    mainImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    images: [],
    isFeatured: false,
  },
  {
    id: '4',
    title: 'Urban Loft Space',
    address: 'Quezon City, Metro Manila',
    city: 'Quezon City',
    price: 15800000,
    transactionType: 'SALE',
    propertyType: 'CONDO',
    bedrooms: 1,
    bathrooms: 1,
    area: 65,
    mainImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    images: [],
    isFeatured: false,
  },
];

export default function RecentProperties() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fetch featured listings first (sorted by position) - using public API
        const featuredRes = await fetch(apiUrl('/api/featured-listings?limit=4'));
        const featuredResult = await featuredRes.json();

        let featuredProperties: Property[] = [];
        if (featuredResult.success && featuredResult.data?.length > 0) {
          featuredProperties = featuredResult.data.map((item: { listing: Property }) => ({
            ...item.listing,
            isFeatured: true,
          }));
        }

        // Fetch recent approved listings
        const recentRes = await fetch(apiUrl('/api/listings?status=APPROVED&limit=8'));
        const recentResult = await recentRes.json();

        let recentProperties: Property[] = [];
        if (recentResult.success && recentResult.data?.length > 0) {
          recentProperties = recentResult.data.map((item: Property) => ({
            ...item,
            isFeatured: item.isFeatured || false,
          }));
        }

        // Combine: featured first, then recent (excluding duplicates)
        const featuredIds = new Set(featuredProperties.map((p: Property) => p.id));
        const combined = [
          ...featuredProperties,
          ...recentProperties.filter((p: Property) => !featuredIds.has(p.id)),
        ].slice(0, 4);

        if (combined.length > 0) {
          setProperties(combined);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
        // Keep mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const formatPrice = (price: number, transactionType: string) => {
    const formatted = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);

    return transactionType === 'RENT' ? `${formatted}/mo` : formatted;
  };

  const getTypeLabel = (type: string) => {
    return type === 'RENT' ? 'For Rent' : 'For Sale';
  };

  const getImageUrl = (property: Property) => {
    if (property.mainImage) return property.mainImage;
    if (property.images && property.images.length > 0) return property.images[0].url;
    return `${config.basePath}/images/placeholder-property.svg`;
  };

  const getPropertyLink = (property: Property) => {
    const type = property.transactionType.toLowerCase();
    return `/properties/${type}/${property.id}`;
  };

  if (loading) {
    return (
      <section id="properties" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
          </div>
        </div>
      </section>
    );
  }

  const featuredProperty = properties[0];
  const otherProperties = properties.slice(1);

  return (
    <section id="properties" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
          <div>
            <span className="inline-block px-5 py-2 glass-ultra rounded-full text-sm text-slate-600 mb-6">
              <i className="fas fa-fire mr-2 text-accent-pink"></i>Featured
            </span>
            <h2 className="section-title text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-slate-800">
              Recent <span className="gradient-text">Real Estate</span>
            </h2>
            <p className="text-slate-500 text-lg mt-4">Find Your Perfect Properties at the best prices</p>
          </div>
          <Link
            href="/properties"
            className="mt-8 lg:mt-0 inline-flex items-center text-accent-blue font-medium hover:text-accent-purple transition-colors group"
          >
            View All Properties
            <i className="fas fa-arrow-right ml-3 group-hover:translate-x-2 transition-transform"></i>
          </Link>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Featured Property */}
          {featuredProperty && (
            <div className="lg:col-span-2 lg:row-span-2 property-card cursor-pointer">
              <Link href={getPropertyLink(featuredProperty)}>
                <div className="relative h-full min-h-[500px] lg:min-h-[650px]">
                  <div className="absolute inset-0 overflow-hidden rounded-3xl">
                    <Image
                      src={getImageUrl(featuredProperty)}
                      alt={featuredProperty.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                      className="card-image object-cover transition-transform duration-700 hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `${config.basePath}/images/placeholder-property.svg`;
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent rounded-3xl"></div>

                  {/* Tags */}
                  <div className="absolute top-6 left-6 flex items-center space-x-3 z-10">
                    {featuredProperty.isFeatured && (
                      <span className="px-4 py-1.5 rounded-full bg-accent-pink text-white text-xs font-semibold uppercase">
                        Featured
                      </span>
                    )}
                    <span className="px-4 py-1.5 rounded-full bg-white/90 text-slate-800 text-xs font-semibold shadow-sm">
                      {getTypeLabel(featuredProperty.transactionType)}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-slate-600 hover:text-accent-pink hover:bg-white transition-all z-10 shadow-sm">
                    <i className="far fa-heart text-lg"></i>
                  </button>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                    <div className="price-tag text-3xl font-bold font-display text-white mb-3">
                      {formatPrice(featuredProperty.price, featuredProperty.transactionType)}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{featuredProperty.title}</h3>
                    <p className="text-slate-300 flex items-center mb-4">
                      <i className="fas fa-map-marker-alt mr-2 text-accent-blue"></i>
                      {featuredProperty.address || featuredProperty.city}
                    </p>
                    <div className="flex items-center space-x-6 text-slate-300">
                      <span className="flex items-center">
                        <i className="fas fa-bed mr-2"></i>{featuredProperty.bedrooms} Beds
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-bath mr-2"></i>{featuredProperty.bathrooms} Baths
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-vector-square mr-2"></i>{featuredProperty.area} sqm
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Other Properties */}
          {otherProperties.map((property) => (
            <div key={property.id} className="property-card cursor-pointer">
              <Link href={getPropertyLink(property)}>
                <div className="relative h-[300px] overflow-hidden rounded-3xl">
                  <Image
                    src={getImageUrl(property)}
                    alt={property.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="card-image object-cover transition-transform duration-700 hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${config.basePath}/images/placeholder-property.svg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>

                  {/* Tags */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
                    {property.isFeatured && (
                      <span className="px-3 py-1 rounded-full bg-accent-pink text-white text-xs font-semibold uppercase">
                        Featured
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-white/90 text-slate-800 text-xs font-semibold shadow-sm">
                      {getTypeLabel(property.transactionType)}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-slate-600 hover:text-accent-pink transition-all z-10 shadow-sm">
                    <i className="far fa-heart"></i>
                  </button>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className="price-tag text-2xl font-bold font-display text-white mb-2">
                      {formatPrice(property.price, property.transactionType)}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{property.title}</h3>
                    <p className="text-slate-300 text-sm flex items-center">
                      <i className="fas fa-map-marker-alt mr-2 text-accent-blue"></i>
                      {property.address || property.city}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
