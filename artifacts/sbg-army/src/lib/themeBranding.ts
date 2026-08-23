import { Settings } from './database';
import { PUBLIC_BRAND_NAME } from './brandConfig';

export type ThemeId =
  | 'classic-sbg-army'
  | 'classic-sbg-esports'
  | 'classic'
  | 'new-esports'
  | 'elite'
  | 'pro-arena'
  | 'champions'
  | 'cyberpunk'
  | 'royal'
  | 'motion';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  category: 'classic' | 'modern' | 'specialty';
  badge: string;
  brandName: string;
  description: string;
  accentColor: string;
  previewUrl: string;
}

export const THEME_REGISTRY: ThemeOption[] = [
  {
    id: 'classic-sbg-army',
    name: 'Classic — SBG ARMY',
    category: 'classic',
    badge: '🏛️ BASELINE CLASSIC',
    brandName: 'SBG ARMY',
    description: 'The original classic website design with protected SBG ARMY branding, styling, and animations.',
    accentColor: '#d4af37',
    previewUrl: '/?previewTheme=classic-sbg-army',
  },
  {
    id: 'classic-sbg-esports',
    name: 'Classic — SBG ESPORTS',
    category: 'classic',
    badge: '⚡ BRAND VARIANT',
    brandName: 'SBG ESPORTS',
    description: 'The identical classic design layout with official SBG ESPORTS branding across all public pages.',
    accentColor: '#d4af37',
    previewUrl: '/?previewTheme=classic-sbg-esports',
  },
  {
    id: 'new-esports',
    name: 'SBG Elite Esports',
    category: 'modern',
    badge: '🏆 PRO ESPORTS',
    brandName: 'SBG ESPORTS',
    description: 'High-contrast pro esports aesthetic with bold hero typography, tournament stats, and player cards.',
    accentColor: '#f59e0b',
    previewUrl: '/?previewTheme=new-esports',
  },
  {
    id: 'pro-arena',
    name: 'SBG Pro Arena',
    category: 'modern',
    badge: '🏟️ PRO ARENA',
    brandName: 'SBG ESPORTS',
    description: 'Match & event-centric layout designed for active esports schedules, live streams, and brackets.',
    accentColor: '#6366f1',
    previewUrl: '/?previewTheme=pro-arena',
  },
  {
    id: 'champions',
    name: 'SBG Champions',
    category: 'modern',
    badge: '🏅 CHAMPIONS',
    brandName: 'SBG ESPORTS',
    description: 'Prestige championship theme highlighting trophies, history, and achievements.',
    accentColor: '#eab308',
    previewUrl: '/?previewTheme=champions',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Glow',
    category: 'specialty',
    badge: '🌌 CYBERPUNK',
    brandName: 'SBG ESPORTS',
    description: 'Futuristic neon accents, glowing grid lines, and high-energy competitive gaming vibes.',
    accentColor: '#00f0ff',
    previewUrl: '/?previewTheme=cyberpunk',
  },
  {
    id: 'royal',
    name: 'Royal Luxury Gold',
    category: 'specialty',
    badge: '👑 ROYAL GOLD',
    brandName: 'SBG ESPORTS',
    description: 'Refined opulent gold trim and minimalist dark luxury atmosphere.',
    accentColor: '#ffd700',
    previewUrl: '/?previewTheme=royal',
  },
];

/**
 * Returns the effective branding and settings according to the active theme.
 * Keeps production data intact while dynamically adapting public presentation.
 */
export function resolveThemeBranding(settings?: Settings, activeTheme?: string): Settings {
  const base = settings ? { ...settings } : ({} as Settings);
  const theme = (activeTheme || base.activeTheme || 'classic-sbg-army').toLowerCase();

  const isClassicArmy = theme === 'classic-sbg-army' || theme === 'classic';
  const isClassicEsports = theme === 'classic-sbg-esports';

  let brandName = PUBLIC_BRAND_NAME;
  if (base.organizationName) {
    brandName = base.organizationName;
  } else if (isClassicEsports) {
    brandName = 'SBG ESPORTS';
  } else if (isClassicArmy) {
    brandName = 'SBG ARMY';
  } else {
    brandName = PUBLIC_BRAND_NAME;
  }

  const effectiveOrgName = brandName;

  const defaultTagline = 'BORN TO WIN. BUILT TO DOMINATE.';
  const defaultMetaTitle = `${effectiveOrgName} — Official Esports Organization`;
  const defaultMetaDesc = `Born to win. Built to dominate. Join ${effectiveOrgName} — India's premier mobile esports organization.`;

  return {
    ...base,
    organizationName: effectiveOrgName,
    tagline: base.tagline || defaultTagline,
    metaTitle: base.metaTitle || defaultMetaTitle,
    metaDescription: base.metaDescription || defaultMetaDesc,
    activeTheme: (theme as any),
  };
}
