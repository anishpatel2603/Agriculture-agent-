import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, UnitSystem } from '../types';
import { TRANSLATIONS, Translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  unitSystem: UnitSystem;
  setUnitSystem: (unit: UnitSystem) => void;
  formatArea: (areaAcre?: number, areaHa?: number) => string;
  formatWater: (liters: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('agrogenesis_lang');
    return saved === 'hi' || saved === 'mr' ? saved : 'en';
  });

  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('agrogenesis_units');
    return saved === 'hectare' ? 'hectare' : 'acre';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrogenesis_lang', lang);
  };

  const setUnitSystem = (unit: UnitSystem) => {
    setUnitSystemState(unit);
    localStorage.setItem('agrogenesis_units', unit);
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const formatArea = (areaAcre?: number, areaHa?: number): string => {
    if (unitSystem === 'acre') {
      const val = areaAcre ?? (areaHa ? +(areaHa * 2.471).toFixed(1) : 0);
      return `${val} ${t.acre}`;
    } else {
      const val = areaHa ?? (areaAcre ? +(areaAcre / 2.471).toFixed(2) : 0);
      return `${val} ${t.hectare}`;
    }
  };

  const formatWater = (liters: number): string => {
    if (liters >= 100000) {
      return `${(liters / 100000).toFixed(2)} Lakh L`;
    }
    return `${liters.toLocaleString('en-IN')} L`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        unitSystem,
        setUnitSystem,
        formatArea,
        formatWater,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
