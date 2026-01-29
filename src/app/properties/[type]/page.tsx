import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';

// Property type configurations
const propertyTypeConfig: Record<string, { title: string; subtitle: string; icon: string }> = {
  house: {
    title: 'House & Lot',
    subtitle: 'Find your perfect home with land ownership',
    icon: 'fa-home',
  },
  condo: {
    title: 'Condominium',
    subtitle: 'Modern living in prime locations',
    icon: 'fa-building',
  },
  townhouse: {
    title: 'Townhouse',
    subtitle: 'Perfect balance of space and community',
    icon: 'fa-city',
  },
  commercial: {
    title: 'Commercial',
    subtitle: 'Business and investment properties',
    icon: 'fa-store',
  },
  lot: {
    title: 'Lot',
    subtitle: 'Build your dream from the ground up',
    icon: 'fa-map',
  },
  'new-development': {
    title: 'New Development',
    subtitle: 'Pre-selling properties with great potential',
    icon: 'fa-hammer',
  },
};

// Mock data - will be replaced with actual data from API
const mockProperties: Record<string, Array<{
  id: number;
  title: string;
  address: string;
  price: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
}>> = {
  house: [
    {
      id: 1,
      title: 'Modern Villa with Pool',
      address: 'Makati City, Metro Manila',
      price: '₱25,000,000',
      type: 'For Sale',
      bedrooms: 4,
      bathrooms: 3,
      area: 350,
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Luxury Family Home',
      address: 'BGC, Taguig City',
      price: '₱45,000,000',
      type: 'For Sale',
      bedrooms: 5,
      bathrooms: 4,
      area: 420,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'Cozy Suburban House',
      address: 'Quezon City',
      price: '₱85,000/mo',
      type: 'For Rent',
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
    },
    {
      id: 4,
      title: 'Contemporary Design Home',
      address: 'Alabang, Muntinlupa',
      price: '₱18,500,000',
      type: 'For Sale',
      bedrooms: 4,
      bathrooms: 3,
      area: 280,
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    },
    {
      id: 5,
      title: 'Spanish Style Mansion',
      address: 'Forbes Park, Makati',
      price: '₱120,000,000',
      type: 'For Sale',
      bedrooms: 6,
      bathrooms: 5,
      area: 650,
      image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop',
    },
    {
      id: 6,
      title: 'Garden Bungalow',
      address: 'San Juan City',
      price: '₱65,000/mo',
      type: 'For Rent',
      bedrooms: 3,
      bathrooms: 2,
      area: 200,
      image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400&h=300&fit=crop',
    },
  ],
  condo: [
    {
      id: 7,
      title: 'Luxury Penthouse',
      address: 'BGC, Taguig City',
      price: '₱85,000,000',
      type: 'For Sale',
      bedrooms: 3,
      bathrooms: 3,
      area: 250,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    },
    {
      id: 8,
      title: 'Modern Studio Unit',
      address: 'Makati City',
      price: '₱8,500,000',
      type: 'For Sale',
      bedrooms: 0,
      bathrooms: 1,
      area: 32,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    },
    {
      id: 9,
      title: '2BR Condo with Balcony',
      address: 'Ortigas, Pasig',
      price: '₱45,000/mo',
      type: 'For Rent',
      bedrooms: 2,
      bathrooms: 2,
      area: 65,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    },
  ],
  townhouse: [
    {
      id: 10,
      title: 'Modern Townhouse',
      address: 'Pasig City',
      price: '₱15,000,000',
      type: 'For Sale',
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400&h=300&fit=crop',
    },
    {
      id: 11,
      title: 'Corner Townhouse Unit',
      address: 'Quezon City',
      price: '₱12,500,000',
      type: 'For Sale',
      bedrooms: 4,
      bathrooms: 3,
      area: 150,
      image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop',
    },
  ],
  commercial: [
    {
      id: 12,
      title: 'Prime Office Space',
      address: 'Makati CBD',
      price: '₱150,000/mo',
      type: 'For Rent',
      bedrooms: 0,
      bathrooms: 2,
      area: 200,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
    },
    {
      id: 13,
      title: 'Retail Space Ground Floor',
      address: 'BGC, Taguig',
      price: '₱250,000/mo',
      type: 'For Rent',
      bedrooms: 0,
      bathrooms: 1,
      area: 150,
      image: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&h=300&fit=crop',
    },
  ],
  lot: [
    {
      id: 14,
      title: 'Residential Lot',
      address: 'Tagaytay City',
      price: '₱5,000,000',
      type: 'For Sale',
      bedrooms: 0,
      bathrooms: 0,
      area: 500,
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
    },
    {
      id: 15,
      title: 'Commercial Lot',
      address: 'Cavite',
      price: '₱15,000,000',
      type: 'For Sale',
      bedrooms: 0,
      bathrooms: 0,
      area: 1000,
      image: 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=400&h=300&fit=crop',
    },
  ],
  'new-development': [
    {
      id: 16,
      title: 'Pre-selling Condo Unit',
      address: 'BGC, Taguig',
      price: '₱12,000,000',
      type: 'Pre-selling',
      bedrooms: 2,
      bathrooms: 2,
      area: 60,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    },
    {
      id: 17,
      title: 'New Subdivision House',
      address: 'Laguna',
      price: '₱8,500,000',
      type: 'Pre-selling',
      bedrooms: 3,
      bathrooms: 2,
      area: 100,
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=300&fit=crop',
    },
  ],
};

