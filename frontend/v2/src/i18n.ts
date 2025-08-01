import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // Import Chinese locale for dayjs
import 'dayjs/locale/en';    // Import English locale for dayjs

export const i18nInitOptions = {
  supportedLngs: ['en', 'zh-CN'], 
  nonExplicitSupportedLngs: false, // 禁用回退到基础语言，不要自动将 'zh-CNt('common:auto____20e7ae')zh'
  load: 'currentOnly' as const, // 只加载完整的语言标签，不尝试加载基础语言
  fallbackLng: {
    'default': ['zh-CN', 'en'], // 默认回退到中文，然后是英文
    'zh': ['zh-CN'], // 确保zh回退到zh-CN
  },
  lng: 'zh-CN', 
  debug: import.meta.env.DEV, 
  ns: [
    'common',
    'admin',
    'auth',
    'dashboard',
    'department',
    'employee',
    'jobTitle',
    'manager',
    'profile',
    'user_profile',
    'pageTitle',
    'payroll',
    'payroll_runs',
    'permission',
    'personnelCategory',
    'hr',
    'tour',
    'user_menu',
    'report',
    'reportManagement',
    'role',
    'user',
    'menu',
    'bulkImport',
    'payrollEntryForm'
  ],
  defaultNS: 'common', 
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  react: {
    useSuspense: true, // 使用 Suspense
  },
  interpolation: {
    escapeValue: false,
    keySeparator: '.', // 显式设置键分隔符
    nsSeparator: ':',  // 显式设置命名空间分隔符
  },
  returnObjects: true, // 启用返回对象选项，解决访问对象警告
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage', 'cookie'], // Add common caches
    lookupFromPathIndex: 0,
    lookupFromSubdomainIndex: 0,
    // 确保语言检测时强制使用完整标签
    checkWhitelist: true // 确保检测到的语言在supportedLngs列表中
  },
  preload: ['zh-CN', 'en'], // 预加载语言
};

// 初始化 i18n
i18n
  .use(HttpBackend) 
  .use(LanguageDetector) 
  .use(initReactI18next)
  .init(i18nInitOptions);

// 确保在 i18n 初始化后设置 dayjs 语言
i18n.on('initialized', () => {
  updateDayjsLocale(i18n.language);
});

i18n.on('languageChanged', (lng) => {
  updateDayjsLocale(lng);
});

function updateDayjsLocale(lng: string) {
  if (lng === 'zh-CN') {
    dayjs.locale('zh-cn'); // Use 'zh-cn' for dayjs (lowercase)
  } else if (lng === 'en') {
    dayjs.locale('en');
  } else {
    // 如果检测到的语言不是支持的语言，默认使用中文
    dayjs.locale('zh-cn');
  }
}

export default i18n; 