'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin';
import { apiUrl } from '@/lib/config';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  maxImagesPerListing: number;
  maxImageSize: number;
  requireApproval: boolean;
  featuredListingDuration: number;
}

interface InquirySettings {
  mode: string;
  autoForwardDelay: number;
  notifyAgentByEmail: boolean;
  notifyAgentByApp: boolean;
  notifyAdminByEmail: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Buy & Sell',
    siteDescription: 'Your trusted real estate platform in the Philippines',
    contactEmail: 'contact@buynsell.ph',
    contactPhone: '+63 2 1234 5678',
    maxImagesPerListing: 10,
    maxImageSize: 5,
    requireApproval: true,
    featuredListingDuration: 30,
  });

  const [inquirySettings, setInquirySettings] = useState<InquirySettings>({
    mode: 'MODE_A',
    autoForwardDelay: 24,
    notifyAgentByEmail: true,
    notifyAgentByApp: true,
    notifyAdminByEmail: true,
  });

  const [apiKeys, setApiKeys] = useState({
    paypalClientId: '',
    paypalSecret: '',
    googleMapsApiKey: '',
  });

  const tabs = [
    { id: 'general', label: 'General', icon: 'fa-cog' },
    { id: 'inquiry', label: 'Inquiry Settings', icon: 'fa-envelope' },
    { id: 'listing', label: 'Listing Settings', icon: 'fa-building' },
    { id: 'payment', label: 'Payment', icon: 'fa-credit-card' },
    { id: 'api', label: 'API Keys', icon: 'fa-key' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch general settings and inquiry settings in parallel
      const [generalRes, inquiryRes] = await Promise.all([
        fetch(apiUrl('/api/admin/settings')),
        fetch(apiUrl('/api/inquiries/settings')),
      ]);

      const [generalData, inquiryData] = await Promise.all([
        generalRes.json(),
        inquiryRes.json(),
      ]);

      if (generalData.success && generalData.data) {
        const settings = generalData.data;
        setGeneralSettings({
          siteName: settings.siteName || 'Buy & Sell',
          siteDescription: settings.siteDescription || '',
          contactEmail: settings.contactEmail || '',
          contactPhone: settings.contactPhone || '',
          maxImagesPerListing: settings.maxImagesPerListing || 10,
          maxImageSize: settings.maxImageSize || 5,
          requireApproval: settings.requireApproval ?? true,
          featuredListingDuration: settings.featuredListingDuration || 30,
        });
      }

      if (inquiryData.success && inquiryData.data) {
        const settings = inquiryData.data;
        setInquirySettings({
          mode: settings.mode || 'MODE_A',
          autoForwardDelay: settings.autoForwardDelay || 24,
          notifyAgentByEmail: settings.notifyAgentByEmail ?? true,
          notifyAgentByApp: settings.notifyAgentByApp ?? true,
          notifyAdminByEmail: settings.notifyAdminByEmail ?? true,
        });
      }
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalSettings),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInquiry = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(apiUrl('/api/inquiries/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquirySettings),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save inquiry settings');
      }

      setSuccess('Inquiry settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (activeTab === 'general' || activeTab === 'listing') {
      handleSaveGeneral();
    } else if (activeTab === 'inquiry') {
      handleSaveInquiry();
    } else if (activeTab === 'payment' || activeTab === 'api') {
      // For payment and API keys, these are typically stored in environment variables
      // Show a message explaining this
      setSuccess('Payment and API settings should be configured in environment variables for security.');
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader
          title="System Settings"
          subtitle="Configure platform settings and preferences"
        />
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="System Settings"
        subtitle="Configure platform settings and preferences"
      />

      <div className="p-8">
        {error && (
          <div className="glass-ultra rounded-2xl p-4 mb-6 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-slate-500 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="glass-ultra rounded-2xl p-4 mb-6 border border-green-500/20">
            <div className="flex items-center text-green-400">
              <i className="fas fa-check-circle mr-3"></i>
              <span>{success}</span>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-slate-500 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs */}
          <div className="lg:col-span-1">
            <div className="glass-ultra rounded-2xl p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-accent-blue/10 text-accent-blue'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-white'
                    }`}
                  >
                    <i className={`fas ${tab.icon} w-5`}></i>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="glass-ultra rounded-2xl p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Site Name</label>
                    <input
                      type="text"
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Site Description</label>
                    <textarea
                      value={generalSettings.siteDescription}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                      className="form-textarea"
                      rows={3}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 text-sm font-medium mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={generalSettings.contactEmail}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-sm font-medium mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={generalSettings.contactPhone}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inquiry Settings */}
              {activeTab === 'inquiry' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Inquiry Settings</h3>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Inquiry Mode</label>
                    <select
                      value={inquirySettings.mode}
                      onChange={(e) => setInquirySettings({ ...inquirySettings, mode: e.target.value })}
                      className="form-select"
                    >
                      <option value="MODE_A">Mode A - Admin Only (All inquiries go to admin)</option>
                      <option value="MODE_B">Mode B - Admin Confirms then Forwards to Agent</option>
                    </select>
                    <p className="text-slate-400 text-xs mt-2">
                      Mode A: All inquiries are handled by admin only. Agent phone numbers are never exposed.
                      <br />
                      Mode B: Admin reviews and confirms before forwarding to the respective agent.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">
                      Auto-Forward Delay (hours)
                    </label>
                    <input
                      type="number"
                      value={inquirySettings.autoForwardDelay}
                      onChange={(e) => setInquirySettings({ ...inquirySettings, autoForwardDelay: parseInt(e.target.value) || 0 })}
                      className="form-input"
                      min={0}
                    />
                    <p className="text-slate-400 text-xs mt-2">
                      Set to 0 to disable auto-forwarding. Only applies to Mode B.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inquirySettings.notifyAgentByEmail}
                        onChange={(e) => setInquirySettings({ ...inquirySettings, notifyAgentByEmail: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 bg-slate-100 text-accent-blue focus:ring-accent-blue"
                      />
                      <span className="text-slate-600">Notify agents by email when inquiry is forwarded</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inquirySettings.notifyAgentByApp}
                        onChange={(e) => setInquirySettings({ ...inquirySettings, notifyAgentByApp: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 bg-slate-100 text-accent-blue focus:ring-accent-blue"
                      />
                      <span className="text-slate-600">Notify agents via in-app notification</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inquirySettings.notifyAdminByEmail}
                        onChange={(e) => setInquirySettings({ ...inquirySettings, notifyAdminByEmail: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 bg-slate-100 text-accent-blue focus:ring-accent-blue"
                      />
                      <span className="text-slate-600">Notify admin by email for new inquiries</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Listing Settings */}
              {activeTab === 'listing' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Listing Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 text-sm font-medium mb-2">
                        Max Images Per Listing
                      </label>
                      <input
                        type="number"
                        value={generalSettings.maxImagesPerListing}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, maxImagesPerListing: parseInt(e.target.value) || 10 })}
                        className="form-input"
                        min={1}
                        max={20}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-sm font-medium mb-2">
                        Max Image Size (MB)
                      </label>
                      <input
                        type="number"
                        value={generalSettings.maxImageSize}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, maxImageSize: parseInt(e.target.value) || 5 })}
                        className="form-input"
                        min={1}
                        max={20}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">
                      Featured Listing Duration (days)
                    </label>
                    <input
                      type="number"
                      value={generalSettings.featuredListingDuration}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, featuredListingDuration: parseInt(e.target.value) || 30 })}
                      className="form-input"
                      min={1}
                    />
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.requireApproval}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, requireApproval: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 bg-slate-100 text-accent-blue focus:ring-accent-blue"
                    />
                    <span className="text-slate-600">Require admin approval for all new listings</span>
                  </label>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Payment Settings (PayPal)</h3>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-exclamation-triangle text-yellow-400 mt-0.5"></i>
                      <div>
                        <p className="text-yellow-400 font-medium text-sm">Security Notice</p>
                        <p className="text-slate-500 text-xs mt-1">
                          PayPal credentials should be configured in environment variables for security.
                          Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">PayPal Client ID</label>
                    <input
                      type="text"
                      value={apiKeys.paypalClientId}
                      onChange={(e) => setApiKeys({ ...apiKeys, paypalClientId: e.target.value })}
                      className="form-input"
                      placeholder="Configure in environment variables"
                      disabled
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      Current: {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'Configured' : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">PayPal Secret</label>
                    <input
                      type="password"
                      value={apiKeys.paypalSecret}
                      onChange={(e) => setApiKeys({ ...apiKeys, paypalSecret: e.target.value })}
                      className="form-input"
                      placeholder="Configure in environment variables"
                      disabled
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      Server-side only. Configure PAYPAL_CLIENT_SECRET in .env
                    </p>
                  </div>
                </div>
              )}

              {/* API Keys */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
                      <div>
                        <p className="text-blue-400 font-medium text-sm">Using OpenStreetMap</p>
                        <p className="text-slate-500 text-xs mt-1">
                          This platform uses OpenStreetMap with Nominatim for geocoding, which is free and doesn&apos;t require an API key.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-2">Google Maps API Key (Optional)</label>
                    <input
                      type="text"
                      value={apiKeys.googleMapsApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, googleMapsApiKey: e.target.value })}
                      className="form-input"
                      placeholder="Not required - using OpenStreetMap"
                      disabled
                    />
                    <p className="text-slate-400 text-xs mt-2">
                      If you want to switch to Google Maps, configure GOOGLE_MAPS_API_KEY in your .env file.
                    </p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-premium px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
