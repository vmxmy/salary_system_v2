import React from 'react'; // 确保导入 React
// import { StrictMode } from 'react'; // StrictMode 将在 AppWrapper 中处理
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // 导入 Provider
import { store } from './store'; // 导入我们创建的 store
import AppWrapper from './AppWrapper';
import { createBrowserRouter } from 'react-router-dom'; // 导入 react-router-dom 的 createBrowserRouter
import { routes } from './router/routes'; // 从 routes.tsx 导入路由配置数组
import './styles/global.less'; // 修正后缀名为 .less
import './i18n'; // 主 i18n 配置应该在此处导入，它会初始化 i18n
import I18nAppConfigProvider from './I18nAppConfigProvider';
// 保持原始的 i18next 导入和初始化逻辑
import i18n from './i18n'; // 确保这个导入指向的是已经配置好的 i18n 实例
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // Import Chinese locale for dayjs
import 'dayjs/locale/en';   // Import English locale for dayjs

// Expose the store to the window for debugging purposes
if (import.meta.env.DEV) {
  // (window as any).useAuthStore = useAuthStore; // 移除此行
  // console.log('[main.tsx] useAuthStore exposed to window for debugging.'); // 移除此行
  (window as any).i18n = i18n; 
  console.log('[main.tsx] i18n instance exposed to window for debugging.');
}

// 假设 i18nInitOptions 仍然在 i18n.ts 中定义并按需使用
// 或者直接在这里定义/合并必要的选项
const i18nInitOptions = {
  // ... (从 i18n.ts 或项目原始配置中获取)
  // 通常包含 fallbackLng, supportedLngs, defaultNS, ns, backend, detection 等
  fallbackLng: 'zh-CN', // 示例
  supportedLngs: ['zh-CN', 'en', 'zh'], // 示例
  defaultNS: 'common', // 示例
  ns: ['common', 'pageTitle', 'admin', /* ...其他 namespaces */], // 示例
  interpolation: {
    escapeValue: false, // React already safes from xss
  },
  // backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' }, // 由 HttpBackend 使用
  // detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] } // 由 LanguageDetector 使用
};

// 使用 createBrowserRouter 和导入的 routes 配置创建 router 实例
const router = createBrowserRouter(routes); // 直接使用导入的 routes

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element with id 'root'");
}

const root = ReactDOM.createRoot(rootElement);

const renderApp = () => {
  root.render(
    // <React.StrictMode>
      <Provider store={store}>
        <I18nAppConfigProvider> 
          <AppWrapper router={router} />
        </I18nAppConfigProvider>
      </Provider>
    // </React.StrictMode>
  );
};

// i18n.init() is now called within i18n.ts when the module is imported.
// We still need to wait for initialization to complete before rendering.
if (i18n.isInitialized) {
  console.log('[main.tsx] i18next already initialized. Rendering app.');
  renderApp();
} else {
  i18n.on('initialized', (options) => {
    console.log('[main.tsx] i18n initialized event received. Rendering app. Options used were:', options);
    renderApp();
  });
  // DO NOT CALL i18n.init() here anymore.
  // If init in i18n.ts fails, that promise rejection should be handled,
  // though i18next.init typically doesn't return a promise that needs explicit handling here
  // if a callback isn't provided to init itself. The 'initialized' event is key.
}
