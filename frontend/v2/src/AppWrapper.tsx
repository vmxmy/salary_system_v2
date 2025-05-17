import React, { useEffect, StrictMode } from 'react';
import { RouterProvider, type createBrowserRouter } from 'react-router-dom';
// import { ConfigProvider } from 'antd'; // Removed
// import zhCN from 'antd/locale/zh_CN'; // Removed
import { useAuthStore } from './store/authStore';
// import { shallow } from 'zustand/shallow'; // Reverted
// import type { AuthStoreState, AuthStoreActions } from './store/authStore'; // Reverted
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import usePayrollConfigStore from './store/payrollConfigStore'; // Import the new store
import useHrLookupStore from './store/hrLookupStore'; // Import the HR lookup store
import { fetchAllLookupTypesAndCache } from './services/lookupService'; // Import the service
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // 可选导入

// 获取 createBrowserRouter 返回的 router 类型
type AppRouter = ReturnType<typeof createBrowserRouter>;

interface AppWrapperProps {
  router: AppRouter;
}

// 创建一个 QueryClient 实例 (通常在组件外部或仅创建一次)
const queryClient = new QueryClient();

const AppWrapper: React.FC<AppWrapperProps> = ({ router }) => {
  console.log('AppWrapper: Rendering or re-rendering.');
  // Decomposed selectors
  const initializeAuth = useAuthStore(state => state.initializeAuth);
  const authToken = useAuthStore(state => state.authToken);
  const currentUser = useAuthStore(state => state.currentUser);
  const isLoadingUser = useAuthStore(state => state.isLoadingUser);
  // const userPermissions = useAuthStore(state => state.userPermissions); // Uncomment if directly needed by AppWrapper logic

  const fetchPayrollConfigs = usePayrollConfigStore(state => state.fetchComponentDefinitions); // Get the action
  const fetchHrLookups = useHrLookupStore(state => state.fetchLookup); // Get the HR lookup action

  useEffect(() => {
    console.log('[AppWrapper:useEffect-initializeAuth] Effect triggered. About to call initializeAuth.');
    initializeAuth();
    console.log('[AppWrapper:useEffect-initializeAuth] initializeAuth call completed.');
  }, []);

  useEffect(() => {
    // Only fetch payroll configs if the user is authenticated
    if (authToken) {
      console.log('[AppWrapper:useEffect-fetchPayrollConfigs] Auth token present. About to call fetchPayrollConfigs.');
      fetchPayrollConfigs(); // Fetch payroll component definitions on app load
      console.log('[AppWrapper:useEffect-fetchPayrollConfigs] fetchPayrollConfigs call completed.');
    } else {
      console.log('[AppWrapper:useEffect-fetchPayrollConfigs] No auth token. Skipping payroll configs.');
    }
  }, [authToken, fetchPayrollConfigs]); // Add authToken and fetchPayrollConfigs to dependency array

  useEffect(() => {
    // Only fetch HR lookups if the user is authenticated
    if (authToken) {
      console.log('[AppWrapper:useEffect-fetchHrLookups] Auth token present. Fetching essential HR lookups.');
      // Fetch a set of common HR lookups. More can be added or fetched on-demand elsewhere.
      fetchHrLookups('genders');
      fetchHrLookups('maritalStatuses');
      fetchHrLookups('educationLevels');
      fetchHrLookups('employmentTypes');
      fetchHrLookups('employeeStatuses');
      fetchHrLookups('departments');
      fetchHrLookups('jobTitles');
      console.log('[AppWrapper:useEffect-fetchHrLookups] HR lookups fetch calls initiated.');
    } else {
      console.log('[AppWrapper:useEffect-fetchHrLookups] No auth token. Skipping HR lookups.');
    }
  }, [authToken, fetchHrLookups]); // Add authToken and fetchHrLookups to dependency array

  useEffect(() => {
    // Prime the general lookup types cache if the user is authenticated
    if (authToken) {
      console.log('[AppWrapper:useEffect-primeLookupCache] Auth token present. Priming lookup types cache.');
      fetchAllLookupTypesAndCache();
    } else {
      console.log('[AppWrapper:useEffect-primeLookupCache] No auth token. Skipping lookup types cache priming.');
    }
  }, [authToken]); // Only re-run if authToken changes

  useEffect(() => {
    console.log(
      '[AppWrapper:useEffect-authWatcher] Auth state changed:',
      {
        isAuthenticated: !!authToken,
        currentUser: currentUser ? currentUser.username : null,
        isLoadingUser,
        // permissionsCount: userPermissions?.length ?? 0, // Keep commented if userPermissions selector is commented
      }
    );
  }, [authToken, currentUser, isLoadingUser]);

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}> { /* QueryClientProvider 包裹 */}
        {/* <ConfigProvider locale={zhCN}> */} {/* Removed ConfigProvider wrapper */}
          {/* RouterProvider 的 fallbackElement 在 v6.4+ 中通过 router 配置中的 errorElement 处理，或者在 Suspense 中使用 */} 
          {/* 如果需要加载指示器，可以在 RouterProvider 外部或特定路由元素内部处理 */} 
          <RouterProvider router={router} />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}{/* 可选的开发工具，放在QueryClientProvider内部 */}
        {/* </ConfigProvider> */} {/* Removed ConfigProvider wrapper */}
      </QueryClientProvider>
    </StrictMode>
  );
};

export default AppWrapper; 