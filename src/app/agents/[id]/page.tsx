import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';

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
    soldProperties: 180,
    specialization: ['Luxury Homes', 'Condos'],
    languages: ['English', 'Filipino', 'Mandarin'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: `Sarah is a dedicated real estate professional with over 8 years of experience in the Philippine property market. Specializing in luxury homes and high-end condominiums, she has helped hundreds of clients find their dream properties in Metro Manila's most prestigious locations.

Her deep understanding of the market, combined with her commitment to exceptional client service, has earned her numerous awards and recognition in the industry. Sarah is known for her attention to detail, negotiation skills, and ability to match clients with properties that perfectly suit their lifestyle and investment goals.`,
    achievements: ['Top Performer 2023', 'Luxury Property Specialist', '100+ Closed Deals'],
    areas: ['Makati City', 'BGC', 'Rockwell'],
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Property Specialist',
    rating: 4.8,
    reviews: 98,
    listings: 38,
    experience: 6,
    soldProperties: 120,
    specialization: ['Commercial', 'Investment'],
    languages: ['English', 'Filipino', 'Mandarin'],
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: `Michael specializes in commercial properties and investment opportunities. With a background in finance, he provides valuable insights for investors looking to maximize their returns in the Philippine real estate market.`,
    achievements: ['Investment Expert', 'Commercial Property Specialist'],
    areas: ['Makati CBD', 'Ortigas', 'BGC'],
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Luxury Expert',
    rating: 5.0,
    reviews: 85,
    listings: 32,
    experience: 10,
    soldProperties: 150,
    specialization: ['Luxury', 'Beachfront'],
    languages: ['English', 'Filipino', 'Spanish'],
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: `Emily is the go-to agent for ultra-luxury properties and beachfront estates. With 10 years of experience, she has closed some of the highest-value deals in the Philippine real estate market.`,
    achievements: ['Luxury Expert Certified', 'Top Sales 2022-2023'],
    areas: ['Forbes Park', 'Dasmarinas Village', 'Boracay'],
  },
];

// Mock listings for the agent
const agentListings = [
  {
    id: 1,
    title: 'Modern Villa with Pool',
    address: 'Makati City',
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
    address: 'BGC, Taguig',
    price: '₱45,000,000',
    type: 'For Sale',
    bedrooms: 5,
    bathrooms: 4,
    area: 420,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    title: 'Premium Penthouse',
    address: 'Rockwell, Makati',
    price: '₱85,000,000',
    type: 'For Sale',
    bedrooms: 3,
    bathrooms: 3,
    area: 280,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  },
];

