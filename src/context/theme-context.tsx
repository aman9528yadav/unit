

"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { listenToUserData } from '@/services/firestore';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'custom' | 'retro' | 'glass' | 'nord' | 'rose-pine' | 'sutradhaar';

type CustomColors = {
    background?: string;
    foreground?: string;
    card?: string;
    cardForeground?: string;
    popover?: string;
    popoverForeground?: string;
    primary?: string;
    primaryForeground?: string;
    secondary?: string;
    secondaryForeground?: string;
    muted?: string;
    mutedForeground?: string;
    accent?: string;
    accentForeground?: string;
    destructive?: string;
    destructiveForeground?: string;
    border?: string;
    input?: string;
    ring?: string;
    [key: string]: string | undefined;
}
export interface CustomTheme {
    name: 'custom';
    colors: CustomColors;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customTheme: CustomTheme | null;
  setCustomTheme: (theme: CustomTheme | null) => void;
  resetCustomTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToHsl(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [lastNonCustomTheme, setLastNonCustomTheme] = useState<Exclude<Theme, 'custom'>>('light');
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(null);

  useEffect(() => {
    const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
    
    if (userEmail) {
        const unsubscribe = listenToUserData(userEmail, (data) => {
            const userSettings = data?.settings || {};
            if (userSettings.theme) {
                setThemeState(userSettings.theme);
            }
            if (userSettings.customTheme) {
                setCustomThemeState(userSettings.customTheme);
            }
        });
        return () => unsubscribe();
    }
  }, []);

  const applyTheme = useCallback((themeToApply: Theme, customThemeToApply: CustomTheme | null) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'retro', 'glass', 'nord', 'rose-pine', 'sutradhaar');
    
    const body = window.document.body;
    body.classList.remove('bg-gradient-to-br', 'from-purple-500', 'to-pink-500');

    const colorProperties: (keyof CustomColors)[] = [
        'background', 'foreground', 'card', 'cardForeground', 'popover', 
        'popoverForeground', 'primary', 'primaryForeground', 'secondary', 
        'secondaryForeground', 'muted', 'mutedForeground', 'accent', 
        'accentForeground', 'destructive', 'destructiveForeground', 'border', 
        'input', 'ring'
    ];
    
    colorProperties.forEach(prop => {
        const cssVarName = `--${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.removeProperty(cssVarName);
    });

    if (themeToApply === 'custom' && customThemeToApply) {
        root.classList.add('light'); 
        
        Object.entries(customThemeToApply.colors).forEach(([key, value]) => {
            if (value && /^#[0-9A-F]{6}$/i.test(value)) {
                const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                root.style.setProperty(cssVarName, hexToHsl(value));
            }
        });
    } else if (['light', 'dark', 'retro', 'glass', 'nord', 'rose-pine', 'sutradhaar'].includes(themeToApply)) {
        root.classList.add(themeToApply);
    }
  }, []);
  
  useEffect(() => {
      applyTheme(theme, customTheme);
  }, [theme, customTheme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (newTheme !== 'custom') {
      setLastNonCustomTheme(newTheme);
    }
  };

  const setCustomTheme = (newCustomTheme: CustomTheme | null) => {
    setCustomThemeState(newCustomTheme);
    if (newCustomTheme) {
      if (theme !== 'custom') {
        setTheme('custom');
      }
    }
  };

  const resetCustomTheme = () => {
    setCustomThemeState(null);
    if (theme === 'custom') {
      setTheme(lastNonCustomTheme);
    }
  };
  

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customTheme, setCustomTheme, resetCustomTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

    