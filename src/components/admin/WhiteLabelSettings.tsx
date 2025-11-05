import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhiteLabelSettings {
  id?: string;
  website_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  meta_description: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  hero_banner_url: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  support_email: string | null;
  enable_crypto: boolean;
  enable_wire_transfers: boolean;
  enable_internal_transfers: boolean;
  enable_loans: boolean;
  enable_bills: boolean;
  enable_investments: boolean;
  enable_statements: boolean;
  enable_mobile_deposit: boolean;
  enable_budgets: boolean;
  enable_request_money: boolean;
}

const WhiteLabelSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | 'hero_banner' | null>(null);
  
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    website_name: 'Heritage Financial',
    logo_url: null,
    favicon_url: null,
    meta_description: 'Secure online banking with modern features and 24/7 support',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    success_color: '#10B981',
    warning_color: '#F59E0B',
    error_color: '#EF4444',
    hero_banner_url: null,
    social_facebook: null,
    social_twitter: null,
    social_linkedin: null,
    social_instagram: null,
    social_youtube: null,
    contact_email: null,
    contact_phone: null,
    contact_address: null,
    support_email: 'support@heritagebk.org',
    enable_crypto: true,
    enable_wire_transfers: true,
    enable_internal_transfers: true,
    enable_loans: true,
    enable_bills: true,
    enable_investments: true,
    enable_statements: true,
    enable_mobile_deposit: true,
    enable_budgets: true,
    enable_request_money: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('white_label_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load white label settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      

      // If we have an ID, update the existing row. Otherwise, insert a new one.
      let query;
      if (settings.id) {
        // Update existing settings
        query = supabase
          .from('white_label_settings')
          .update({
            website_name: settings.website_name,
            logo_url: settings.logo_url,
            favicon_url: settings.favicon_url,
            meta_description: settings.meta_description,
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            accent_color: settings.accent_color,
            success_color: settings.success_color,
            warning_color: settings.warning_color,
            error_color: settings.error_color,
            hero_banner_url: settings.hero_banner_url,
            social_facebook: settings.social_facebook,
            social_twitter: settings.social_twitter,
            social_linkedin: settings.social_linkedin,
            social_instagram: settings.social_instagram,
            social_youtube: settings.social_youtube,
            contact_email: settings.contact_email,
            contact_phone: settings.contact_phone,
            contact_address: settings.contact_address,
            support_email: settings.support_email,
            enable_crypto: settings.enable_crypto,
            enable_wire_transfers: settings.enable_wire_transfers,
            enable_internal_transfers: settings.enable_internal_transfers,
            enable_loans: settings.enable_loans,
            enable_bills: settings.enable_bills,
            enable_investments: settings.enable_investments,
            enable_statements: settings.enable_statements,
            enable_mobile_deposit: settings.enable_mobile_deposit,
            enable_budgets: settings.enable_budgets,
            enable_request_money: settings.enable_request_money,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id)
          .select()
          .single();
      } else {
        // Insert new settings
        query = supabase
          .from('white_label_settings')
          .insert({
            website_name: settings.website_name,
            logo_url: settings.logo_url,
            favicon_url: settings.favicon_url,
            meta_description: settings.meta_description,
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            accent_color: settings.accent_color,
            success_color: settings.success_color,
            warning_color: settings.warning_color,
            error_color: settings.error_color,
            hero_banner_url: settings.hero_banner_url,
            social_facebook: settings.social_facebook,
            social_twitter: settings.social_twitter,
            social_linkedin: settings.social_linkedin,
            social_instagram: settings.social_instagram,
            social_youtube: settings.social_youtube,
            contact_email: settings.contact_email,
            contact_phone: settings.contact_phone,
            contact_address: settings.contact_address,
            support_email: settings.support_email,
            enable_crypto: settings.enable_crypto,
            enable_wire_transfers: settings.enable_wire_transfers,
            enable_internal_transfers: settings.enable_internal_transfers,
            enable_loans: settings.enable_loans,
            enable_bills: settings.enable_bills,
            enable_investments: settings.enable_investments,
            enable_statements: settings.enable_statements,
            enable_mobile_deposit: settings.enable_mobile_deposit,
            enable_budgets: settings.enable_budgets,
            enable_request_money: settings.enable_request_money,
          })
          .select()
          .single();
      }

      const { data, error } = await query;

      if (error) throw error;


      setSettings(data);

      // Update localStorage cache so changes reflect immediately
      localStorage.setItem('website_name', data.website_name);
      localStorage.setItem('logo_url', data.logo_url || '');
      localStorage.setItem('favicon_url', data.favicon_url || '');
      localStorage.setItem('meta_description', data.meta_description);
      localStorage.setItem('primary_color', data.primary_color);

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });

      // Reload the page to apply new settings everywhere
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon' | 'hero_banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;


    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(type);

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        
        // Update settings with base64 image
        const fieldName = type === 'logo' ? 'logo_url' : type === 'favicon' ? 'favicon_url' : 'hero_banner_url';
        const updatedSettings = {
          ...settings,
          [fieldName]: base64String,
        };

        setSettings(updatedSettings);

        const displayName = type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : 'Hero Banner';
        toast({
          title: 'Success',
          description: `${displayName} uploaded successfully. Don't forget to save!`,
        });
        
        setUploading(null);
      };

      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read image file',
          variant: 'destructive',
        });
        setUploading(null);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branding Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 space-y-6">
        <h3 className="text-base sm:text-lg font-semibold text-white">Branding</h3>

        {/* Website Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Website Name
          </label>
          <input
            type="text"
            value={settings.website_name}
            onChange={(e) =>
              setSettings({ ...settings, website_name: e.target.value })
            }
            className="w-full px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="Heritage Financial"
          />
          <p className="text-xs text-gray-400 mt-1">
            Shown in page titles and throughout the platform
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Meta Description
          </label>
          <textarea
            value={settings.meta_description}
            onChange={(e) =>
              setSettings({ ...settings, meta_description: e.target.value })
            }
            rows={2}
            className="w-full px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="Secure online banking with modern features and 24/7 support"
          />
          <p className="text-xs text-gray-400 mt-1">
            Shown in browser tabs next to the favicon and in search results
          </p>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Logo
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {settings.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-12 sm:h-16 w-auto max-w-[200px] object-contain bg-white rounded p-2"
                />
              </div>
            )}
            <label className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors text-sm sm:text-base">
              <Upload className="w-4 h-4" />
              {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'logo')}
                disabled={uploading === 'logo'}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Recommended: 200x60px PNG or SVG with transparent background
          </p>
        </div>

        {/* Favicon Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Favicon
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {settings.favicon_url && (
              <div className="flex-shrink-0">
                <img
                  src={settings.favicon_url}
                  alt="Favicon"
                  className="h-8 w-8 object-contain bg-white rounded"
                />
              </div>
            )}
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              {uploading === 'favicon' ? 'Uploading...' : 'Upload Favicon'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'favicon')}
                disabled={uploading === 'favicon'}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Recommended: 32x32px or 64x64px PNG or ICO
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 space-y-6">
        <h3 className="text-base sm:text-lg font-semibold text-white">Contact Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) =>
                setSettings({ ...settings, contact_email: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="support@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={settings.contact_phone || ''}
              onChange={(e) =>
                setSettings({ ...settings, contact_phone: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contact Address
          </label>
          <textarea
            value={settings.contact_address || ''}
            onChange={(e) =>
              setSettings({ ...settings, contact_address: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123 Main St, Suite 100&#10;New York, NY 10001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Support Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={settings.support_email || ''}
            onChange={(e) =>
              setSettings({ ...settings, support_email: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="support@heritagebk.org"
          />
          <p className="text-xs text-gray-400 mt-1">
            Email shown to banned users when they try to log in
          </p>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 space-y-6">
        <h3 className="text-base sm:text-lg font-semibold text-white">Feature Toggles</h3>
        <p className="text-sm text-gray-400">
          Enable or disable features for your platform
        </p>

        <div className="space-y-4">
          {/* Crypto */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_crypto}
              onChange={(e) =>
                setSettings({ ...settings, enable_crypto: e.target.checked })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium text-sm sm:text-base">Cryptocurrency</div>
          </label>

          {/* Wire Transfers */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_wire_transfers}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_wire_transfers: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium text-sm sm:text-base">Wire Transfers</div>
          </label>

          {/* Loans */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_loans}
              onChange={(e) =>
                setSettings({ ...settings, enable_loans: e.target.checked })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Loans</div>
          </label>

          {/* Bills */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_bills}
              onChange={(e) =>
                setSettings({ ...settings, enable_bills: e.target.checked })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Bill Payments</div>
          </label>

          {/* Investments */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_investments}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_investments: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Investments</div>
          </label>

          {/* Internal Transfers */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_internal_transfers}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_internal_transfers: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Internal Transfers</div>
          </label>

          {/* Statements */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_statements}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_statements: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Statements</div>
          </label>

          {/* Mobile Deposit */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_mobile_deposit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_mobile_deposit: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Mobile Deposit</div>
          </label>

          {/* Budgets */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_budgets}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_budgets: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Budgets</div>
          </label>

          {/* Request Money */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_request_money}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_request_money: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-white font-medium">Request Money</div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
        >
          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default WhiteLabelSettings;
