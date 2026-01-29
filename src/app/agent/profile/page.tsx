'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { AgentHeader } from '@/components/agent';
import { apiUrl } from '@/lib/config';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  tier: string;
  points: number;
  createdAt: string;
  agentProfile: {
    id: string;
    bio: string | null;
    licenseNumber: string | null;
    specialization: string[];
    yearsExperience: number;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
  } | null;
  _count: {
    listings: number;
    inquiries: number;
  };
}

const SPECIALIZATION_OPTIONS = [
  'Residential',
  'Commercial',
  'Industrial',
  'Land',
  'Luxury',
  'Foreclosure',
  'Rental',
  'New Construction',
];

export default function AgentProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    licenseNumber: '',
    specialization: [] as string[],
    yearsExperience: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/users/me'));
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      setProfile(result.data);
      setFormData({
        name: result.data.name || '',
        phone: result.data.phone || '',
        bio: result.data.agentProfile?.bio || '',
        licenseNumber: result.data.agentProfile?.licenseNumber || '',
        specialization: result.data.agentProfile?.specialization || [],
        yearsExperience: result.data.agentProfile?.yearsExperience || 0,
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(apiUrl('/api/users/me'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setProfile(result.data);
      setSuccess('Profile updated successfully!');

      // Update session if name changed
      if (formData.name !== session?.user?.name) {
        await updateSession({ name: formData.name });
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        const res = await fetch(apiUrl('/api/users/me/avatar'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to upload image');
        }

        setProfile((prev) =>
          prev ? { ...prev, image: result.data.imageUrl } : null
        );
        setSuccess('Profile image updated!');
        await updateSession({ image: result.data.imageUrl });
        setTimeout(() => setSuccess(null), 3000);
        setUploadingImage(false);
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profile?.image) return;

    setUploadingImage(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/users/me/avatar'), {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove image');
      }

      setProfile((prev) => (prev ? { ...prev, image: null } : null));
      setSuccess('Profile image removed');
      await updateSession({ image: null });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  if (loading) {
    return (
      <>
        <AgentHeader title="My Profile" subtitle="Manage your agent profile" />
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-purple"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AgentHeader title="My Profile" subtitle="Manage your agent profile" />

      <div className="p-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 glass-ultra rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400/70 hover:text-red-400"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 glass-ultra rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center text-green-400">
              <i className="fas fa-check-circle mr-3"></i>
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="glass-ultra rounded-2xl p-6 text-center">
              {/* Profile Image */}
              <div className="relative inline-block mb-4">
                <div
                  className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-100 cursor-pointer group"
                  onClick={handleImageClick}
                >
                  {profile?.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name || 'Profile'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-purple to-accent-pink text-white text-4xl font-bold">
                      {(profile?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <i className="fas fa-camera text-white text-2xl"></i>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {profile?.image && (
                  <button
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {profile?.name || 'Agent'}
              </h2>
              <p className="text-slate-500 text-sm mb-4">{profile?.email}</p>

              {/* Verification Badge */}
              {profile?.agentProfile?.isVerified && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm mb-4">
                  <i className="fas fa-check-circle mr-2"></i>
                  Verified Agent
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-100 rounded-xl p-4">
                  <p className="text-2xl font-bold text-slate-800">
                    {profile?._count?.listings || 0}
                  </p>
                  <p className="text-slate-500 text-xs">Listings</p>
                </div>
                <div className="bg-slate-100 rounded-xl p-4">
                  <p className="text-2xl font-bold text-slate-800">
                    {profile?._count?.inquiries || 0}
                  </p>
                  <p className="text-slate-500 text-xs">Inquiries</p>
                </div>
              </div>

              {/* Rating */}
              {profile?.agentProfile && (
                <div className="mt-4 bg-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fas fa-star text-sm ${
                          star <= Math.round(profile.agentProfile!.rating)
                            ? 'text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      ></i>
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs">
                    {profile.agentProfile.rating.toFixed(1)} ({profile.agentProfile.reviewCount} reviews)
                  </p>
                </div>
              )}

              {/* Member Since */}
              <div className="mt-4 text-slate-400 text-xs">
                <i className="fas fa-calendar mr-1"></i>
                Member since{' '}
                {new Date(profile?.createdAt || '').toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="glass-ultra rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                  <i className="fas fa-user mr-3 text-accent-purple"></i>
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-600 text-sm mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="form-input"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="form-input opacity-50 cursor-not-allowed"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="form-input"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, licenseNumber: e.target.value })
                      }
                      className="form-input"
                      placeholder="PRC License Number"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="glass-ultra rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                  <i className="fas fa-briefcase mr-3 text-accent-purple"></i>
                  Professional Information
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-600 text-sm mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.yearsExperience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearsExperience: parseInt(e.target.value) || 0,
                        })
                      }
                      className="form-input w-32"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm mb-2">
                      Specializations
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALIZATION_OPTIONS.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialization(spec)}
                          className={`px-4 py-2 rounded-lg text-sm transition-all ${
                            formData.specialization.includes(spec)
                              ? 'bg-accent-purple text-white'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm mb-2">
                      Bio / About Me
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={5}
                      className="form-input resize-none"
                      placeholder="Tell potential clients about yourself..."
                      maxLength={1000}
                    />
                    <p className="text-slate-400 text-xs mt-1 text-right">
                      {formData.bio.length}/1000
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-premium px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
