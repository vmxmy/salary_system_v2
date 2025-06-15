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
import './styles/form-controls.css'; // 导入全局表单控件样式

// 在开发环境中导入调试工具
if (import.meta.env.DEV) {
  import('./utils/formControlsDebug');
}
import { App } from 'antd'; // 导入 Ant Design 的 App 组件

// React Query 配置
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 缓存时间：5分钟
      staleTime: 5 * 60 * 1000,
      // 数据在内存中保存时间：10分钟
      gcTime: 10 * 60 * 1000,
      // 重试次数
      retry: 2,
      // 重试延迟
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口重新获得焦点时重新获取数据
      refetchOnWindowFocus: false,
      // 网络重连时重新获取数据
      refetchOnReconnect: true,
    },
    mutations: {
      // 变更操作重试次数
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element with id 'root'");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  // <React.StrictMode> // StrictMode is handled in AppWrapper or can be added here if preferred
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <I18nAppConfigProvider> 
          <React.Suspense fallback={<div>Loading translations...</div>}>
            <App> {/* 使用 App 组件包裹整个应用 */}
              <AppWrapper router={router} />
            </App>
          </React.Suspense>
        </I18nAppConfigProvider>
      </Provider>
      {/* React Query 开发工具 - 仅在开发环境显示 */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  // </React.StrictMode>
);

// Stagewise toolbar is now integrated in AppWrapper component
