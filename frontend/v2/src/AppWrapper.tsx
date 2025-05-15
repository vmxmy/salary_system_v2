import React, { useEffect, StrictMode } from 'react';
import { RouterProvider, type createBrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // 可选导入

// 获取 createBrowserRouter 返回的 router 类型
type AppRouter = ReturnType<typeof createBrowserRouter>;

interface AppWrapperProps {
  router: AppRouter;
}

// 创建一个 QueryClient 实例 (通常在组件外部或仅创建一次)
const queryClient = new QueryClient();

const AppWrapper: React.FC<AppWrapperProps> = ({ router }) => {
  console.log('AppWrapper: Component rendering'); // 新增日志
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    console.log('AppWrapper: useEffect triggered'); // 新增日志
    // console.log('AppWrapper: Calling initializeAuth'); // 旧日志，可以暂时注释或保留
    initializeAuth();
  }, [initializeAuth]);

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}> { /* QueryClientProvider 包裹 */}
        <ConfigProvider locale={zhCN}>
          {/* RouterProvider 的 fallbackElement 在 v6.4+ 中通过 router 配置中的 errorElement 处理，或者在 Suspense 中使用 */} 
          {/* 如果需要加载指示器，可以在 RouterProvider 外部或特定路由元素内部处理 */} 
          <RouterProvider router={router} />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}{/* 可选的开发工具，放在QueryClientProvider内部 */}
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};

export default AppWrapper; 