import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type Language } from '@/i18n/translations';

const LANGUAGE_KEY = '@zando_language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved === 'fr' || saved === 'lingala' || saved === 'kituba' || saved === 'en') {
          setLanguageState(saved);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch { /* ignore */ }
  }, []);

  // Fonction de traduction avec fallback en cascade
  const t = useCallback(
    (key: string, fallback?: string): string => {
      try {
        const keys = key.split('.');
        let value: any = translations[language];
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            // Fallback vers français
            let fallbackValue: any = translations.fr;
            for (const fk of keys) {
              if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
                fallbackValue = fallbackValue[fk];
              } else {
                return fallback || key;
              }
            }
            return typeof fallbackValue === 'string' ? fallbackValue : fallback || key;
          }
        }
        return typeof value === 'string' ? value : fallback || key;
      } catch {
        return fallback || key;
      }
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used within LanguageProvider');
  return value;
}
