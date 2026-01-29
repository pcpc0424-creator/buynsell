'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';
import PropertyList from '@/components/property/PropertyList';
import PropertyFilters, { FilterState } from '@/components/property/PropertyFilters';

// Dynamic import for PropertyMap to avoid SSR issues with Leaflet
const PropertyMap = dynamic(() => import('@/components/map/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full glass-ultra rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-white/50">Loading map...</span>
    </div>
  ),
});

type ViewMode = 'list' | 'map' | 'split';

const defaultFilters: FilterState = {
  transactionType: '',
  propertyType: '',
  city: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
};

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize from URL params
    return {
      transactionType: searchParams.get('transactionType') || '',
      propertyType: searchParams.get('propertyType') || '',
      city: searchParams.get('city') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      bedrooms: searchParams.get('bedrooms') || '',
    };
  });

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      params.set('page', page.toString());
      params.set('limit', '12');
      params.set('featured', 'true');

      if (filters.transactionType) params.set('transactionType', filters.transactionType);
      if (filters.propertyType) params.set('propertyType', filters.propertyType);
      if (filters.city) params.set('city', filters.city);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);

      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        let sortedProperties = data.data;

        // Client-side sorting
        if (sort === 'price-low') {
          sortedProperties = [...sortedProperties].sort((a: any, b: any) => a.price - b.price);
        } else if (sort === 'price-high') {
          sortedProperties = [...sortedProperties].sort((a: any, b: any) => b.price - a.price);
        } else if (sort === 'area') {
          sortedProperties = [...sortedProperties].sort((a: any, b: any) => (b.area || 0) - (a.area || 0));
        }

        setProperties(sortedProperties);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, sort]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    router.replace(`/properties${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
  };

  const handlePropertySelect = (id: string) => {
    setSelectedPropertyId(id);
    // Scroll to the property card in list view
    if (viewMode === 'split') {
      const element = document.getElementById(`property-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const totalPages = Math.ceil(total / 12);

  // Render pagination component
  const renderPagination = () => {
    if (totalPages <= 1 || loading) return null;

    return (
      <div className="flex justify-center mt-8 space-x-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg glass-ultra text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`px-4 py-2 rounded-lg transition-all ${
                page === pageNum
                  ? 'btn-premium text-white'
                  : 'glass-ultra text-white hover:bg-white/10'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 rounded-lg glass-ultra text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  return (
    <>
      <Header />
      <PropertyCategories />

      <section className="py-12">
        <div className={`mx-auto px-6 lg:px-8 ${viewMode === 'split' ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-2">
                Browse <span className="gradient-text">Properties</span>
              </h1>
              <p className="text-white/50">Find your perfect property from our listings</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 glass-ultra rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-accent-blue text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <i className="fas fa-list mr-2"></i>List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-accent-blue text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <i className="fas fa-map mr-2"></i>Map
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hidden lg:block ${
                  viewMode === 'split'
                    ? 'bg-accent-blue text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <i className="fas fa-columns mr-2"></i>Split
              </button>
            </div>
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters */}
              <div className="lg:col-span-1">
                <PropertyFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                />
              </div>

              {/* Listings */}
              <div className="lg:col-span-3">
                <PropertyList
                  properties={properties}
                  loading={loading}
                  total={total}
                  sort={sort}
                  onSortChange={handleSortChange}
                />
                {renderPagination()}
              </div>
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters */}
              <div className="lg:col-span-1">
                <PropertyFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                />
              </div>

              {/* Map */}
              <div className="lg:col-span-3">
                <div className="glass-ultra rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-white/60">
                      Showing <span className="text-white font-semibold">{properties.length}</span> of{' '}
                      <span className="text-white font-semibold">{total}</span> properties on map
                    </p>
                  </div>
                </div>
                <div className="glass-ultra rounded-2xl overflow-hidden" style={{ height: '600px' }}>
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
                    </div>
                  ) : (
                    <PropertyMap
                      properties={properties}
                      selectedPropertyId={selectedPropertyId}
                      onPropertySelect={handlePropertySelect}
                      className="h-full w-full"
                    />
                  )}
                </div>
                {renderPagination()}
              </div>
            </div>
          )}

          {/* Split View */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Filters - Narrow */}
              <div className="lg:col-span-2">
                <PropertyFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                />
              </div>

              {/* Property List - Scrollable */}
              <div className="lg:col-span-5">
                <div className="sticky top-24">
                  <div className="glass-ultra rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-white/60 text-sm">
                        <span className="text-white font-semibold">{total}</span> properties
                      </p>
                      <select
                        value={sort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="form-select w-auto text-sm py-1"
                      >
                        <option value="newest">Newest</option>
                        <option value="price-low">Price: Low</option>
                        <option value="price-high">Price: High</option>
                        <option value="area">Area</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="glass-ultra rounded-2xl p-4 animate-pulse">
                            <div className="h-32 bg-white/10 rounded-xl mb-3"></div>
                            <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-white/10 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : properties.length === 0 ? (
                      <div className="glass-ultra rounded-2xl p-8 text-center">
                        <i className="fas fa-home text-4xl text-white/20 mb-4"></i>
                        <p className="text-white/50">No properties found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {properties.map((property: any) => (
                          <div
                            key={property.id}
                            id={`property-${property.id}`}
                            onClick={() => handlePropertySelect(property.id)}
                            className={`glass-ultra rounded-2xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-accent-blue ${
                              selectedPropertyId === property.id
                                ? 'ring-2 ring-accent-blue bg-accent-blue/10'
                                : ''
                            }`}
                          >
                            <div className="flex">
                              <div className="relative w-32 h-32 flex-shrink-0">
                                <img
                                  src={property.mainImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300'}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                                <span
                                  className={`absolute top-2 left-2 px-2 py-0.5 rounded text-white text-xs font-medium ${
                                    property.transactionType === 'SALE'
                                      ? 'bg-accent-blue'
                                      : 'bg-accent-purple'
                                  }`}
                                >
                                  {property.transactionType === 'SALE' ? 'Sale' : 'Rent'}
                                </span>
                              </div>
                              <div className="flex-1 p-3">
                                <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
                                  {property.title}
                                </h3>
                                <p className="text-white/50 text-xs mb-2">
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {property.city}
                                </p>
                                <div className="flex items-center gap-3 text-white/40 text-xs mb-2">
                                  {property.bedrooms > 0 && (
                                    <span><i className="fas fa-bed mr-1"></i>{property.bedrooms}</span>
                                  )}
                                  {property.bathrooms > 0 && (
                                    <span><i className="fas fa-bath mr-1"></i>{property.bathrooms}</span>
                                  )}
                                  {property.area > 0 && (
                                    <span><i className="fas fa-ruler-combined mr-1"></i>{property.area}sqm</span>
                                  )}
                                </div>
                                <p className="text-accent-blue font-bold text-sm">
                                  {new Intl.NumberFormat('en-PH', {
                                    style: 'currency',
                                    currency: 'PHP',
                                    maximumFractionDigits: 0,
                                  }).format(property.price)}
                                  {property.transactionType === 'RENT' && '/mo'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {renderPagination()}
                  </div>
                </div>
              </div>

              {/* Map - Sticky */}
              <div className="lg:col-span-5">
                <div className="sticky top-24 glass-ultra rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 150px)' }}>
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
                    </div>
                  ) : (
                    <PropertyMap
                      properties={properties}
                      selectedPropertyId={selectedPropertyId}
                      onPropertySelect={handlePropertySelect}
                      className="h-full w-full"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Services />
      <Footer />

      {/* Leaflet popup styling for dark theme */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: rgba(30, 30, 40, 0.95);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        .leaflet-popup-content h3 {
          color: white;
        }
        .leaflet-popup-content p {
          color: rgba(255, 255, 255, 0.6);
        }
        .leaflet-popup-tip {
          background: rgba(30, 30, 40, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .leaflet-popup-close-button:hover {
          color: white !important;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </>
  );
}
