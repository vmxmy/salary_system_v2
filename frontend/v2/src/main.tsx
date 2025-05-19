import React from 'react'; // 确保导入 React
// import { StrictMode } from 'react'; // StrictMode 将在 AppWrapper 中处理
import ReactDOM from 'react-dom/client';
import { createBrowserRouter } from 'react-router-dom';
import { routes as routesConfig } from './router/routes'; // Changed to named import with alias
import './styles/index.less';
import './App.css'; // Import App.css for global styles and @font-face
import AppWrapper from './AppWrapper'; // 导入 AppWrapper
// import "./index.css"; // Commented out due to build error: File not found
import dayjs from 'dayjs'; // Import dayjs

// import './i18n'; // DO NOT import './i18n' here as it would run parts of the file before init
import i18n, { i18nInitOptions } from './i18n'; // Import the i18n instance AND options
import LanguageDetector from 'i18next-browser-languagedetector'; // ADDED IMPORT
import I18nAppConfigProvider from './I18nAppConfigProvider'; // Import the new provider
import { fetchAllLookupTypesAndCache } from './services/lookupService'; // Changed import

// Import the store
import { useAuthStore } from './store/authStore';

// Expose the store to the window for debugging purposes
if (import.meta.env.DEV) {
  (window as any).useAuthStore = useAuthStore;
  console.log('[main.tsx] useAuthStore exposed to window for debugging.');
  (window as any).i18n = i18n; // Expose i18n for debugging
  console.log('[main.tsx] i18n instance exposed to window for debugging.');
}

// AppRouteObject[] to RouteObject[] needs `as any` or proper mapping
// 如果 routesConfig 已经是 RouteObject[] 类型，则不需要类型断言
const router = createBrowserRouter(routesConfig as any); 

// 在初始化前记录 i18n 的状态
console.log('[main.tsx] i18n options before init:', i18n.options);
console.log('[main.tsx] i18n current language before init:', i18n.language);

// Initialize i18next and then render the app
i18n
  .use(LanguageDetector) // ADDED .use() HERE
  .init(i18nInitOptions).then(() => { // Pass the init options here
  console.log('[main.tsx] i18next initialized successfully.');
  console.log('[main.tsx] i18n options after init:', i18n.options);
  console.log('[main.tsx] i18n current language after init:', i18n.language);
  console.log('[main.tsx] i18n available languages after init:', i18n.languages);
  
  // 强制设置为中文（如果初始化后不是中文）
  if (i18n.language !== 'zh-CN') {
    console.log('[main.tsx] Forcing language to zh-CN');
    i18n.changeLanguage('zh-CN');
  }
  
  // 渲染应用程序
  // Prime the lookup types cache AFTER i18n is ready, though it might still fail if auth is required.
  // We will address the auth-dependency of fetchAllLookupTypesAndCache next.
  // fetchAllLookupTypesAndCache(); // REMOVED FROM HERE
  // console.log('[main.tsx] Lookup types cache priming initiated.');

  // 设置dayjs初始语言环境为中文，无论i18next检测到的是什么语言
  console.log('[main.tsx] Setting dayjs locale to zh-cn');
  dayjs.locale('zh-cn');
  console.log('[main.tsx] Initial dayjs locale set to:', dayjs.locale());

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nAppConfigProvider>
        <AppWrapper router={router} />
      </I18nAppConfigProvider>
    </React.StrictMode>
  );
}).catch(error => {
  console.error('[main.tsx] Error initializing i18next:', error);
  // Optionally, render a fallback UI or display an error message
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <div>Error initializing internationalization. Please try again later.</div>
  );
});
