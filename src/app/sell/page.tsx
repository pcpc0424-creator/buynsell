'use client';

import { useState, useCallback } from 'react';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';

const propertyTypes = [
  { value: 'HOUSE', label: 'House', icon: 'fa-home' },
  { value: 'CONDO', label: 'Condo', icon: 'fa-building' },
  { value: 'TOWNHOUSE', label: 'Townhouse', icon: 'fa-city' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: 'fa-store' },
  { value: 'LOT', label: 'Lot', icon: 'fa-map' },
  { value: 'NEW_DEVELOPMENT', label: 'Pre-selling', icon: 'fa-hammer' },
];

export default function SellPage() {
  const [selectedType, setSelectedType] = useState('HOUSE');
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    transactionType: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: '',
    address: '',
    city: '',
    barangay: '',
    fullName: '',
    email: '',
    phone: '',
    preferredContact: '',
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement listing submission API call
  }, []);

  return (
    <>
      <Header />
      <PropertyCategories />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              <span className="gradient-text">Sell</span> Your Property
            </h1>
            <p className="text-slate-500">List your property and reach thousands of potential buyers</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Type Selection */}
            <div className="glass-ultra rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Property Type</h2>
              <p className="text-slate-500 text-sm mb-6">Select the type of property you want to sell</p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {propertyTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`property-type-card ${selectedType === type.value ? 'selected' : ''}`}
                  >
                    <div className="type-icon">
                      <i className={`fas ${type.icon} text-xl ${selectedType === type.value ? 'text-white' : 'text-slate-500'}`}></i>
                    </div>
                    <h4 className={`text-sm font-medium ${selectedType === type.value ? 'text-white' : 'text-slate-600'}`}>
                      {type.label}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="glass-ultra rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Basic Information</h2>
              <p className="text-slate-500 text-sm mb-6">Provide the essential details about your property</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-2">Property Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Modern 3BR House in Makati"
                    className="form-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Price (PHP)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="form-input pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Listing Type</label>
                    <select
                      name="transactionType"
                      value={formData.transactionType}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="SALE">For Sale</option>
                      <option value="RENT">For Rent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Bedrooms</label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}{n === 5 ? '+' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Bathrooms</label>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n}{n === 4 ? '+' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Floor Area (sqm)</label>
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="0"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your property in detail..."
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="glass-ultra rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Location</h2>
              <p className="text-slate-500 text-sm mb-6">Where is your property located?</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-2">Full Address</label>
                  <div className="relative">
                    <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter complete address"
                      className="form-input pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">City</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select city</option>
                      <option value="makati">Makati City</option>
                      <option value="bgc">BGC, Taguig</option>
                      <option value="quezon">Quezon City</option>
                      <option value="manila">Manila</option>
                      <option value="pasig">Pasig City</option>
                      <option value="cebu">Cebu City</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Barangay</label>
                    <input
                      type="text"
                      name="barangay"
                      value={formData.barangay}
                      onChange={handleChange}
                      placeholder="Enter barangay"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="glass-ultra rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Property Photos</h2>
              <p className="text-slate-500 text-sm mb-6">Upload high-quality photos (max 10 photos)</p>

              <div className="upload-zone">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-cloud-upload-alt text-2xl text-accent-blue"></i>
                </div>
                <h4 className="text-white font-medium mb-2">Drag & drop photos here</h4>
                <p className="text-slate-400 text-sm mb-2">or click to browse</p>
                <p className="text-slate-400 text-xs">JPG, PNG, WEBP (Max 5MB each)</p>
                <input type="file" className="hidden" id="fileInput" multiple accept="image/*" />
              </div>
            </div>

            {/* Contact Information */}
            <div className="glass-ultra rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Contact Information</h2>
              <p className="text-slate-500 text-sm mb-6">How can buyers reach you?</p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+63 900 000 0000"
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Preferred Contact</label>
                    <select
                      name="preferredContact"
                      value={formData.preferredContact}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select method</option>
                      <option value="phone">Phone Call</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-400 text-sm">
                By submitting, you agree to our{' '}
                <a href="/terms" className="text-accent-blue hover:underline">Terms of Service</a>
              </p>
              <button type="submit" className="btn-premium px-10 py-4 rounded-xl text-white font-semibold">
                Submit Listing <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </form>
        </div>
      </section>

      <Services />
      <Footer />
    </>
  );
}
