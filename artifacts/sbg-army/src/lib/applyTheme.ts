import { Settings } from './database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

export function applyTheme(settings: Settings): void {
  const root = document.documentElement;

  function hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 50%';
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  const primary = hexToHsl(settings.primaryColor || '#d4af37');
  const secondary = hexToHsl(settings.secondaryColor || '#080808');
  const accent = hexToHsl(settings.accentColor || '#b8960c');

  const primaryColor = settings.primaryColor || '#d4af37';
  const accentColor = settings.accentColor || '#b8960c';

  root.style.setProperty('--sbg-primary', primaryColor);
  root.style.setProperty('--sbg-secondary', settings.secondaryColor || '#080808');
  root.style.setProperty('--sbg-accent', accentColor);
  root.style.setProperty('--gold', primaryColor);
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--accent', accent);

  // Dynamic Favicon management
  if (settings.favicon) {
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = settings.favicon;

    let shortcut = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
    if (!shortcut) {
      shortcut = document.createElement('link');
      shortcut.rel = 'shortcut icon';
      document.head.appendChild(shortcut);
    }
    shortcut.href = settings.favicon;
  }

  // Dynamic Apple Touch Icon management
  const appleIconUrl = settings.appleTouchIcon || settings.favicon;
  if (appleIconUrl) {
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = appleIconUrl;
  }

  // Dynamic Title & SEO Meta Tags
  const orgName = settings.organizationName || PUBLIC_BRAND_NAME;
  const pageTitle = settings.metaTitle || `${orgName} — Official Esports Organization`;
  document.title = pageTitle;

  root.dataset.theme = (settings.activeTheme as string) || 'classic-sbg-army';
  root.dataset.organization = orgName;

  const updateMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
    let el = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(nameAttr, attrValue);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  const metaDesc = settings.metaDescription || `Born to win. Built to dominate. Join ${orgName} — India's premier mobile esports organization.`;
  updateMeta('name', 'description', metaDesc);
  updateMeta('property', 'og:title', pageTitle);
  updateMeta('property', 'og:site_name', orgName);
  updateMeta('property', 'og:description', metaDesc);
  updateMeta('name', 'twitter:title', pageTitle);
  updateMeta('name', 'twitter:description', metaDesc);
}
