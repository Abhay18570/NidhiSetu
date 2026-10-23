import { useState, useEffect } from 'react';
import { LanguageContext } from './context';
import { en } from './translations/en';
import { hi } from './translations/hi';
import { mr } from './translations/mr';

const translations = {
  en,
  hi,
  mr
};

export function LanguageProvider({ children }) {
  // 1. Language state
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('nidhisetu_lang') || 'en';
  });

  // 2. Font scale state: 'sm' (90%), 'normal' (100%), 'lg' (115%)
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('nidhisetu_font_size') || 'normal';
  });

  // 3. High contrast state
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('nidhisetu_high_contrast') === 'true';
  });

  // Sync language with HTML lang attribute and localStorage
  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('nidhisetu_lang', lang);
      document.documentElement.setAttribute('lang', lang);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  // Sync font size with CSS custom property and localStorage
  useEffect(() => {
    let scale = '100%';
    if (fontSize === 'sm') scale = '90%';
    if (fontSize === 'lg') scale = '115%';
    document.documentElement.style.setProperty('--font-scale', scale);
    localStorage.setItem('nidhisetu_font_size', fontSize);
  }, [fontSize]);

  const increaseFontSize = () => {
    setFontSize((prev) => (prev === 'sm' ? 'normal' : prev === 'normal' ? 'lg' : 'lg'));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => (prev === 'lg' ? 'normal' : prev === 'normal' ? 'sm' : 'sm'));
  };

  const resetFontSize = () => {
    setFontSize('normal');
  };

  // Sync high contrast with HTML class and localStorage
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('nidhisetu_high_contrast', String(highContrast));
  }, [highContrast]);

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  // Translation lookup function
  const t = (key, fallback) => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    // Fallback to English
    if (translations.en && translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        highContrast,
        toggleHighContrast,
        t,
        languages: [
          { code: 'en', label: 'English', native: 'English' },
          { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
          { code: 'mr', label: 'Marathi', native: 'मराठी' }
        ]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
