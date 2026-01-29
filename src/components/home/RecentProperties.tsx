import Image from 'next/image';
import Link from 'next/link';

// Mock data - will be replaced with actual data from API
const properties = [
  {
    id: 1,
    title: 'The Riviera Estate',
    address: 'Makati City, Metro Manila',
    price: '₱85,000,000',
    type: 'For Sale',
    featured: true,
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    title: 'Modern Skyline Condo',
    address: 'BGC, Taguig City',
    price: '₱25,500,000',
    type: 'For Sale',
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: 'Beachfront Villa',
    address: 'Cebu City, Cebu',
    price: '₱120,000/mo',
    type: 'For Rent',
    bedrooms: 4,
    bathrooms: 3,
    area: 320,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    title: 'Urban Loft Space',
    address: 'Quezon City, Metro Manila',
    price: '₱15,800,000',
    type: 'For Sale',
    bedrooms: 1,
    bathrooms: 1,
    area: 65,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
];

export default function RecentProperties() {
  return (
    <section id="properties" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
          <div>
            <span className="inline-block px-5 py-2 glass-ultra rounded-full text-sm text-white/60 mb-6">
              <i className="fas fa-fire mr-2 text-accent-pink"></i>Featured
            </span>
            <h2 className="section-title text-4xl sm:text-5xl lg:text-6xl font-display font-bold">
              Recent <span className="gradient-text">Real Estate</span>
            </h2>
            <p className="text-white/40 text-lg mt-4">Find Your Perfect Properties at the best prices</p>
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
          <div className="lg:col-span-2 lg:row-span-2 property-card cursor-pointer">
            <Link href={`/properties/${properties[0].id}`}>
              <div className="relative h-full min-h-[500px] lg:min-h-[650px]">
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <Image
                    src={properties[0].image}
                    alt={properties[0].title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                    priority
                    className="card-image object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent rounded-3xl"></div>

                {/* Tags */}
                <div className="absolute top-6 left-6 flex items-center space-x-3 z-10">
                  <span className="px-4 py-1.5 rounded-full bg-accent-pink text-white text-xs font-semibold uppercase">
                    Featured
                  </span>
                  <span className="px-4 py-1.5 rounded-full glass-ultra text-white text-xs font-semibold">
                    {properties[0].type}
                  </span>
                </div>

                {/* Favorite Button */}
                <button className="absolute top-6 right-6 w-12 h-12 rounded-full glass-ultra flex items-center justify-center text-white/70 hover:text-accent-pink hover:bg-white/10 transition-all z-10">
                  <i className="far fa-heart text-lg"></i>
                </button>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <div className="price-tag text-3xl font-bold font-display text-white mb-3">
                    {properties[0].price}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{properties[0].title}</h3>
                  <p className="text-white/50 flex items-center mb-4">
                    <i className="fas fa-map-marker-alt mr-2 text-accent-blue"></i>
                    {properties[0].address}
                  </p>
                  <div className="flex items-center space-x-6 text-white/60">
                    <span className="flex items-center">
                      <i className="fas fa-bed mr-2"></i>{properties[0].bedrooms} Beds
                    </span>
                    <span className="flex items-center">
                      <i className="fas fa-bath mr-2"></i>{properties[0].bathrooms} Baths
                    </span>
                    <span className="flex items-center">
                      <i className="fas fa-vector-square mr-2"></i>{properties[0].area} sqm
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Other Properties */}
          {properties.slice(1).map((property) => (
            <div key={property.id} className="property-card cursor-pointer">
              <Link href={`/properties/${property.id}`}>
                <div className="relative h-[300px] overflow-hidden rounded-3xl">
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="card-image object-cover transition-transform duration-700 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent"></div>

                  {/* Tags */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
                    <span className="px-3 py-1 rounded-full glass-ultra text-white text-xs font-semibold">
                      {property.type}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full glass-ultra flex items-center justify-center text-white/70 hover:text-accent-pink transition-all z-10">
                    <i className="far fa-heart"></i>
                  </button>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className="price-tag text-2xl font-bold font-display text-white mb-2">
                      {property.price}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{property.title}</h3>
                    <p className="text-white/50 text-sm flex items-center">
                      <i className="fas fa-map-marker-alt mr-2 text-accent-blue"></i>
                      {property.address}
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
