

"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import { get } from 'lodash';
import { listenToUserData } from '@/services/firestore';

const translations = { en, hi };

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
    
    // Initial load from localStorage for non-logged-in users or for faster initial paint
    const savedLanguage = localStorage.getItem('language') as Language | null;
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
    
    if (userEmail) {
        const unsubscribe = listenToUserData(userEmail, (data) => {
            const userSettings = data?.settings || {};
            if (userSettings.language && (userSettings.language === 'en' || userSettings.language === 'hi')) {
                setLanguageState(userSettings.language);
            }
        });
        return () => unsubscribe();
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useCallback((key: string, params?: { [key: string]: string | number }): string => {
    const langFile = translations[language] || translations.en;
    let text = get(langFile, key, key);
    
    if (params) {
      Object.keys(params).forEach(pKey => {
        text = text.replace(new RegExp(`{{${pKey}}}`, 'g'), String(params[pKey]));
      });
    }

    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

    