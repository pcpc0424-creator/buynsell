'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';
import { apiUrl } from '@/lib/config';

// Property type configurations
const propertyTypeConfig: Record<string, { title: string; subtitle: string; icon: string; dbType: string }> = {
  house: {
    title: 'House & Lot',
    subtitle: 'Find your perfect home with land ownership',
    icon: 'fa-home',
    dbType: 'HOUSE',
  },
  condo: {
    title: 'Condominium',
    subtitle: 'Modern living in prime locations',
    icon: 'fa-building',
    dbType: 'CONDO',
  },
  townhouse: {
    title: 'Townhouse',
    subtitle: 'Perfect balance of space and community',
    icon: 'fa-city',
    dbType: 'TOWNHOUSE',
  },
  commercial: {
    title: 'Commercial',
    subtitle: 'Business and investment properties',
    icon: 'fa-store',
    dbType: 'COMMERCIAL',
  },
  lot: {
    title: 'Lot',
    subtitle: 'Build your dream from the ground up',
    icon: 'fa-map',
    dbType: 'LOT',
  },
  'new-development': {
    title: 'New Development',
    subtitle: 'Pre-selling properties with great potential',
    icon: 'fa-hammer',
    dbType: 'NEW_DEVELOPMENT',
  },
};

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  transactionType: 'SALE' | 'RENT';
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  mainImage: string;
  latitude: number | null;
  longitude: number | null;
}

function formatPrice(price: number, type: 'SALE' | 'RENT'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + (type === 'RENT' ? '/mo' : '');
}

export default function PropertyTypePage({ params }: { params: { type: string } }) {
  const config = propertyTypeConfig[params.type];
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!config) return;

    const fetchProperties = async () => {
      try {
        setLoading(true);
        const res = await fetch(apiUrl(`/api/listings?propertyType=${config.dbType}&status=APPROVED&limit=12`));
        const data = await res.json();

        if (data.success) {
          setProperties(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch properties');
        }
      } catch {
        setError('Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [config]);

  if (!config) {
    notFound();
  }

  // Get properties with valid coordinates for the map
  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);

  // Calculate map center
  const mapCenter = propertiesWithCoords.length > 0
    ? {
        lat: propertiesWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / propertiesWithCoords.length,
        lng: propertiesWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / propertiesWithCoords.length,
      }
    : { lat: 14.5995, lng: 120.9842 }; // Default: Manila

  return (
    <>
      <Header />
      <PropertyCategories activeType={params.type} />

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-slate-800 mb-4">
              <span className="gradient-text">{config.title}</span> Properties
            </h1>
            <p className="text-slate-500">{config.subtitle}</p>
          </div>

          {/* View Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setShowMap(false)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  !showMap ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-th-large mr-2"></i>Grid View
              </button>
              <button
                onClick={() => setShowMap(true)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  showMap ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-map mr-2"></i>Map View
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
              <p className="text-red-400">{error}</p>
            </div>
          ) : showMap ? (
            /* Map View */
            <div className="space-y-6">
              {/* Google Map */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                <iframe
                  src={`https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="500"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Properties Map"
                />
              </div>

              {/* Property List Below Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${params.type}/${property.id}`}
                    className="glass-ultra rounded-xl p-4 flex items-center space-x-4 hover:bg-slate-100 transition-all"
                  >
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={property.mainImage || 'https://via.placeholder.com/100x80'}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-800 font-medium text-sm truncate">{property.title}</h4>
                      <p className="text-slate-500 text-xs truncate">{property.address}, {property.city}</p>
                      <p className="text-accent-blue font-semibold text-sm mt-1">
                        {formatPrice(property.price, property.transactionType)}
                      </p>
                    </div>
                    {property.latitude && property.longitude && (
                      <i className="fas fa-map-marker-alt text-accent-blue"></i>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            /* Grid View */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${params.type}/${property.id}`}
                    className="property-card glass-ultra rounded-2xl overflow-hidden group"
                  >
                    <div className="h-48 relative overflow-hidden">
                      <Image
                        src={property.mainImage || 'https://via.placeholder.com/400x300'}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-medium ${
                          property.transactionType === 'SALE'
                            ? 'bg-accent-blue/90'
                            : 'bg-accent-purple/90'
                        }`}
                      >
                        For {property.transactionType === 'SALE' ? 'Sale' : 'Rent'}
                      </div>
                      {property.latitude && property.longitude && (
                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                          <i className="fas fa-map-marker-alt text-accent-blue text-sm"></i>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-slate-800 font-semibold mb-2 truncate">{property.title}</h3>
                      <p className="text-slate-500 text-sm mb-3 truncate">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        {property.address}, {property.city}
                      </p>
                      <div className="flex items-center gap-4 text-slate-400 text-sm mb-4">
                        {property.bedrooms !== null && property.bedrooms > 0 && (
                          <span>
                            <i className="fas fa-bed mr-1"></i>
                            {property.bedrooms} Beds
                          </span>
                        )}
                        {property.bathrooms !== null && property.bathrooms > 0 && (
                          <span>
                            <i className="fas fa-bath mr-1"></i>
                            {property.bathrooms} Baths
                          </span>
                        )}
                        {property.area !== null && property.area > 0 && (
                          <span>
                            <i className="fas fa-ruler-combined mr-1"></i>
                            {property.area} sqm
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-accent-blue font-bold text-lg">
                          {formatPrice(property.price, property.transactionType)}
                        </span>
                        <span className="text-slate-500 hover:text-accent-blue transition-colors text-sm">
                          View Details <i className="fas fa-arrow-right ml-1"></i>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View More */}
              {properties.length > 0 && (
                <div className="text-center">
                  <Link
                    href={`/properties?propertyType=${config.dbType}`}
                    className="text-accent-blue hover:text-accent-purple transition-colors font-medium"
                  >
                    View more {config.title.toLowerCase()} properties <i className="fas fa-arrow-right ml-2"></i>
                  </Link>
                </div>
              )}
            </>
          )}

          {!loading && !error && properties.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
                <i className={`fas ${config.icon} text-3xl text-slate-400`}></i>
              </div>
              <h3 className="text-slate-600 text-lg mb-2">No properties found</h3>
              <p className="text-slate-400 text-sm">Check back later for new listings</p>
            </div>
          )}
        </div>
      </section>

      <Services />
      <Footer />
    </>
  );
}
