import Image from 'next/image';
import Link from 'next/link';

// Mock data - will be replaced with actual data from API
const agents = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Senior Agent',
    rating: 4.9,
    reviews: 120,
    listings: 45,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Property Specialist',
    rating: 4.8,
    reviews: 98,
    listings: 38,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Luxury Expert',
    rating: 5.0,
    reviews: 85,
    listings: 32,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Commercial Specialist',
    rating: 4.7,
    reviews: 76,
    listings: 29,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
];

export default function AgentsSection() {
  return (
    <section id="agents" className="py-32 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-accent-purple/10 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-accent-blue/10 to-transparent blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
          <div>
            <span className="inline-block px-5 py-2 glass-ultra rounded-full text-sm text-slate-600 mb-6">
              <i className="fas fa-users mr-2 text-accent-cyan"></i>Our Team
            </span>
            <h2 className="section-title text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-slate-800">
              Meet our <span className="gradient-text">Agents</span>
            </h2>
            <p className="text-slate-500 text-lg mt-4">Professional agents ready to help you</p>
          </div>
          <Link
            href="/agents"
            className="mt-8 lg:mt-0 inline-flex items-center text-accent-blue font-medium hover:text-accent-purple transition-colors group"
          >
            View All Agents
            <i className="fas fa-arrow-right ml-3 group-hover:translate-x-2 transition-transform"></i>
          </Link>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="agent-card glass-ultra rounded-3xl overflow-hidden cursor-pointer group">
              {/* Image */}
              <div className="relative h-80 overflow-hidden">
                <Image
                  src={agent.image}
                  alt={agent.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  loading="lazy"
                  className="agent-image object-cover transition-all duration-600 group-hover:scale-110 group-hover:brightness-110"
                />
                <div className="agent-overlay absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-white/90 text-slate-800 text-xs font-semibold shadow-sm">
                    Top Rated
                  </span>
                </div>

                {/* Name Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                  <p className="text-slate-300 text-sm">{agent.role}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star text-sm ${
                          i < Math.floor(agent.rating) ? 'text-yellow-400' : 'text-slate-200'
                        }`}
                      ></i>
                    ))}
                    <span className="text-slate-800 font-semibold ml-2">{agent.rating}</span>
                  </div>
                  <span className="text-slate-400 text-sm">{agent.reviews} reviews</span>
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
  );
}
