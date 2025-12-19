// Preload settings before React renders to prevent branding flash
// This runs BEFORE React loads, ensuring correct branding from first paint

(function() {
  // Supabase configuration from injected window variables
  const SUPABASE_URL = window.__SUPABASE_URL__;
  const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__;
  
  // Default fallback if nothing in localStorage and API fails
  const DEFAULT_NAME = 'Unity Capital';
  
  // Check if we have cached settings (for instant load)
  let cachedName = localStorage.getItem('website_name');
  const cachedFavicon = localStorage.getItem('favicon_url');
  const cachedMeta = localStorage.getItem('meta_description');
  
  // If no cached name, set a default to prevent Heritage Financial flash
  if (!cachedName) {
    cachedName = DEFAULT_NAME;
    localStorage.setItem('website_name', DEFAULT_NAME);
  }
  
  // Apply cached settings immediately if available
  if (cachedName) {
    document.title = cachedName + ' - Modern Financial Management';
    
    // Update Open Graph
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) ogTitle.setAttribute('content', cachedName + ' - Modern Financial Management');
    
    // Update Twitter
    const twitterTitle = document.querySelector("meta[name='twitter:title']");
    if (twitterTitle) twitterTitle.setAttribute('content', cachedName + ' - Modern Financial Management');
  }
  
  if (cachedFavicon) {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = cachedFavicon;
    if (!document.querySelector("link[rel~='icon']")) {
      document.head.appendChild(link);
    }
  }
  
  if (cachedMeta) {
    const metaTag = document.querySelector("meta[name='description']");
    if (metaTag) metaTag.setAttribute('content', cachedMeta);
    
    // Update Open Graph
    const ogDesc = document.querySelector("meta[property='og:description']");
    if (ogDesc) ogDesc.setAttribute('content', cachedMeta);
    
    // Update Twitter
    const twitterDesc = document.querySelector("meta[name='twitter:description']");
    if (twitterDesc) twitterDesc.setAttribute('content', cachedMeta);
  }

  // Don't fetch if credentials aren't available
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
      SUPABASE_URL.includes('%') || SUPABASE_ANON_KEY.includes('%')) {
    return; // Skip API call, rely on React context
  }

  // Fetch fresh settings from Supabase (in background)
  fetch(SUPABASE_URL + '/rest/v1/white_label_settings?select=*&order=created_at.desc&limit=1', {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data && data.length > 0) {
      const settings = data[0];
      
      // Update title
      if (settings.website_name) {
        document.title = settings.website_name + ' - Modern Financial Management';
        localStorage.setItem('website_name', settings.website_name);
        
        // Update Open Graph
        const ogTitle = document.querySelector("meta[property='og:title']");
        if (ogTitle) ogTitle.setAttribute('content', settings.website_name + ' - Modern Financial Management');
        
        // Update Twitter
        const twitterTitle = document.querySelector("meta[name='twitter:title']");
        if (twitterTitle) twitterTitle.setAttribute('content', settings.website_name + ' - Modern Financial Management');
      }
      
      // Update favicon
      if (settings.favicon_url) {
        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = settings.favicon_url;
        if (!document.querySelector("link[rel~='icon']")) {
          document.head.appendChild(link);
        }
        localStorage.setItem('favicon_url', settings.favicon_url);
      }
      
      // Update meta description
      if (settings.meta_description) {
        const metaTag = document.querySelector("meta[name='description']");
        if (metaTag) metaTag.setAttribute('content', settings.meta_description);
        
        // Update Open Graph
        const ogDesc = document.querySelector("meta[property='og:description']");
        if (ogDesc) ogDesc.setAttribute('content', settings.meta_description);
        
        // Update Twitter
        const twitterDesc = document.querySelector("meta[name='twitter:description']");
        if (twitterDesc) twitterDesc.setAttribute('content', settings.meta_description);
        
        localStorage.setItem('meta_description', settings.meta_description);
      }
      
      // Cache logo and other settings for React
      if (settings.logo_url) localStorage.setItem('logo_url', settings.logo_url);
      if (settings.primary_color) localStorage.setItem('primary_color', settings.primary_color);
      if (settings.contact_email) localStorage.setItem('contact_email', settings.contact_email);
      if (settings.contact_phone) localStorage.setItem('contact_phone', settings.contact_phone);
      if (settings.contact_address) localStorage.setItem('contact_address', settings.contact_address);
      
      localStorage.setItem('enable_crypto', String(settings.enable_crypto ?? true));
      localStorage.setItem('enable_wire_transfers', String(settings.enable_wire_transfers ?? true));
      localStorage.setItem('enable_loans', String(settings.enable_loans ?? true));
      localStorage.setItem('enable_bills', String(settings.enable_bills ?? true));
      localStorage.setItem('enable_investments', String(settings.enable_investments ?? true));
    }
  })
  .catch(error => {
    console.error('Failed to preload settings:', error);
    // Silently fail - React will load settings normally
  });
})();
