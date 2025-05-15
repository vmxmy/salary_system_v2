import React from 'react'; // 确保导入 React
// import { StrictMode } from 'react'; // StrictMode 将在 AppWrapper 中处理
import ReactDOM from 'react-dom/client';
import { createBrowserRouter } from 'react-router-dom';
import { routes as routesConfig } from './router/routes'; // Changed to named import with alias
import './styles/index.less';
import AppWrapper from './AppWrapper'; // 导入 AppWrapper
// import "./index.css"; // Commented out due to build error: File not found
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// Import the store
import { useAuthStore } from './store/authStore';

// Expose the store to the window for debugging purposes
if (import.meta.env.DEV) {
  (window as any).useAuthStore = useAuthStore;
  console.log('[main.tsx] useAuthStore exposed to window for debugging.');
}

dayjs.locale('zh-cn');

// AppRouteObject[] to RouteObject[] needs `as any` or proper mapping
// 如果 routesConfig 已经是 RouteObject[] 类型，则不需要类型断言
const router = createBrowserRouter(routesConfig as any); 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <AppWrapper router={router} />
    </ConfigProvider>
  </React.StrictMode>
);
