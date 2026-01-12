import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDefaultDataForLanguage } from '../database/database';
import { DeviceEventEmitter } from 'react-native';
import en from '../translations/en';
import zh from '../translations/zh';
import ja from '../translations/ja';
import th from '../translations/th';
import ms from '../translations/ms';

export type Language = 'en' | 'zh' | 'ja' | 'th' | 'ms';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getCategoryName: (category: { name: string; translationKey?: string }) => string;
  getLocationName: (location: { name: string; translationKey?: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en,
  zh,
  ja,
  th,
  ms
};

// Export translations for use in other services
export { translations };

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh' || savedLanguage === 'ja' || savedLanguage === 'th' || savedLanguage === 'ms')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      // Silent error handling in production
      setLanguageState('en'); // Fallback to English
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
      
      // Emit language change event for other components to react
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Emit the language change event
      DeviceEventEmitter.emit('languageChanged', { language: lang });
      
    } catch (error) {
      
    }
  };

  const t = (key: string): string => {
    // Primary: current language, Fallback: English, Final fallback: key itself
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  // Utility function to get translated category name
  const getCategoryName = (category: { name: string; translationKey?: string }): string => {
    // First check if translationKey is explicitly set
    if (category.translationKey) {
      return t(category.translationKey);
    }
    // If name itself looks like a translation key (starts with "category.")
    // use it for translation
    if (category.name && category.name.startsWith('category.')) {
      const translated = t(category.name);
      // If translation exists (not the same as the key), return it
      if (translated !== category.name) {
        return translated;
      }
    }
    return category.name;
  };

  // Utility function to get translated location name
  const getLocationName = (location: { name: string; translationKey?: string }): string => {
    // First check if translationKey is explicitly set
    if (location.translationKey) {
      return t(location.translationKey);
    }
    // If name itself looks like a translation key (starts with "defaultLocation." or "category.")
    // use it for translation
    if (location.name && (location.name.startsWith('defaultLocation.') || location.name.startsWith('category.'))) {
      const translated = t(location.name);
      // If translation exists (not the same as the key), return it
      if (translated !== location.name) {
        return translated;
      }
    }
    return location.name;
  };

  const value = {
    language,
    setLanguage,
    t,
    getCategoryName,
    getLocationName,
  };

  return (
    <LanguageContext.Provider value={value}>
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
