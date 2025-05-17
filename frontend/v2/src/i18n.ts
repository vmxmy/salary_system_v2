import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // Import Chinese locale for dayjs
import 'dayjs/locale/en';    // Import English locale for dayjs

i18n
  .use(HttpBackend) // Lloads translations from your server
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    fallbackLng: 'en', // Use English if detected language is not available
    debug: import.meta.env.DEV, // Logs i18n events to the console in development mode
    ns: ['translation'], // Default namespace
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to translation files
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      // Order and from where user language should be detected
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      // Keys or params to lookup language from
      caches: ['cookie', 'localStorage'],
      cookieMinutes: 10080, // 7 days
      cookieDomain: import.meta.env.MODE === 'development' ? '' : window.location.hostname, // Adapt cookie domain for dev/prod
    }
  });

// Listener for language change to update dayjs locale
i18n.on('languageChanged', (lng) => {
  console.log('[i18n] Language changed to:', lng);
  if (lng === 'zh') {
    dayjs.locale('zh-cn');
  } else if (lng === 'en') {
    dayjs.locale('en');
  } else {
    dayjs.locale('en'); // Default to English for dayjs if an unsupported language is set
  }
});

// Initialize dayjs with the initial language
const initialLng = i18n.language;
if (initialLng && initialLng.startsWith('zh')) {
  dayjs.locale('zh-cn');
} else {
  dayjs.locale('en'); 
}
console.log('[i18n] Initial dayjs locale set based on i18n language:', dayjs.locale());

export default i18n; 