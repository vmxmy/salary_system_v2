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
    'admin',
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
  // 正确禁用语言检测的方法是将 order 设置为空数组
  detection: {
    order: [], // 空数组禁用所有检测器
    // caches: [], // 可选，如果 order 为空，caches 通常也应为空或不设置
    // lookupQuerystring: false, // etc. - 也可以将各个 lookup 设置为 false
  },
  // initImmediate: false // detection 为 false 时，此选项意义不大，可以移除或保留
};

i18n
  .use(HttpBackend) // Loads translations from your server
  // .use(LanguageDetector) // Detects user language - REMOVED
  .use(initReactI18next)
  .init(i18nInitOptions); // <--- 在这里使用定义的选项进行初始化

// Listener for language change to update dayjs locale
/* // MOVED to I18nAppConfigProvider.tsx
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
*/

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