import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import AppProtectedRoute from './ProtectedRoute'; // This is the main guard component
import MainLayout from '../layouts/MainLayout';
import i18n from '../i18n'; // Import i18n instance

// 导入页面组件
import LoginPage from '../pages/LoginPage';
// import DashboardPage from '../pages/Dashboard'; // Original
const DashboardPage = lazy(() => import('../pages/Dashboard'));
import UserListPage from '../pages/Admin/Users';
import RoleListPage from '../pages/Admin/Roles';
import PermissionListPage from '../pages/Admin/Permissions/PermissionListPage';
import ConfigPage from '../pages/Admin/Config';
import LeavePage from '../pages/Leave';
// import PayrollPage from '../pages/Payroll'; // This line will be removed as PayrollPage.tsx is not the new module entry

// Import the new HR Management routes
import { hrManagementRoutes } from '../pages/HRManagement/routes';

// Import the new Payroll module routes
import { payrollRoutes } from '../pages/Payroll/index'; // This imports from Payroll/index.ts which exports payrollRoutes from Payroll/routes.ts

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
    title: string; // This will now store the translation KEY
    requiredRoles?: string[];
    requiredPermissions?: string[];
    permissionMatchMode?: 'all' | 'any';
    hideInBreadcrumbIfParentOfNext?: boolean;
  };
  children?: AppRouteObject[]; // Ensure children also use AppRouteObject for consistency
};

// Removed local const AppProtectedRoute and NestedProtectedRoute wrapper components

export const routes: AppRouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
    meta: { title: 'page_title.login' },
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
    meta: { title: 'page_title.unauthorized' },
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
        element: <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_dashboard')}</div>}><DashboardPage /></React.Suspense>,
        meta: { title: 'page_title.dashboard' },
      },
      {
        path: 'admin',
        element: (
          <AppProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_admin_section')}</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'page_title.system_management', requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <UserListPage />, meta: { title: 'page_title.user_management', requiredPermissions: ['user:list'] } },
          { path: 'roles', element: <RoleListPage />, meta: { title: 'page_title.role_management', requiredPermissions: ['role:list'] } },
          { path: 'permissions', element: <PermissionListPage />, meta: { title: 'page_title.permission_management', requiredPermissions: ['permission:list'] } },
          { path: 'config', element: <ConfigPage />, meta: { title: 'page_title.system_configuration' } },
          {
            path: 'organization',
            element: <Outlet />,
            meta: { title: 'page_title.organization_structure' },
            children: [
              { index: true, element: <Navigate to="departments" replace /> },
              { path: 'departments', element: <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_departments')}</div>}><DepartmentsPage /></React.Suspense>, meta: { title: 'page_title.department_management' } },
              { path: 'job-titles', element: <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_job_titles')}</div>}><JobTitlesPage /></React.Suspense>, meta: { title: 'page_title.job_title_management' } },
            ],
          },
        ],
      },
      {
        path: 'hr',
        element: (
          <AppProtectedRoute allowedRoles={['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN']}> {/* Added SUPER_ADMIN for access during dev */}
            <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_hr_section')}</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'page_title.hr_management', requiredRoles: ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN'] },
        children: [
          // The first child of hrManagementRoutes is an object whose 'children' property contains the actual routes.
          // We also need to provide appropriate meta for the base 'employees' path.
          ...hrManagementRoutes.map(route => { // Directly map over hrManagementRoutes
            if (route.path === 'employees') {
              return { ...route, meta: { title: 'page_title.employee_list', requiredPermissions: ['employee:list'], ...route.meta } };
            }
            if (route.path === 'employees/new') {
              return { ...route, meta: { title: 'page_title.create_employee', requiredPermissions: ['employee:create'], ...route.meta } };
            }
            if (route.path === 'employees/:employeeId') {
              return { ...route, meta: { title: 'page_title.employee_details', requiredPermissions: ['employee:view'], ...route.meta } };
            }
            if (route.path === 'employees/:employeeId/edit') {
              return { ...route, meta: { title: 'page_title.edit_employee', requiredPermissions: ['employee:edit'], ...route.meta } };
            }
            return route;
          }),
          // { path: 'dashboard', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading HR Dashboard...</div>}><HRDashboardPage /></React.Suspense>, meta: { title: 'HR仪表盘' } },
          // EmployeeListPage import is removed, new routes handle /hr/employees
          { path: 'leave', element: <LeavePage />, meta: { title: 'page_title.leave_management', requiredPermissions: ['leave:manage'] } },
        ],
      },
      {
        path: 'finance',
        element: (
          <AppProtectedRoute allowedRoles={['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_finance_section')}</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'page_title.finance_management', requiredRoles: ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'] },
        children: [
          // { path: 'payroll', element: <PayrollPage />, meta: { title: '薪资管理', requiredPermissions: ['payroll:manage'] } }, // This is the old, incorrect payroll route
          {
            path: 'payroll',
            element: <Outlet />,
            meta: { title: 'page_title.payroll_calculation', requiredPermissions: ['P_PAYROLL_MODULE_VIEW'] }, // Example top-level permission for the module
            children: payrollRoutes, // These are the routes from Payroll/routes.ts
          }
        ],
      },
      {
        path: 'manager', 
        element: (
          <AppProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_manager_section')}</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'page_title.manager_view', requiredRoles: ['MANAGER', 'SUPER_ADMIN'] },
        children: [
        ],
      },
      {
        path: 'employee-info', 
        element: (
          <AppProtectedRoute> 
            <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_employee_section')}</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'page_title.employee_hub' },
        children: [
          { index: true, element: <Navigate to="my-info" replace /> },
          { path: 'my-info', element: <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_my_info')}</div>}><MyInfo /></React.Suspense>, meta: { title: 'page_title.my_info' } },
          { path: 'my-payslips', element: <React.Suspense fallback={<div className="page-loading-suspense">{i18n.t('common.loading_my_payslips')}</div>}><MyPayslips /></React.Suspense>, meta: { title: 'page_title.my_payslips' } },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    meta: { title: 'page_title.not_found' },
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