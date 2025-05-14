import React from 'react'; // 确保导入 React
// import { StrictMode } from 'react'; // StrictMode 将在 AppWrapper 中处理
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router-dom';
import routesConfig from './router/routes'; // 重命名导入以示区分
import './styles/index.less';
import AppWrapper from './AppWrapper'; // 导入 AppWrapper
// import { ConfigProvider } from 'antd'; // ConfigProvider 将在 AppWrapper 中处理
// import zhCN from 'antd/locale/zh_CN'; // zhCN 将在 AppWrapper 中处理

// AppRouteObject[] to RouteObject[] needs `as any` or proper mapping
// 如果 routesConfig 已经是 RouteObject[] 类型，则不需要类型断言
const router = createBrowserRouter(routesConfig as any); 

createRoot(document.getElementById('root')!).render(
  // StrictMode 和 ConfigProvider 已移至 AppWrapper
  <AppWrapper router={router} />
);