export function generateStaticParams() {
  return Object.keys(propertyTypeConfig).map((type) => ({
    type,
  }));
}

export function generateMetadata({ params }: { params: { type: string } }): Metadata {
  const config = propertyTypeConfig[params.type];
  if (!config) {
    return { title: 'Properties | Buy & Sell' };
  }
  return {
    title: `${config.title} Properties | Buy & Sell`,
    description: config.subtitle,
    openGraph: {
      title: `${config.title} Properties | Buy & Sell`,
      description: config.subtitle,
    },
  };
}

export default function PropertyTypePage({ params }: { params: { type: string } }) {
  const config = propertyTypeConfig[params.type];

  if (!config) {
    notFound();
  }

  const properties = mockProperties[params.type] || [];

  return (
    <>
      <Header />
      <PropertyCategories activeType={params.type} />

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              <span className="gradient-text">{config.title}</span> Properties
            </h1>
            <p className="text-white/50">{config.subtitle}</p>
          </div>

          {/* Property Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {properties.map((property) => (
              <div key={property.id} className="property-card glass-ultra rounded-2xl overflow-hidden">
                <div className="property-image h-48 relative">
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div
                    className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-medium ${
                      property.type === 'For Sale'
                        ? 'bg-accent-blue/90'
                        : property.type === 'For Rent'
                        ? 'bg-accent-purple/90'
                        : 'bg-accent-cyan/90'
                    }`}
                  >
                    {property.type}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-white font-semibold mb-2">{property.title}</h3>
                  <p className="text-white/50 text-sm mb-3">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    {property.address}
                  </p>
                  <div className="flex items-center gap-4 text-white/40 text-sm mb-4">
                    {property.bedrooms > 0 && (
                      <span>
                        <i className="fas fa-bed mr-1"></i>
                        {property.bedrooms} Beds
                      </span>
                    )}
                    {property.bathrooms > 0 && (
                      <span>
                        <i className="fas fa-bath mr-1"></i>
                        {property.bathrooms} Baths
                      </span>
                    )}
                    <span>
                      <i className="fas fa-ruler-combined mr-1"></i>
                      {property.area} sqm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-accent-blue font-bold text-lg">{property.price}</span>
                    <Link
                      href={`/properties/${params.type}/${property.id}`}
                      className="text-white/50 hover:text-accent-blue transition-colors text-sm"
                    >
                      View Details <i className="fas fa-arrow-right ml-1"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View More */}
          {properties.length > 0 && (
            <div className="text-center">
              <Link
                href={`/properties?type=${params.type}`}
                className="text-accent-blue hover:text-accent-purple transition-colors font-medium"
              >
                View more properties <i className="fas fa-arrow-right ml-2"></i>
              </Link>
            </div>
          )}

          {properties.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                <i className={`fas ${config.icon} text-3xl text-white/30`}></i>
              </div>
              <h3 className="text-white/60 text-lg mb-2">No properties found</h3>
              <p className="text-white/40 text-sm">Check back later for new listings</p>
            </div>
          )}
        </div>
      </section>

      <Services />
      <Footer />
    </>
  );
}
