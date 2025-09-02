
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'custom';

export interface CustomTheme {
    name: 'custom';
    colors: {
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
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customTheme: CustomTheme | null;
  setCustomTheme: (theme: CustomTheme | null) => void;
  resetCustomTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultThemes = {
    light: {
        '--background': '204 10% 96.1%',
        '--foreground': '222.2 84% 4.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '222.2 84% 4.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '222.2 84% 4.9%',
        '--primary': '210 100% 56%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '210 40% 96.1%',
        '--secondary-foreground': '222.2 84% 4.9%',
        '--muted': '210 40% 96.1%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--accent': '49 95% 59%',
        '--accent-foreground': '224 71% 4%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--ring': '210 100% 56%',
    },
    dark: {
        '--background': '224 71% 4%',
        '--foreground': '210 40% 98%',
        '--card': '222 47% 11%',
        '--card-foreground': '210 40% 98%',
        '--popover': '224 71% 4%',
        '--popover-foreground': '210 40% 98%',
        '--primary': '210 100% 56%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '217.2 32.6% 17.5%',
        '--secondary-foreground': '210 40% 98%',
        '--muted': '217.2 32.6% 17.5%',
        '--muted-foreground': '215 20.2% 65.1%',
        '--accent': '49 95% 59%',
        '--accent-foreground': '224 71% 4%',
        '--destructive': '0 62.8% 30.6%',
        '--destructive-foreground': '0 0% 98%',
        '--border': '217.2 32.6% 17.5%',
        '--input': '217.2 32.6% 17.5%',
        '--ring': '210 100% 56%',
    }
};

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
  const [theme, setTheme] = useState<Theme>('dark');
  const [lastNonCustomTheme, setLastNonCustomTheme] = useState< 'light' | 'dark'>('dark');
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const savedCustomTheme = localStorage.getItem('customTheme');
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    if(initialTheme !== 'custom') {
        setLastNonCustomTheme(initialTheme);
    }

    if (savedCustomTheme) {
      setCustomThemeState(JSON.parse(savedCustomTheme));
    }
  }, []);

  const applyTheme = useCallback((themeToApply: Theme, customThemeToApply: CustomTheme | null) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (themeToApply === 'custom' && customThemeToApply) {
        root.classList.add('custom-theme');
        Object.entries(customThemeToApply.colors).forEach(([key, value]) => {
            if (value && key in defaultThemes.dark) {
                const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                root.style.setProperty(cssVarName, hexToHsl(value));
            }
        });
    } else {
        root.classList.add(themeToApply);
        // Clear custom styles
        Object.keys(defaultThemes.dark).forEach(key => {
             root.style.removeProperty(key);
        });
    }

    localStorage.setItem('theme', themeToApply);
  }, []);
  
  useEffect(() => {
      applyTheme(theme, customTheme);
  }, [theme, customTheme, applyTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    if (newTheme !== 'custom') {
      setLastNonCustomTheme(newTheme);
    }
  };

  const handleSetCustomTheme = (newCustomTheme: CustomTheme | null) => {
    setCustomThemeState(newCustomTheme);
    if (newCustomTheme) {
        setTheme('custom');
        localStorage.setItem('customTheme', JSON.stringify(newCustomTheme));
    }
  };

  const resetCustomTheme = () => {
    setTheme(lastNonCustomTheme);
    localStorage.removeItem('customTheme');
    setCustomThemeState(null);
  };
  

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, customTheme, setCustomTheme: handleSetCustomTheme, resetCustomTheme }}>
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
