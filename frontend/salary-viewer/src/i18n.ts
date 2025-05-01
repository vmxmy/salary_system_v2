import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';

const resources = {
  en: {
    translation: enTranslation
  },
  zh: {
    translation: zhTranslation
  }
};

i18n
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  // Learn more: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true, // Set to false in production
    fallbackLng: 'zh', // Use Chinese as fallback
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    resources,
    // Language detector options
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator'],
      // Keys or params to lookup language from
      lookupLocalStorage: 'salary_app_i18nextLng', // Key for localStorage
      // Cache user language on
      caches: ['localStorage'],
      // optional expire and domain for set cookie
      // cookieMinutes: 10,
      // cookieDomain: 'myDomain',
      // optional htmlTag with lang attribute, the default is true
      // htmlTag: document.documentElement
    }
  });

export default i18n;
