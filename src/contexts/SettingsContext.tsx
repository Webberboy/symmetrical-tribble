import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SettingsContextType {
  websiteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  metaDescription: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  heroBannerUrl: string | null;
  socialFacebook: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialInstagram: string | null;
  socialYoutube: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  enableCrypto: boolean;
  enableWireTransfers: boolean;
  enableInternalTransfers: boolean;
  enableLoans: boolean;
  enableBills: boolean;
  enableInvestments: boolean;
  enableStatements: boolean;
  enableMobileDeposit: boolean;
  enableBudgets: boolean;
  enableRequestMoney: boolean;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage for instant access (no flash)
  
  const [websiteName, setWebsiteName] = useState(() => {
    const cached = localStorage.getItem('website_name') || 'Modern Banking';
    return cached;
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    const cached = localStorage.getItem('logo_url') || null;
    return cached;
  });
  const [faviconUrl, setFaviconUrl] = useState<string | null>(() => {
    const cached = localStorage.getItem('favicon_url') || null;
    return cached;
  });
  const [metaDescription, setMetaDescription] = useState(() => {
    return localStorage.getItem('meta_description') || 'Secure online banking with modern features and 24/7 support';
  });
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('primary_color') || '#3B82F6';
  });
  const [secondaryColor, setSecondaryColor] = useState(() => {
    return localStorage.getItem('secondary_color') || '#10B981';
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accent_color') || '#F59E0B';
  });
  const [successColor, setSuccessColor] = useState(() => {
    return localStorage.getItem('success_color') || '#10B981';
  });
  const [warningColor, setWarningColor] = useState(() => {
    return localStorage.getItem('warning_color') || '#F59E0B';
  });
  const [errorColor, setErrorColor] = useState(() => {
    return localStorage.getItem('error_color') || '#EF4444';
  });
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(() => {
    return localStorage.getItem('hero_banner_url') || null;
  });
  const [socialFacebook, setSocialFacebook] = useState<string | null>(() => {
    return localStorage.getItem('social_facebook') || null;
  });
  const [socialTwitter, setSocialTwitter] = useState<string | null>(() => {
    return localStorage.getItem('social_twitter') || null;
  });
  const [socialLinkedin, setSocialLinkedin] = useState<string | null>(() => {
    return localStorage.getItem('social_linkedin') || null;
  });
  const [socialInstagram, setSocialInstagram] = useState<string | null>(() => {
    return localStorage.getItem('social_instagram') || null;
  });
  const [socialYoutube, setSocialYoutube] = useState<string | null>(() => {
    return localStorage.getItem('social_youtube') || null;
  });
  const [contactEmail, setContactEmail] = useState<string | null>(() => {
    return localStorage.getItem('contact_email') || null;
  });
  const [contactPhone, setContactPhone] = useState<string | null>(() => {
    return localStorage.getItem('contact_phone') || null;
  });
  const [contactAddress, setContactAddress] = useState<string | null>(() => {
    return localStorage.getItem('contact_address') || null;
  });
  const [enableCrypto, setEnableCrypto] = useState(() => {
    const stored = localStorage.getItem('enable_crypto');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableWireTransfers, setEnableWireTransfers] = useState(() => {
    const stored = localStorage.getItem('enable_wire_transfers');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableInternalTransfers, setEnableInternalTransfers] = useState(() => {
    const stored = localStorage.getItem('enable_internal_transfers');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableLoans, setEnableLoans] = useState(() => {
    const stored = localStorage.getItem('enable_loans');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableBills, setEnableBills] = useState(() => {
    const stored = localStorage.getItem('enable_bills');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableInvestments, setEnableInvestments] = useState(() => {
    const stored = localStorage.getItem('enable_investments');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableStatements, setEnableStatements] = useState(() => {
    const stored = localStorage.getItem('enable_statements');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableMobileDeposit, setEnableMobileDeposit] = useState(() => {
    const stored = localStorage.getItem('enable_mobile_deposit');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableBudgets, setEnableBudgets] = useState(() => {
    const stored = localStorage.getItem('enable_budgets');
    return stored !== null ? stored === 'true' : true;
  });
  const [enableRequestMoney, setEnableRequestMoney] = useState(() => {
    const stored = localStorage.getItem('enable_request_money');
    return stored !== null ? stored === 'true' : true;
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      // Use hardcoded Unity Capital settings instead of database
      const unityCapitalSettings = {
        website_name: 'Unity Capital',
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
        contact_email: 'support@unitycapital.com',
        contact_phone: null,
        contact_address: null,
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
      };

      // Set Unity Capital settings
      setWebsiteName(unityCapitalSettings.website_name);
      localStorage.setItem('website_name', unityCapitalSettings.website_name);
      
      setLogoUrl(unityCapitalSettings.logo_url);
      localStorage.setItem('logo_url', unityCapitalSettings.logo_url || '');
      
      setFaviconUrl(unityCapitalSettings.favicon_url);
      localStorage.setItem('favicon_url', unityCapitalSettings.favicon_url || '');
      
      setMetaDescription(unityCapitalSettings.meta_description);
      localStorage.setItem('meta_description', unityCapitalSettings.meta_description);
      
      setPrimaryColor(unityCapitalSettings.primary_color);
      localStorage.setItem('primary_color', unityCapitalSettings.primary_color);
      
      setSecondaryColor(unityCapitalSettings.secondary_color);
      localStorage.setItem('secondary_color', unityCapitalSettings.secondary_color);
      
      setAccentColor(unityCapitalSettings.accent_color);
      localStorage.setItem('accent_color', unityCapitalSettings.accent_color);
      
      setSuccessColor(unityCapitalSettings.success_color);
      localStorage.setItem('success_color', unityCapitalSettings.success_color);
      
      setWarningColor(unityCapitalSettings.warning_color);
      localStorage.setItem('warning_color', unityCapitalSettings.warning_color);
      
      setErrorColor(unityCapitalSettings.error_color);
      localStorage.setItem('error_color', unityCapitalSettings.error_color);
      
      setHeroBannerUrl(unityCapitalSettings.hero_banner_url);
      localStorage.setItem('hero_banner_url', unityCapitalSettings.hero_banner_url || '');
      
      setSocialFacebook(unityCapitalSettings.social_facebook);
      localStorage.setItem('social_facebook', unityCapitalSettings.social_facebook || '');
      
      setSocialTwitter(unityCapitalSettings.social_twitter);
      localStorage.setItem('social_twitter', unityCapitalSettings.social_twitter || '');
      
      setSocialLinkedin(unityCapitalSettings.social_linkedin);
      localStorage.setItem('social_linkedin', unityCapitalSettings.social_linkedin || '');
      
      setSocialInstagram(unityCapitalSettings.social_instagram);
      localStorage.setItem('social_instagram', unityCapitalSettings.social_instagram || '');
      
      setSocialYoutube(unityCapitalSettings.social_youtube);
      localStorage.setItem('social_youtube', unityCapitalSettings.social_youtube || '');
      
      setContactEmail(unityCapitalSettings.contact_email);
      localStorage.setItem('contact_email', unityCapitalSettings.contact_email || '');
      
      setContactPhone(unityCapitalSettings.contact_phone);
      localStorage.setItem('contact_phone', unityCapitalSettings.contact_phone || '');
      
      setContactAddress(unityCapitalSettings.contact_address);
      localStorage.setItem('contact_address', unityCapitalSettings.contact_address || '');
      
      setEnableCrypto(unityCapitalSettings.enable_crypto);
      localStorage.setItem('enable_crypto', String(unityCapitalSettings.enable_crypto));
      
      setEnableWireTransfers(unityCapitalSettings.enable_wire_transfers);
      localStorage.setItem('enable_wire_transfers', String(unityCapitalSettings.enable_wire_transfers));
      
      setEnableInternalTransfers(unityCapitalSettings.enable_internal_transfers);
      localStorage.setItem('enable_internal_transfers', String(unityCapitalSettings.enable_internal_transfers));
      
      setEnableLoans(unityCapitalSettings.enable_loans);
      localStorage.setItem('enable_loans', String(unityCapitalSettings.enable_loans));
      
      setEnableBills(unityCapitalSettings.enable_bills);
      localStorage.setItem('enable_bills', String(unityCapitalSettings.enable_bills));
      
      setEnableInvestments(unityCapitalSettings.enable_investments);
      localStorage.setItem('enable_investments', String(unityCapitalSettings.enable_investments));
      
      setEnableStatements(unityCapitalSettings.enable_statements);
      localStorage.setItem('enable_statements', String(unityCapitalSettings.enable_statements));
      
      setEnableMobileDeposit(unityCapitalSettings.enable_mobile_deposit);
      localStorage.setItem('enable_mobile_deposit', String(unityCapitalSettings.enable_mobile_deposit));
      
      setEnableBudgets(unityCapitalSettings.enable_budgets);
      localStorage.setItem('enable_budgets', String(unityCapitalSettings.enable_budgets));
      
      setEnableRequestMoney(unityCapitalSettings.enable_request_money);
      localStorage.setItem('enable_request_money', String(unityCapitalSettings.enable_request_money));
      
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();

    // Subscribe to changes in app_settings
    const appSettingsChannel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'setting_key=eq.website_name'
        },
        (payload) => {
          if (payload.new && 'setting_value' in payload.new) {
            const newName = payload.new.setting_value as string;
            setWebsiteName(newName);
            localStorage.setItem('website_name', newName);
          }
        }
      )
      .subscribe();

    // Subscribe to changes in white_label_settings
    const whiteLabelChannel = supabase
      .channel('white_label_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'white_label_settings'
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            if (data.website_name) {
              setWebsiteName(data.website_name);
              localStorage.setItem('website_name', data.website_name);
            }
            if ('logo_url' in data) {
              setLogoUrl(data.logo_url);
              localStorage.setItem('logo_url', data.logo_url || '');
            }
            if ('favicon_url' in data) {
              setFaviconUrl(data.favicon_url);
              localStorage.setItem('favicon_url', data.favicon_url || '');
            }
            if ('meta_description' in data) {
              const metaDesc = data.meta_description || 'Secure online banking with modern features and 24/7 support';
              setMetaDescription(metaDesc);
              localStorage.setItem('meta_description', metaDesc);
            }
            if ('primary_color' in data) {
              const color = data.primary_color || '#3B82F6';
              setPrimaryColor(color);
              localStorage.setItem('primary_color', color);
            }
            if ('secondary_color' in data) {
              const color = data.secondary_color || '#10B981';
              setSecondaryColor(color);
              localStorage.setItem('secondary_color', color);
            }
            if ('accent_color' in data) {
              const color = data.accent_color || '#F59E0B';
              setAccentColor(color);
              localStorage.setItem('accent_color', color);
            }
            if ('success_color' in data) {
              const color = data.success_color || '#10B981';
              setSuccessColor(color);
              localStorage.setItem('success_color', color);
            }
            if ('warning_color' in data) {
              const color = data.warning_color || '#F59E0B';
              setWarningColor(color);
              localStorage.setItem('warning_color', color);
            }
            if ('error_color' in data) {
              const color = data.error_color || '#EF4444';
              setErrorColor(color);
              localStorage.setItem('error_color', color);
            }
            if ('hero_banner_url' in data) {
              setHeroBannerUrl(data.hero_banner_url);
              localStorage.setItem('hero_banner_url', data.hero_banner_url || '');
            }
            if ('social_facebook' in data) {
              setSocialFacebook(data.social_facebook);
              localStorage.setItem('social_facebook', data.social_facebook || '');
            }
            if ('social_twitter' in data) {
              setSocialTwitter(data.social_twitter);
              localStorage.setItem('social_twitter', data.social_twitter || '');
            }
            if ('social_linkedin' in data) {
              setSocialLinkedin(data.social_linkedin);
              localStorage.setItem('social_linkedin', data.social_linkedin || '');
            }
            if ('social_instagram' in data) {
              setSocialInstagram(data.social_instagram);
              localStorage.setItem('social_instagram', data.social_instagram || '');
            }
            if ('social_youtube' in data) {
              setSocialYoutube(data.social_youtube);
              localStorage.setItem('social_youtube', data.social_youtube || '');
            }
            if ('contact_email' in data) {
              setContactEmail(data.contact_email);
              localStorage.setItem('contact_email', data.contact_email || '');
            }
            if ('contact_phone' in data) {
              setContactPhone(data.contact_phone);
              localStorage.setItem('contact_phone', data.contact_phone || '');
            }
            if ('contact_address' in data) {
              setContactAddress(data.contact_address);
              localStorage.setItem('contact_address', data.contact_address || '');
            }
            if ('enable_crypto' in data) {
              const crypto = data.enable_crypto ?? true;
              setEnableCrypto(crypto);
              localStorage.setItem('enable_crypto', String(crypto));
            }
            if ('enable_wire_transfers' in data) {
              const wire = data.enable_wire_transfers ?? true;
              setEnableWireTransfers(wire);
              localStorage.setItem('enable_wire_transfers', String(wire));
            }
            if ('enable_internal_transfers' in data) {
              const internal = data.enable_internal_transfers ?? true;
              setEnableInternalTransfers(internal);
              localStorage.setItem('enable_internal_transfers', String(internal));
            }
            if ('enable_loans' in data) {
              const loans = data.enable_loans ?? true;
              setEnableLoans(loans);
              localStorage.setItem('enable_loans', String(loans));
            }
            if ('enable_bills' in data) {
              const bills = data.enable_bills ?? true;
              setEnableBills(bills);
              localStorage.setItem('enable_bills', String(bills));
            }
            if ('enable_investments' in data) {
              const investments = data.enable_investments ?? true;
              setEnableInvestments(investments);
              localStorage.setItem('enable_investments', String(investments));
            }
            if ('enable_statements' in data) {
              const statements = data.enable_statements ?? true;
              setEnableStatements(statements);
              localStorage.setItem('enable_statements', String(statements));
            }
            if ('enable_mobile_deposit' in data) {
              const mobileDeposit = data.enable_mobile_deposit ?? true;
              setEnableMobileDeposit(mobileDeposit);
              localStorage.setItem('enable_mobile_deposit', String(mobileDeposit));
            }
            if ('enable_budgets' in data) {
              const budgets = data.enable_budgets ?? true;
              setEnableBudgets(budgets);
              localStorage.setItem('enable_budgets', String(budgets));
            }
            if ('enable_request_money' in data) {
              const requestMoney = data.enable_request_money ?? true;
              setEnableRequestMoney(requestMoney);
              localStorage.setItem('enable_request_money', String(requestMoney));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appSettingsChannel);
      supabase.removeChannel(whiteLabelChannel);
    };
  }, []);

  // Apply favicon and meta description dynamically
  useEffect(() => {
    // Update favicon
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }

    // Update meta description
    let metaTag = document.querySelector("meta[name='description']");
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'description');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', metaDescription);
  }, [faviconUrl, metaDescription]);

  return (
    <SettingsContext.Provider value={{
      websiteName,
      logoUrl,
      faviconUrl,
      metaDescription,
      primaryColor,
      secondaryColor,
      accentColor,
      successColor,
      warningColor,
      errorColor,
      heroBannerUrl,
      socialFacebook,
      socialTwitter,
      socialLinkedin,
      socialInstagram,
      socialYoutube,
      contactEmail,
      contactPhone,
      contactAddress,
      enableCrypto,
      enableWireTransfers,
      enableInternalTransfers,
      enableLoans,
      enableBills,
      enableInvestments,
      enableStatements,
      enableMobileDeposit,
      enableBudgets,
      enableRequestMoney,
      isLoading,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
