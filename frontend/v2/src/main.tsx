// @ts-ignore
window.VITE_ENV_DEBUG = import.meta.env;

// 导入并初始化警告抑制
import { initWarningSuppress } from './utils/suppressWarnings';
import { initReactWarningSuppress } from './utils/reactWarningSuppress';

// 在开发环境中启用警告抑制
if (import.meta.env.DEV) {
  initWarningSuppress();
  initReactWarningSuppress();
}

import React from 'react'; // 确保导入 React
// import { StrictMode } from 'react'; // StrictMode 将在 AppWrapper 中处理
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // 导入 Provider
import { store } from './store'; // 导入我们创建的 store
import AppWrapper from './AppWrapper';
import { createBrowserRouter } from 'react-router-dom'; // 导入 react-router-dom 的 createBrowserRouter
import { routes } from './router/routes'; // 从 routes.tsx 导入路由配置数组
import './styles/index.less'; // 只导入 index.less，它会再导入其他需要的样式

// i18n 初始化
import './i18n'; // 导入并初始化 i18n 配置
import i18n from './i18n'; // 引用已初始化的 i18n 实例
import I18nAppConfigProvider from './I18nAppConfigProvider';

// 导入 dayjs 相关配置，虽然 i18n.ts 中已经完成了设置
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; 
import 'dayjs/locale/en';

// Expose the i18n instance to window for debugging purposes
if (import.meta.env.DEV) {
  (window as any).i18n = i18n; 
}

// 使用 createBrowserRouter 和导入的 routes 配置创建 router 实例
const router = createBrowserRouter(routes);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element with id 'root'");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  // <React.StrictMode> // StrictMode is handled in AppWrapper or can be added here if preferred
    <Provider store={store}>
      <I18nAppConfigProvider> 
        <React.Suspense fallback={<div>Loading translations...</div>}>
          <AppWrapper router={router} />
        </React.Suspense>
      </I18nAppConfigProvider>
    </Provider>
  // </React.StrictMode>
);
