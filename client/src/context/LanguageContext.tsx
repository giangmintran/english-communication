import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language } from '@/translations';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'speakup-language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (stored === 'vi' || stored === 'en') {
        return stored;
      }
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('vi')) {
        return 'vi';
      }
    } catch (_) {}
    return 'vi';
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (_) {}
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English if missing in Vietnamese
        let enCurrent: any = translations['en'];
        for (const ek of keys) {
          if (enCurrent && typeof enCurrent === 'object' && ek in enCurrent) {
            enCurrent = enCurrent[ek];
          } else {
            enCurrent = undefined;
            break;
          }
        }
        if (typeof enCurrent === 'string') return enCurrent;
        return fallback || path;
      }
    }

    return typeof current === 'string' ? current : (fallback || path);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
}
