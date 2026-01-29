import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';

export const metadata: Metadata = {
  title: 'Our Agents | Buy & Sell',
  description: 'Meet our professional real estate agents. Expert guidance for buying, selling, or renting properties in the Philippines.',
  openGraph: {
    title: 'Our Agents | Buy & Sell',
    description: 'Meet our professional real estate agents. Expert guidance for buying, selling, or renting properties.',
  },
};

// Mock data - will be replaced with actual data from API
const agents = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Senior Agent',
    rating: 4.9,
    reviews: 120,
    listings: 45,
    experience: 8,
    specialization: ['Luxury Homes', 'Condos'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Property Specialist',
    rating: 4.8,
    reviews: 98,
    listings: 38,
    experience: 6,
    specialization: ['Commercial', 'Investment'],
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Luxury Expert',
    rating: 5.0,
    reviews: 85,
    listings: 32,
    experience: 10,
    specialization: ['Luxury', 'Beachfront'],
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Commercial Specialist',
    rating: 4.7,
    reviews: 76,
    listings: 29,
    experience: 5,
    specialization: ['Commercial', 'Office Space'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 5,
    name: 'Maria Santos',
    role: 'Residential Expert',
    rating: 4.9,
    reviews: 92,
    listings: 41,
    experience: 7,
    specialization: ['House & Lot', 'Townhouse'],
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 6,
    name: 'James Wilson',
    role: 'Investment Advisor',
    rating: 4.6,
    reviews: 64,
    listings: 25,
    experience: 4,
    specialization: ['Investment', 'Pre-selling'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
];

export default function AgentsPage() {
  return (
    <>
      <Header />
      <PropertyCategories />

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-slate-800 mb-4">
              Our <span className="gradient-text">Agents</span>
            </h1>
            <p className="text-slate-500">Professional real estate agents ready to help you</p>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="agent-card glass-ultra rounded-3xl overflow-hidden cursor-pointer group">
                {/* Image */}
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover transition-all duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 text-slate-800 text-xs font-semibold">
                      Top Rated
                    </span>
                  </div>

                  {/* Name Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                    <p className="text-slate-500 text-sm">{agent.role}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fas fa-star text-sm ${
                            i < Math.floor(agent.rating) ? 'text-yellow-400' : 'text-slate-300'
                          }`}
                        ></i>
                      ))}
                      <span className="text-slate-800 font-semibold ml-2">{agent.rating}</span>
                    </div>
                    <span className="text-slate-400 text-sm">{agent.reviews} reviews</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <span><i className="fas fa-building mr-1.5"></i>{agent.listings} Listings</span>
                    <span><i className="fas fa-briefcase mr-1.5"></i>{agent.experience} Years</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {agent.specialization.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium text-center hover:bg-slate-200 transition-all"
                    >
                      <i className="fas fa-user mr-2"></i>Profile
                    </Link>
                    <button className="flex-1 py-3 rounded-xl btn-premium text-white text-sm font-medium">
                      <i className="fas fa-envelope mr-2"></i>Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Services />
      <Footer />
    </>
  );
}
