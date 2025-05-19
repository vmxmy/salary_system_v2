import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector'; // Temporarily commented if we move .use()
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // Import Chinese locale for dayjs
import 'dayjs/locale/en';    // Import English locale for dayjs

export const i18nInitOptions = {
  supportedLngs: ['en', 'zh-CN', 'zh'], // 添加'zh'以支持简写形式
  nonExplicitSupportedLngs: true, // 启用非明确支持
  fallbackLng: {
    'zh': ['zh-CN'], // 如果请求'zh'，回退到'zh-CN'
    'default': ['zh-CN']
  },
  lng: 'zh-CN', // 强制设置初始语言为中文
  debug: import.meta.env.DEV, // 在开发模式下记录i18n事件到控制台
  ns: [
    'common',
    'auth',
    'dashboard',
    'department',
    'employee',
    'jobTitle',
    'manager',
    'myPayslips', // Added myPayslips namespace
'myInfo', // Added myInfo namespace
    'pageTitle',
    'payroll',
    'permission',
    'role',
    'user',
    'personnelCategory',
    'hr' // Added hr namespace
  ],
  defaultNS: 'common', // Default namespace to use
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to translation files
  },
  react: {
    useSuspense: false, // Set to false if you want to handle loading states manually
  },
  interpolation: {
    escapeValue: false, // React already safes from xss
  },
  detection: {
    // Order and from where user language should be detected
    order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
    // Keys or params to lookup language from
    caches: ['localStorage'], // 只缓存在localStorage中，避免持久cookie
    // cookieMinutes: 10080, // 7 days - 不使用cookie
    // cookieDomain: import.meta.env.MODE === 'development' ? '' : window.location.hostname,
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    lookupSessionStorage: 'i18nextLng',
    debug: import.meta.env.DEV, // 保持与全局debug一致
    // 添加cleanCode函数来规范化检测到的语言代码
    cleanCode: (code: string) => {
      if (typeof code === 'string') {
        const lowerCode = code.toLowerCase();
        // 所有中文变体都规范化为zh-CN，包括zh本身
        if (lowerCode.startsWith('zh')) {
          return 'zh-CN';
        }
        if (lowerCode.startsWith('en')) {
          return 'en'; // 将en-US, en-GB等规范化为en
        }
      }
      return code; // 返回其他语言代码
    },
    initImmediate: false // 确保异步初始化
  }
};

i18n
  .use(HttpBackend) // Loads translations from your server
  // .use(LanguageDetector) // Detects user language - REMOVED
  .use(initReactI18next); // Passes i18n instance to react-i18next

// Listener for language change to update dayjs locale
i18n.on('languageChanged', (lng) => {
  console.log('[i18n] Language changed to:', lng);
  const baseLng = lng.split('-')[0];
  if (baseLng === 'zh') {
    dayjs.locale('zh-cn'); // Use 'zh-cn' for dayjs (lowercase)
  } else if (baseLng === 'en') {
    dayjs.locale('en');
  } else {
    dayjs.locale('en'); // Default to English for dayjs if an unsupported language is set
  }
});

// Initialize dayjs with the initial language from i18next upon import
// This part needs to be re-evaluated as i18n.language might not be set yet
// if init is called externally. For now, we rely on the 'languageChanged' event
// or the explicit init in main.tsx to set it correctly.
// Consider removing this immediate dayjs locale setting or making it contingent on i18n.isInitialized.

// const initialLng = i18n.language; // This will likely be the fallbackLng before init
// const initialBaseLng = initialLng ? initialLng.split('-')[0] : 'en';
// console.log('[i18n] Attempting to set initial dayjs locale based on i18n.language:', initialLng);
// if (initialBaseLng === 'zh') {
//   dayjs.locale('zh-cn');
// } else {
//   dayjs.locale('en'); 
// }
// console.log('[i18n] Initial dayjs locale after attempt:', dayjs.locale());

export default i18n; 