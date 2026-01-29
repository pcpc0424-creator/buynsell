import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { PropertyCategories } from '@/components/property';

const services = [
  {
    icon: 'fa-home',
    title: 'Property Buying',
    description: 'Find your dream home with our extensive listing of houses, condos, townhouses, and commercial properties across the Philippines.',
    features: ['Verified Listings', 'Virtual Tours', 'Price Comparison', 'Neighborhood Info'],
    color: 'from-accent-blue/20 to-accent-blue/10',
    iconColor: 'text-accent-blue',
  },
  {
    icon: 'fa-tag',
    title: 'Property Selling',
    description: 'List your property and reach thousands of potential buyers. Our platform provides maximum visibility for your listings.',
    features: ['Professional Photos', 'Wide Reach', 'Price Analytics', 'Agent Support'],
    color: 'from-accent-purple/20 to-accent-purple/10',
    iconColor: 'text-accent-purple',
  },
  {
    icon: 'fa-key',
    title: 'Property Rental',
    description: 'Whether you are looking to rent or lease out your property, we connect landlords with quality tenants.',
    features: ['Tenant Screening', 'Lease Templates', 'Payment Tracking', 'Maintenance Support'],
    color: 'from-accent-pink/20 to-accent-pink/10',
    iconColor: 'text-accent-pink',
  },
  {
    icon: 'fa-user-tie',
    title: 'Agent Services',
    description: 'Connect with licensed real estate agents who can guide you through every step of your property journey.',
    features: ['Licensed Agents', 'Local Expertise', 'Negotiation Help', 'Paperwork Assistance'],
    color: 'from-accent-cyan/20 to-accent-cyan/10',
    iconColor: 'text-accent-cyan',
  },
  {
    icon: 'fa-calculator',
    title: 'Property Valuation',
    description: 'Get accurate property valuations based on market data, location analysis, and property features.',
    features: ['Market Analysis', 'Comparative Pricing', 'Investment Insights', 'Trend Reports'],
    color: 'from-green-500/20 to-green-500/10',
    iconColor: 'text-green-500',
  },
  {
    icon: 'fa-file-contract',
    title: 'Legal Assistance',
    description: 'Navigate property transactions with confidence. We provide guidance on legal requirements and documentation.',
    features: ['Title Verification', 'Contract Review', 'Tax Guidance', 'Transfer Support'],
    color: 'from-amber-500/20 to-amber-500/10',
    iconColor: 'text-amber-500',
  },
];

const stats = [
  { value: '10,000+', label: 'Properties Listed' },
  { value: '5,000+', label: 'Happy Clients' },
  { value: '500+', label: 'Licensed Agents' },
  { value: '50+', label: 'Cities Covered' },
];

export default function ServicesPage() {
  return (
    <>
      <Header />
      <PropertyCategories />

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-slate-800 mb-6">
              Our <span className="gradient-text">Services</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Comprehensive real estate services to help you buy, sell, or rent properties with confidence
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-ultra rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="glass-ultra rounded-2xl p-8 hover:shadow-xl transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${service.icon} text-2xl ${service.iconColor}`}></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">{service.title}</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-600 text-sm">
                      <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="glass-ultra rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-display font-bold text-slate-800 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-slate-500 mb-8 max-w-xl mx-auto">
              Whether you are buying, selling, or renting, our team is here to help you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/properties?transaction=SALE"
                className="btn-premium text-white font-semibold px-8 py-4 rounded-full"
              >
                <i className="fas fa-search mr-2"></i>
                Browse Properties
              </Link>
              <Link
                href="/contact"
                className="text-slate-600 hover:text-accent-blue font-semibold px-8 py-4 rounded-full border border-slate-300 hover:border-accent-blue transition-all"
              >
                <i className="fas fa-envelope mr-2"></i>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
