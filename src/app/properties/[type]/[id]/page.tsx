'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';
import { apiUrl, config } from '@/lib/config';

interface Agent {
  id: string;
  name: string | null;
  image: string | null;
  agentProfile?: {
    bio: string | null;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    yearsExperience: number;
  } | null;
}

interface ListingImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  propertyStatus: string;
  address: string;
  city: string;
  barangay: string | null;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  mainImage: string;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  agent: Agent;
  images: ListingImage[];
  _count?: {
    inquiries: number;
    favorites: number;
  };
}

export default function PropertyDetailPage({
  params,
}: {
  params: { type: string; id: string };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(apiUrl(`/api/listings/${params.id}`));
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Listing not found');
      }

      setListing(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push(`/login?callbackUrl=/properties/${params.type}/${params.id}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(apiUrl('/api/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: params.id,
          ...inquiryForm,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send inquiry');
      }

      setSubmitSuccess(true);
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number, transactionType: string) => {
    const formatted = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
    return transactionType === 'RENT' ? `${formatted}/mo` : formatted;
  };

  const allImages = listing ? [listing.mainImage, ...listing.images.map((img) => img.url)] : [];

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-32 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-home text-5xl text-slate-300 mb-4"></i>
            <h1 className="text-2xl font-bold text-white mb-2">Property Not Found</h1>
            <p className="text-slate-500 mb-6">{error || 'The property you are looking for does not exist.'}</p>
            <Link href="/properties" className="btn-premium px-6 py-3 rounded-xl text-white">
              Browse Properties
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <PropertyCategories activeType={params.type} />

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <i className="fas fa-chevron-right text-xs"></i>
            <Link href="/properties" className="hover:text-white transition-colors">
              Properties
            </Link>
            <i className="fas fa-chevron-right text-xs"></i>
            <Link href={`/properties?propertyType=${listing.propertyType}`} className="hover:text-slate-800 transition-colors capitalize">
              {listing.propertyType.toLowerCase().replace('_', ' ')}
            </Link>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-slate-800 truncate max-w-[200px]">{listing.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="glass-ultra rounded-3xl overflow-hidden">
                <div className="relative h-[400px] lg:h-[500px]">
                  <Image
                    src={allImages[selectedImageIndex] || listing.mainImage}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span
                      className={`px-4 py-2 rounded-full text-white font-semibold ${
                        listing.transactionType === 'SALE' ? 'bg-accent-blue' : 'bg-accent-purple'
                      }`}
                    >
                      For {listing.transactionType === 'SALE' ? 'Sale' : 'Rent'}
                    </span>
                    {listing.isFeatured && (
                      <span className="px-4 py-2 rounded-full bg-yellow-500 text-white font-semibold">
                        <i className="fas fa-star mr-1"></i>Featured
                      </span>
                    )}
                  </div>
                  <button className="absolute top-4 right-4 w-12 h-12 rounded-full glass-ultra flex items-center justify-center text-slate-600 hover:text-accent-pink transition-all">
                    <i className="far fa-heart text-xl"></i>
                  </button>
                </div>

                {/* Thumbnail Gallery */}
                {allImages.length > 1 && (
                  <div className="p-4 flex gap-3 overflow-x-auto">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                          index === selectedImageIndex ? 'ring-2 ring-accent-blue' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image src={image} alt={`View ${index + 1}`} fill sizes="96px" loading="lazy" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Info */}
              <div className="glass-ultra rounded-3xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-800 mb-2">
                      {listing.title}
                    </h1>
                    <p className="text-slate-500 flex items-center">
                      <i className="fas fa-map-marker-alt mr-2 text-accent-blue"></i>
                      {listing.address}, {listing.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold gradient-text">
                      {formatPrice(listing.price, listing.transactionType)}
                    </div>
                    {listing.area && (
                      <p className="text-slate-400 text-sm">
                        {formatPrice(listing.price / listing.area, listing.transactionType).replace('/mo', '')} / sqm
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {listing.bedrooms !== null && listing.bedrooms > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 text-center">
                      <i className="fas fa-bed text-accent-blue text-xl mb-2"></i>
                      <p className="text-slate-800 font-semibold">{listing.bedrooms}</p>
                      <p className="text-slate-400 text-sm">Bedrooms</p>
                    </div>
                  )}
                  {listing.bathrooms !== null && listing.bathrooms > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 text-center">
                      <i className="fas fa-bath text-accent-purple text-xl mb-2"></i>
                      <p className="text-slate-800 font-semibold">{listing.bathrooms}</p>
                      <p className="text-slate-400 text-sm">Bathrooms</p>
                    </div>
                  )}
                  {listing.area !== null && listing.area > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 text-center">
                      <i className="fas fa-ruler-combined text-accent-pink text-xl mb-2"></i>
                      <p className="text-slate-800 font-semibold">{listing.area}</p>
                      <p className="text-slate-400 text-sm">Floor Area (sqm)</p>
                    </div>
                  )}
                  {listing.parking !== null && listing.parking > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 text-center">
                      <i className="fas fa-car text-accent-cyan text-xl mb-2"></i>
                      <p className="text-slate-800 font-semibold">{listing.parking}</p>
                      <p className="text-slate-400 text-sm">Parking</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {listing.description && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Description</h2>
                    <div className="text-slate-500 leading-relaxed whitespace-pre-line">
                      {listing.description}
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Property Details</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-3 bg-slate-100 rounded-lg p-3">
                      <i className="fas fa-home text-accent-blue w-5"></i>
                      <span className="text-slate-600 text-sm capitalize">{listing.propertyType.toLowerCase().replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-slate-100 rounded-lg p-3">
                      <i className="fas fa-tag text-accent-blue w-5"></i>
                      <span className="text-slate-600 text-sm capitalize">{listing.propertyStatus.toLowerCase().replace('_', ' ')}</span>
                    </div>
                    {listing.floorNumber && (
                      <div className="flex items-center space-x-3 bg-slate-100 rounded-lg p-3">
                        <i className="fas fa-building text-accent-blue w-5"></i>
                        <span className="text-slate-600 text-sm">Floor {listing.floorNumber}{listing.totalFloors ? ` of ${listing.totalFloors}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3 bg-slate-100 rounded-lg p-3">
                      <i className="fas fa-eye text-accent-blue w-5"></i>
                      <span className="text-slate-600 text-sm">{listing.viewCount} views</span>
                    </div>
                  </div>
                </div>

                {/* Location Map */}
                {listing.latitude && listing.longitude && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">
                      <i className="fas fa-map-marker-alt mr-2 text-accent-blue"></i>
                      Location
                    </h2>
                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                      <iframe
                        src={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="350"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Property Location"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-slate-500 text-sm">
                        <i className="fas fa-map-pin mr-1"></i>
                        {listing.address}, {listing.city}
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-blue hover:text-accent-purple text-sm font-medium transition-colors"
                      >
                        <i className="fas fa-directions mr-1"></i>
                        Get Directions
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Agent Card */}
              <div className="glass-ultra rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Listed by</h3>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <Image
                      src={listing.agent.image || `${config.basePath}/images/default-avatar.svg`}
                      alt={listing.agent.name || 'Agent'}
                      fill
                      sizes="64px"
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-semibold flex items-center gap-2">
                      {listing.agent.name}
                      {listing.agent.agentProfile?.isVerified && (
                        <i className="fas fa-check-circle text-accent-blue text-sm"></i>
                      )}
                    </h4>
                    {listing.agent.agentProfile && (
                      <div className="flex items-center text-slate-500 text-sm">
                        <i className="fas fa-star text-yellow-400 mr-1"></i>
                        {listing.agent.agentProfile.rating.toFixed(1)}
                        <span className="mx-1">·</span>
                        {listing.agent.agentProfile.reviewCount} reviews
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/agents/${listing.agent.id}`}
                  className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-all flex items-center justify-center"
                >
                  <i className="fas fa-user mr-2"></i>View Profile
                </Link>
              </div>

              {/* Inquiry Form */}
              <div className="glass-ultra rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Send Inquiry</h3>

                {submitSuccess ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-4xl text-green-400 mb-4"></i>
                    <h4 className="text-slate-800 font-semibold mb-2">Inquiry Sent!</h4>
                    <p className="text-slate-500 text-sm">We&apos;ll get back to you soon.</p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="mt-4 text-accent-blue text-sm hover:underline"
                    >
                      Send another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="form-input"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      className="form-input"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Your Phone"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                      className="form-input"
                    />
                    <textarea
                      placeholder={`I'm interested in "${listing.title}"...`}
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      rows={4}
                      className="form-textarea"
                      required
                    ></textarea>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl btn-premium text-white font-semibold disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>Sending...
                        </>
                      ) : (
                        'Send Inquiry'
                      )}
                    </button>
                    <p className="text-slate-400 text-xs text-center">
                      <i className="fas fa-shield-alt mr-1"></i>
                      Your contact info is kept private
                    </p>
                  </form>
                )}
              </div>

              {/* Share */}
              <div className="glass-ultra rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Share Property</h3>
                <div className="flex space-x-3">
                  <button className="flex-1 py-3 rounded-xl bg-[#1877f2] text-white hover:opacity-90 transition-all">
                    <i className="fab fa-facebook-f"></i>
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-[#1da1f2] text-white hover:opacity-90 transition-all">
                    <i className="fab fa-twitter"></i>
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-[#25d366] text-white hover:opacity-90 transition-all">
                    <i className="fab fa-whatsapp"></i>
                  </button>
                  <button
                    className="flex-1 py-3 rounded-xl glass-ultra text-slate-500 hover:text-slate-800 transition-all"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <i className="fas fa-link"></i>
                  </button>
                </div>
              </div>

              {/* Posted Date */}
              <div className="text-center text-slate-400 text-sm">
                Listed on {new Date(listing.createdAt).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
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
