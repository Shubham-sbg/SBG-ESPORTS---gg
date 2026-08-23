import React, { createContext, useContext, useEffect, useState } from 'react';
import { Database, saveDB } from '@/lib/database';
import { useDatabase } from '@/hooks/useDatabase';

export type ColorPalette = {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export const PREDEFINED_PALETTES: ColorPalette[] = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    primaryColor: '#00f0ff',
    secondaryColor: '#070714',
    accentColor: '#ff0055',
  },
  {
    id: 'gold-black',
    name: 'Gold & Black',
    primaryColor: '#d4af37',
    secondaryColor: '#050505',
    accentColor: '#b8960c',
  },
  {
    id: 'cyberpunk-orange',
    name: 'Cyberpunk Orange',
    primaryColor: '#ff6b00',
    secondaryColor: '#1a1a2e',
    accentColor: '#e94560',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    primaryColor: '#ffffff',
    secondaryColor: '#000000',
    accentColor: '#888888',
  }
];

type ThemeContextType = {
  currentPalette: ColorPalette | null;
  setPalette: (paletteId: string) => Promise<void>;
  palettes: ColorPalette[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { db, loading } = useDatabase();
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);

  useEffect(() => {
    if (loading || !db) return;
    
    // Attempt to match current DB settings to a palette
    const matched = PREDEFINED_PALETTES.find(p => 
      p.primaryColor.toLowerCase() === db.settings.primaryColor?.toLowerCase() &&
      p.secondaryColor.toLowerCase() === db.settings.secondaryColor?.toLowerCase() &&
      p.accentColor.toLowerCase() === db.settings.accentColor?.toLowerCase()
    );

    if (matched) {
      setCurrentPalette(matched);
    } else {
      // Custom palette based on current settings
      setCurrentPalette({
        id: 'custom',
        name: 'Custom',
        primaryColor: db.settings.primaryColor || '#00f0ff',
        secondaryColor: db.settings.secondaryColor || '#070714',
        accentColor: db.settings.accentColor || '#ff0055',
      });
    }

    // Apply CSS Variables
    const root = document.documentElement;
    const primary = db.settings.primaryColor || '#00f0ff';
    const secondary = db.settings.secondaryColor || '#070714';
    const accent = db.settings.accentColor || '#ff0055';

    root.style.setProperty('--sbg-primary', primary);
    root.style.setProperty('--sbg-secondary', secondary);
    root.style.setProperty('--sbg-accent', accent);
    
    root.style.setProperty('--primary', hexToHsl(primary));
    root.style.setProperty('--secondary', hexToHsl(secondary));
    root.style.setProperty('--accent', hexToHsl(accent));
    
  }, [db?.settings.primaryColor, db?.settings.secondaryColor, db?.settings.accentColor, loading]);

  const setPalette = async (paletteId: string) => {
    const palette = PREDEFINED_PALETTES.find(p => p.id === paletteId);
    if (!palette || !db) return;

    setCurrentPalette(palette);
    
    const updatedDb = { ...db };
    updatedDb.settings = {
      ...updatedDb.settings,
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      accentColor: palette.accentColor,
    };
    
    await saveDB(updatedDb, 'settings');
  };

  return (
    <ThemeContext.Provider value={{ currentPalette, setPalette, palettes: PREDEFINED_PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeEngine() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeEngine must be used within a ThemeProvider');
  }
  return context;
}
