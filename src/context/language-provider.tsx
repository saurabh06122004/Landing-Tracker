'use client';

import * as React from 'react';
import { getTranslations } from '@/app/actions/translate';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  addTexts: (texts: string[]) => void;
  loading: boolean;
};

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState('en');
  const [translations, setTranslations] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const registeredTexts = React.useRef(new Set<string>());
  
  // A state to trigger refetch when new keys are added or language changes
  const [version, setVersion] = React.useState(0);

  const setLanguage = (lang: string) => {
    if (lang !== language) {
        setLoading(true);
        setLanguageState(lang);
        setVersion(v => v + 1); // Trigger refetch for new language
    }
  };

  const addTexts = React.useCallback((texts: string[]) => {
    const newTexts = texts.filter(text => text && !registeredTexts.current.has(text));
    if (newTexts.length > 0) {
      newTexts.forEach(text => registeredTexts.current.add(text));
      setVersion(v => v + 1); // Trigger refetch for new texts
    }
  }, []);

  React.useEffect(() => {
    const fetchTranslations = async () => {
      setLoading(true);
      const keys = Array.from(registeredTexts.current);
      if (keys.length > 0) {
        const fetchedTranslations = await getTranslations(language, keys);
        setTranslations(fetchedTranslations);
      }
      setLoading(false);
    };

    fetchTranslations();
  }, [language, version]);

  const t = (key: string): string => {
    if (!key) return '';
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, addTexts, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
