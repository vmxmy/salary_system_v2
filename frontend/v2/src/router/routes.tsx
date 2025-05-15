import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import AppProtectedRoute from './ProtectedRoute'; // This is the main guard component
import MainLayout from '../layouts/MainLayout';

// 导入页面组件
import LoginPage from '../pages/LoginPage';
// import DashboardPage from '../pages/Dashboard'; // Original
const DashboardPage = lazy(() => import('../pages/Dashboard'));
import UserListPage from '../pages/Admin/Users';
import RoleListPage from '../pages/Admin/Roles';
import PermissionListPage from '../pages/Admin/Permissions/PermissionListPage';
import ConfigPage from '../pages/Admin/Config';
import LeavePage from '../pages/Leave';
import PayrollPage from '../pages/Payroll'; // Assuming PayrollPage.tsx

// Import the new HR Management routes
import { hrManagementRoutes } from '../pages/HRManagement/routes';

// Placeholder for HR, Finance, Manager sections - replace with actual components
// const HRDashboardPage = lazy(() => import('../pages/HR/HRDashboardPage'));
// const FinanceDashboardPage = lazy(() => import('../pages/Finance/FinanceDashboardPage'));
// const ManagerDashboardPage = lazy(() => import('../pages/Manager/ManagerDashboardPage'));

import MyPayslips from '../pages/Employee/MyPayslips';
import MyInfo from '../pages/Employee/MyInfo';
import NotFoundPage from '../pages/NotFoundPage'; // Create this if needed
import UnauthorizedPage from '../pages/UnauthorizedPage'; // 我们将创建这个页面

// Admin pages (lazy loaded)
const JobTitlesPage = lazy(() => import('../pages/Admin/Organization/JobTitlesPage'));
const DepartmentsPage = lazy(() => import('../pages/Admin/Organization/DepartmentsPage'));

// RouteObject 本身就包含 element, path, children, index
// 我们将 meta 附加到自定义的 RouteConfig 上
export type AppRouteObject = RouteObject & {
  meta?: {
    title: string;
    requiredRoles?: string[];
    requiredPermissions?: string[];
    permissionMatchMode?: 'all' | 'any';
  };
  children?: AppRouteObject[]; // Ensure children also use AppRouteObject for consistency
};

// Removed local const AppProtectedRoute and NestedProtectedRoute wrapper components

export const routes: AppRouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
    meta: { title: '登录' },
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
    meta: { title: '未授权' },
  },
  {
    path: '/',
    element: (
      <AppProtectedRoute>
        <MainLayout />
      </AppProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Dashboard...</div>}><DashboardPage /></React.Suspense>,
        meta: { title: '仪表盘' }, // Example: Public or common role
      },
      {
        path: 'admin',
        element: (
          <AppProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Admin Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: '系统管理', requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <UserListPage />, meta: { title: '用户管理', requiredPermissions: ['user:list'] } },
          { path: 'roles', element: <RoleListPage />, meta: { title: '角色管理', requiredPermissions: ['role:list'] } },
          { path: 'permissions', element: <PermissionListPage />, meta: { title: '权限管理', requiredPermissions: ['permission:list'] } },
          { path: 'config', element: <ConfigPage />, meta: { title: '系统配置' } },
          {
            path: 'organization',
            element: <Outlet />, // Just an outlet for further nesting, protection is at parent 'admin' or individual child.
            meta: { title: '组织架构' },
            children: [
              { index: true, element: <Navigate to="departments" replace /> },
              { path: 'departments', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Departments...</div>}><DepartmentsPage /></React.Suspense>, meta: { title: '部门管理' } },
              { path: 'job-titles', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Job Titles...</div>}><JobTitlesPage /></React.Suspense>, meta: { title: '职位管理' } },
            ],
          },
        ],
      },
      {
        path: 'hr',
        element: (
          <AppProtectedRoute allowedRoles={['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN']}> {/* Added SUPER_ADMIN for access during dev */}
            <React.Suspense fallback={<div className="page-loading-suspense">Loading HR Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: '人力资源', requiredRoles: ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN'] },
        children: [
          // The first child of hrManagementRoutes is an object whose 'children' property contains the actual routes.
          // We also need to provide appropriate meta for the base 'employees' path.
          ...hrManagementRoutes.map(route => { // Directly map over hrManagementRoutes
            if (route.path === 'employees') {
              return { ...route, meta: { title: '员工列表', requiredPermissions: ['employee:list'], ...route.meta } };
            }
            if (route.path === 'employees/new') {
              return { ...route, meta: { title: '新建员工', requiredPermissions: ['employee:create'], ...route.meta } };
            }
            if (route.path === 'employees/:employeeId') {
              return { ...route, meta: { title: '员工详情', requiredPermissions: ['employee:view'], ...route.meta } };
            }
            if (route.path === 'employees/:employeeId/edit') {
              return { ...route, meta: { title: '编辑员工', requiredPermissions: ['employee:edit'], ...route.meta } };
            }
            return route;
          }),
          // { path: 'dashboard', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading HR Dashboard...</div>}><HRDashboardPage /></React.Suspense>, meta: { title: 'HR仪表盘' } },
          // EmployeeListPage import is removed, new routes handle /hr/employees
          { path: 'leave', element: <LeavePage />, meta: { title: '假勤管理', requiredPermissions: ['leave:manage'] } },
        ],
      },
      {
        path: 'finance',
        element: (
          <AppProtectedRoute allowedRoles={['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Finance Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: '财务管理', requiredRoles: ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'] },
        children: [
          { path: 'payroll', element: <PayrollPage />, meta: { title: '薪资管理', requiredPermissions: ['payroll:manage'] } },
        ],
      },
      {
        path: 'manager', 
        element: (
          <AppProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Manager Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: '经理视图', requiredRoles: ['MANAGER', 'SUPER_ADMIN'] },
        children: [
        ],
      },
      {
        path: 'employee-info', 
        element: (
          <AppProtectedRoute> 
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Employee Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: '个人中心' },
        children: [
          { index: true, element: <Navigate to="my-info" replace /> },
          { path: 'my-info', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading My Info...</div>}><MyInfo /></React.Suspense>, meta: { title: '我的信息' } },
          { path: 'my-payslips', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading My Payslips...</div>}><MyPayslips /></React.Suspense>, meta: { title: '我的薪资单' } },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    meta: { title: '页面未找到' },
  },
];

// Helper to generate a flat list of routes for use in breadcrumbs or sitemaps
export const getFlatRoutes = (routeList: AppRouteObject[], parentPath = ''): AppRouteObject[] => {
  let flatRoutes: AppRouteObject[] = [];
  routeList.forEach(route => {
    const currentPath = `${parentPath}/${route.path || ''}`.replace(/\/+/g, '/').replace(/\/$/, '');
    const processedRoute = { ...route, path: currentPath };
    
    if (route.meta) { // Only add routes with meta to flat list, or adjust as needed
        flatRoutes.push(processedRoute);
    }

    if (route.children) {
      flatRoutes = flatRoutes.concat(getFlatRoutes(route.children, currentPath));
    }
  });
  return flatRoutes;
};

export const allAppRoutes = getFlatRoutes(routes);