function getAgent(id: string) {
  return agents.find((a) => a.id === parseInt(id));
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const agent = getAgent(params.id);

  if (!agent) {
    notFound();
  }

  return (
    <>
      <Header />
      <PropertyCategories />

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <i className="fas fa-chevron-right text-xs"></i>
            <Link href="/agents" className="hover:text-white transition-colors">
              Agents
            </Link>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-white">{agent.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Agent Profile Card */}
            <div className="lg:col-span-1">
              <div className="glass-ultra rounded-3xl overflow-hidden sticky top-24">
                {/* Cover Image */}
                <div className="h-32 bg-gradient-to-br from-accent-blue/30 to-accent-purple/30"></div>

                {/* Profile */}
                <div className="p-6 -mt-16 text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      fill
                      className="object-cover rounded-2xl ring-4 ring-dark-950"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 ring-4 ring-dark-950 flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                  </div>

                  <h1 className="text-2xl font-display font-bold text-white mb-1">{agent.name}</h1>
                  <p className="text-white/50 mb-4">{agent.role}</p>

                  {/* Rating */}
                  <div className="flex items-center justify-center space-x-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star text-sm ${
                          i < Math.floor(agent.rating) ? 'text-yellow-400' : 'text-white/20'
                        }`}
                      ></i>
                    ))}
                    <span className="text-white font-semibold ml-2">{agent.rating}</span>
                    <span className="text-white/40">({agent.reviews} reviews)</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold gradient-text">{agent.listings}</p>
                      <p className="text-white/40 text-xs">Listings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold gradient-text">{agent.soldProperties}</p>
                      <p className="text-white/40 text-xs">Sold</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold gradient-text">{agent.experience}</p>
                      <p className="text-white/40 text-xs">Years Exp.</p>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="space-y-3">
                    <button className="w-full py-3 rounded-xl btn-premium text-white font-semibold">
                      <i className="fas fa-envelope mr-2"></i>Send Message
                    </button>
                    <button className="w-full py-3 rounded-xl glass-ultra text-white font-medium hover:bg-white/10 transition-all">
                      <i className="fas fa-phone mr-2"></i>Request Call
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="glass-ultra rounded-3xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">About {agent.name.split(' ')[0]}</h2>
                <p className="text-white/60 leading-relaxed whitespace-pre-line">{agent.bio}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specialization */}
                <div className="glass-ultra rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    <i className="fas fa-star mr-2 text-accent-blue"></i>Specialization
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialization.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-sm"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="glass-ultra rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    <i className="fas fa-globe mr-2 text-accent-purple"></i>Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3 py-1.5 rounded-lg bg-accent-purple/10 text-accent-purple text-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Areas */}
                <div className="glass-ultra rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    <i className="fas fa-map-marker-alt mr-2 text-accent-pink"></i>Service Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.areas.map((area) => (
                      <span
                        key={area}
                        className="px-3 py-1.5 rounded-lg bg-accent-pink/10 text-accent-pink text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div className="glass-ultra rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    <i className="fas fa-trophy mr-2 text-accent-cyan"></i>Achievements
                  </h3>
                  <div className="space-y-2">
                    {agent.achievements.map((achievement) => (
                      <div key={achievement} className="flex items-center space-x-2">
                        <i className="fas fa-check text-accent-cyan text-xs"></i>
                        <span className="text-white/70 text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Listings */}
              <div className="glass-ultra rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    <i className="fas fa-building mr-2 text-accent-blue"></i>
                    Active Listings
                  </h2>
                  <Link
                    href={`/properties?agent=${agent.id}`}
                    className="text-accent-blue hover:text-accent-purple transition-colors text-sm"
                  >
                    View All <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agentListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/properties/house/${listing.id}`}
                      className="glass-ultra rounded-xl overflow-hidden hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="relative h-32">
                        <Image
                          src={listing.image}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-white text-xs ${
                              listing.type === 'For Sale' ? 'bg-accent-blue/90' : 'bg-accent-purple/90'
                            }`}
                          >
                            {listing.type}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="text-white font-medium text-sm truncate">{listing.title}</h4>
                        <p className="text-white/40 text-xs mb-2">{listing.address}</p>
                        <p className="text-accent-blue font-semibold text-sm">{listing.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div className="glass-ultra rounded-3xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">
                  <i className="fas fa-paper-plane mr-2 text-accent-blue"></i>
                  Contact {agent.name.split(' ')[0]}
                </h2>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Your Name" className="form-input" />
                    <input type="email" placeholder="Your Email" className="form-input" />
                  </div>
                  <input type="tel" placeholder="Your Phone" className="form-input" />
                  <select className="form-select">
                    <option value="">I&apos;m interested in...</option>
                    <option value="buying">Buying a property</option>
                    <option value="selling">Selling my property</option>
                    <option value="renting">Renting a property</option>
                    <option value="investment">Investment consultation</option>
                    <option value="other">Other inquiries</option>
                  </select>
                  <textarea
                    placeholder="Your message..."
                    rows={4}
                    className="form-textarea"
                  ></textarea>
                  <button type="submit" className="w-full py-3 rounded-xl btn-premium text-white font-semibold">
                    Send Message <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Services />
      <Footer />
    </>
  );
}
