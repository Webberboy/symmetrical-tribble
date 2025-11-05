import { useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Hook that updates the page title and favicon based on white label settings
 * This runs automatically when settings change
 */
export const useWhiteLabelMeta = (pageTitle?: string) => {
  const { websiteName, faviconUrl } = useSettings();

  useEffect(() => {
    // Update page title
    if (pageTitle) {
      document.title = `${pageTitle} - ${websiteName}`;
    } else {
      document.title = `${websiteName} - Modern Financial Management`;
    }

    // Update favicon if custom one is set
    if (faviconUrl) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = faviconUrl;
      
      if (!document.querySelector("link[rel*='icon']")) {
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    }

    // Update Open Graph meta tags for social sharing
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `${websiteName} - Modern Financial Management`);
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', `${websiteName} - Modern Financial Management`);
    }
  }, [websiteName, faviconUrl, pageTitle]);
};
