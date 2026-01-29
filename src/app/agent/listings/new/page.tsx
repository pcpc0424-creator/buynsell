'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { AgentHeader } from '@/components/agent';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-white/5 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-white/50">Loading map...</span>
    </div>
  ),
});

const propertyTypes = [
  { value: 'HOUSE', label: 'House', icon: 'fa-home' },
  { value: 'CONDO', label: 'Condo', icon: 'fa-building' },
  { value: 'TOWNHOUSE', label: 'Townhouse', icon: 'fa-city' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: 'fa-store' },
  { value: 'LOT', label: 'Lot', icon: 'fa-map' },
  { value: 'NEW_DEVELOPMENT', label: 'Pre-selling', icon: 'fa-hammer' },
];

const propertyStatuses = [
  { value: 'NEW', label: 'Brand New' },
  { value: 'USED', label: 'Resale/Used' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
];

const cities = [
  'Makati', 'Taguig', 'Quezon City', 'Manila', 'Pasig', 'Mandaluyong',
  'San Juan', 'Pasay', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Marikina',
  'Caloocan', 'Cebu City', 'Davao City', 'Tagaytay',
];

interface FormData {
  title: string;
  description: string;
  price: string;
  transactionType: string;
  propertyType: string;
  propertyStatus: string;
  address: string;
  city: string;
  barangay: string;
  latitude: number | null;
  longitude: number | null;
  area: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  floorNumber: string;
  totalFloors: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  price: '',
  transactionType: 'SALE',
  propertyType: 'HOUSE',
  propertyStatus: 'NEW',
  address: '',
  city: '',
  barangay: '',
  latitude: null,
  longitude: null,
  area: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  floorNumber: '',
  totalFloors: '',
};

export default function NewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [images, setImages] = useState<{ url: string; file?: File }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 10;
    const currentCount = images.length + (mainImage ? 1 : 0);
    const allowedCount = Math.min(files.length, maxImages - currentCount);

    if (allowedCount <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < allowedCount; i++) {
        const file = files[i];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Upload failed');
        }

        const imageUrl = data.data.url;

        if (!mainImage) {
          setMainImage(imageUrl);
        } else {
          setImages((prev) => [...prev, { url: imageUrl }]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number, isMain: boolean) => {
    if (isMain) {
      if (images.length > 0) {
        setMainImage(images[0].url);
        setImages((prev) => prev.slice(1));
      } else {
        setMainImage(null);
      }
    } else {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mainImage) {
      setError('Please upload at least one image');
      return;
    }

    if (!formData.title || !formData.price || !formData.address || !formData.city) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        price: parseFloat(formData.price.replace(/,/g, '')),
        transactionType: formData.transactionType,
        propertyType: formData.propertyType,
        propertyStatus: formData.propertyStatus || undefined,
        address: formData.address,
        city: formData.city,
        barangay: formData.barangay || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        parking: formData.parking ? parseInt(formData.parking) : undefined,
        floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : undefined,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
        mainImage: mainImage,
        images: images.map((img, idx) => ({ url: img.url, order: idx })),
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create listing');
      }

      router.push('/agent/listings?created=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('en-PH').format(parseInt(num));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setFormData((prev) => ({ ...prev, price: formatted }));
  };

  const totalSteps = 4;

  return (
    <>
      <AgentHeader
        title="Add New Listing"
        subtitle="Create a new property listing"
      />

      <div className="p-8">
        {/* Progress Steps */}
        <div className="glass-ultra rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s
                      ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {step > s ? <i className="fas fa-check"></i> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-full h-1 mx-2 rounded ${
                      step > s ? 'bg-accent-purple' : 'bg-white/10'
                    }`}
                    style={{ width: '80px' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className={step >= 1 ? 'text-white' : 'text-white/40'}>Basic Info</span>
            <span className={step >= 2 ? 'text-white' : 'text-white/40'}>Details</span>
            <span className={step >= 3 ? 'text-white' : 'text-white/40'}>Location</span>
            <span className={step >= 4 ? 'text-white' : 'text-white/40'}>Photos</span>
          </div>
        </div>

        {error && (
          <div className="glass-ultra rounded-2xl p-4 mb-6 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="glass-ultra rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

              {/* Property Type */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-3">Property Type *</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, propertyType: type.value }))}
                      className={`p-4 rounded-xl text-center transition-all ${
                        formData.propertyType === type.value
                          ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <i className={`fas ${type.icon} text-xl mb-2 block`}></i>
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-3">Transaction Type *</label>
                <div className="flex gap-4">
                  {['SALE', 'RENT'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, transactionType: type }))}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        formData.transactionType === type
                          ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <i className={`fas ${type === 'SALE' ? 'fa-tag' : 'fa-key'} mr-2`}></i>
                      For {type === 'SALE' ? 'Sale' : 'Rent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Property Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Modern 3BR House with Garden in Makati"
                  className="form-input"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Price (PHP) * {formData.transactionType === 'RENT' && '/ month'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₱</span>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              {/* Property Status */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Property Status</label>
                <select
                  name="propertyStatus"
                  value={formData.propertyStatus}
                  onChange={handleChange}
                  className="form-select"
                >
                  {propertyStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your property in detail..."
                  className="form-textarea h-32"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-premium px-8 py-3 rounded-xl text-white font-semibold"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="glass-ultra rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Property Details</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Bedrooms</label>
                  <select
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n === 10 ? '10+' : n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Bathrooms</label>
                  <select
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select</option>
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n === 6 ? '6+' : n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Parking</label>
                  <select
                    name="parking"
                    value={formData.parking}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select</option>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n === 5 ? '5+' : n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Floor Area (sqm)</label>
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

              {(formData.propertyType === 'CONDO' || formData.propertyType === 'COMMERCIAL') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Floor Number</label>
                    <input
                      type="number"
                      name="floorNumber"
                      value={formData.floorNumber}
                      onChange={handleChange}
                      placeholder="e.g., 15"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Total Floors</label>
                    <input
                      type="number"
                      name="totalFloors"
                      value={formData.totalFloors}
                      onChange={handleChange}
                      placeholder="e.g., 30"
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-premium px-8 py-3 rounded-xl text-white font-semibold"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="glass-ultra rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Location</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">City *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Barangay</label>
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

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Full Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete address"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Pin Location on Map
                  {formData.latitude && formData.longitude && (
                    <span className="text-green-400 ml-2">
                      <i className="fas fa-check-circle"></i> Location set
                    </span>
                  )}
                </label>
                <LocationPicker
                  initialLatitude={formData.latitude || undefined}
                  initialLongitude={formData.longitude || undefined}
                  onLocationChange={handleLocationSelect}
                  className="h-[300px]"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="btn-premium px-8 py-3 rounded-xl text-white font-semibold"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="glass-ultra rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Property Photos</h2>

              <div
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-accent-purple/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-purple mx-auto"></div>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-4xl text-white/30 mb-4"></i>
                    <p className="text-white font-medium mb-2">Click to upload photos</p>
                    <p className="text-white/40 text-sm">JPG, PNG, WEBP (Max 5MB each, up to 10 photos)</p>
                  </>
                )}
              </div>

              {/* Main Image */}
              {mainImage && (
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Main Image (shown in listings)
                  </label>
                  <div className="relative w-full h-64 rounded-xl overflow-hidden">
                    <Image
                      src={mainImage}
                      alt="Main property image"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(0, true)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-accent-purple rounded-full text-white text-xs">
                      Main Image
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Images */}
              {images.length > 0 && (
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Additional Images ({images.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden">
                        <Image
                          src={img.url}
                          alt={`Property image ${idx + 2}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx, false)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!mainImage && (
                <p className="text-yellow-400 text-sm">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Please upload at least one image to continue
                </p>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !mainImage}
                  className="btn-premium px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i> Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i> Submit for Review
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Info Box */}
        <div className="glass-ultra rounded-2xl p-6 mt-8">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-accent-blue"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Submission Guidelines</h3>
              <ul className="text-white/50 text-sm space-y-1">
                <li><i className="fas fa-check text-green-400 mr-2"></i>Your listing will be reviewed by our team before going live</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>Review usually takes 1-2 business days</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>You will be notified once approved or if changes are needed</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>Make sure all information is accurate and photos are high quality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
