import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import I18nAppConfigProvider from './I18nAppConfigProvider';
import ProLayoutWrapper from './layouts/ProLayoutWrapper';
import { antdTheme } from './config/theme';
import { routes } from './router/routes';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 创建查询客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// 创建路由器
const router = createBrowserRouter(routes);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nAppConfigProvider>
        <ConfigProvider theme={antdTheme}>
          <AntdApp>
            <RouterProvider router={router} />
          </AntdApp>
        </ConfigProvider>
      </I18nAppConfigProvider>
    </QueryClientProvider>
  );
};

export default App; 