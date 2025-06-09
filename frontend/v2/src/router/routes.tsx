import React, { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import AppProtectedRoute from './ProtectedRoute'; // This is the main guard component
import MainLayout from '../layouts/MainLayout';
import ProLayoutWrapper from '../layouts/ProLayoutWrapper';
import i18n from '../i18n'; // Import i18n instance

// 导入页面组件
import LoginPage from '../pages/LoginPage';
// 删除 DashboardV3 导入，不再需要仪表盘
// const DashboardV3 = lazy(() => import('../pages/Dashboard/DashboardV3'));
import UsersPageV2 from '../pages/Admin/UsersV2';
import RolesPageV2 from '../pages/Admin/RolesV2';
import PermissionListPageV2 from '../pages/Admin/Permissions/PermissionListPageV2';
import ConfigPage from '../pages/Admin/Config';
import LeavePage from '../pages/Leave';
// import PayrollPage from '../pages/Payroll'; // This line will be removed as PayrollPage.tsx is not the new module entry

// Import the new HR Management routes
import { hrManagementRoutes } from '../pages/HRManagement/routes';

// Import the new Payroll module routes
import { payrollRoutes } from '../pages/Payroll/index'; // This imports from Payroll/index.ts which exports payrollRoutes from Payroll/routes.ts

// Import the Manager module routes
import { managerRoutes } from '../pages/Manager/routes';

// 视图报表组件 - 已删除，使用新的报表配置管理
// const ReportViewManagement = lazy(() => import('../pages/Admin/ReportView'));

// 批量报表组件 - 已合并到报表配置管理页面
// const BatchReportsPage = lazy(() => import('../pages/BatchReports/index'));

// Placeholder for HR, Finance, Manager sections - replace with actual components
// const HRDashboardPage = lazy(() => import('../pages/HR/HRDashboardPage');
// const FinanceDashboardPage = lazy(() => import('../pages/Finance/FinanceDashboardPage');
// const ManagerDashboardPage = lazy(() => import('../pages/Manager/ManagerDashboardPage');

import MyPayslips from '../pages/Employee/MyPayslips';
import MyInfo from '../pages/Employee/MyInfo';
import NotFoundPage from '../pages/NotFoundPage'; // Create this if needed
import UnauthorizedPage from '../pages/UnauthorizedPage'; // 我们将创建这个页面

// Admin pages (lazy loaded)
const OrganizationManagementPageV2 = lazy(() => import('../pages/Admin/Organization/OrganizationManagementPageV2'));

// Lazy load the new bulk import page
const EmployeeBulkImportPage = lazy(() => import('../pages/HRManagement/bulkImport/EmployeeBulkImportPage'));

// Import EmployeeListPageV3
const EmployeeListPageV3 = lazy(() => import('../pages/HRManagement/employees/EmployeeListPage'));

// 在顶部导入 ReportTableDemo 组件
import ReportTableDemo from '../pages/Admin/Configuration/ReportTableDemo';
import ReportTemplateDemo from '../pages/Admin/Configuration/ReportTemplateDemo';

// 导入报表配置管理组件
const ReportConfigManagement = lazy(() => import('../pages/Admin/Configuration/ReportConfigManagement'));

// Import PayrollWorkflowPage
const PayrollWorkflowPage = lazy(() => import('../pages/Payroll/PayrollWorkflowPage'));

// RouteObject 本身就包含 element, path, children, index
// 我们将 meta 附加到自定义的 RouteConfig 上
export type AppRouteObject = RouteObject & {
  meta?: {
    title: string; // This will now store the translation KEY
    allowedRoles?: string[];
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
    meta: { title: 'auth:login' },
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
    meta: { title: 'auth:unauthorized' },
  },
  {
    path: '/',
    element: (
      <AppProtectedRoute>
        <ProLayoutWrapper />
      </AppProtectedRoute>
    ),
    children: [
      // 将首页重定向到简单工资页面
      { index: true, element: <Navigate to="/simple-payroll" replace /> },
      // 删除仪表盘路由
      // {
      //   path: 'dashboard',
      //   element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Dashboard...</div>}><DashboardV3 /></React.Suspense>,
      //   meta: { title: 'menu:dashboard', hideInBreadcrumbIfParentOfNext: true },
      // },
      {
        path: 'admin',
        element: (
          <AppProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Admin Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'menu:admin.title', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <UsersPageV2 />, meta: { title: 'menu:admin.users', requiredPermissions: ['user:list'] } },
          { path: 'roles', element: <RolesPageV2 />, meta: { title: 'menu:admin.roles', requiredPermissions: ['role:list'] } },
          { path: 'permissions', element: <PermissionListPageV2 />, meta: { title: 'menu:admin.permissions', requiredPermissions: ['permission:list'] } },
          { path: 'config', element: <ConfigPage />, meta: { title: 'menu:admin.systemSettings', requiredPermissions: ['config:view'] } },
          {
            path: 'report-config',
            element: <Outlet />,
            meta: { title: 'menu:admin.reportConfig', requiredPermissions: ['report:manage'], hideInBreadcrumbIfParentOfNext: true },
            children: [
              {
                index: true,
                element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Config...</div>}>{React.createElement(lazy(() => import('../pages/Admin/Configuration/ReportConfigManagement')))}</React.Suspense>,
                meta: { title: 'menu:admin.reportConfig' } // Keep parent title
              },
              {
                path: ':dataSourceId',
                element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Data Source Details...</div>}>{React.createElement(lazy(() => import('../pages/Admin/DataSources/DataSourceDetailPage')))}</React.Suspense>,
                meta: { title: 'menu:admin.dataSourceDetail' } // Example title, adjust as needed
              }
            ]
          },
          {
            path: 'organization',
            element: <Outlet />,
            meta: { title: 'menu:organization.title', requiredPermissions: ['department:list'] },
            children: [
              { index: true, element: <Navigate to="management-v2" replace /> },
              { path: 'management-v2', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Organization Management...</div>}><OrganizationManagementPageV2 /></React.Suspense>, meta: { title: 'menu:organization.managementV2', requiredPermissions: ['department:list'] } },
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
        meta: { title: 'menu:hr.title', allowedRoles: ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN'] },
        children: [
          // The first child of hrManagementRoutes is an object whose 'children' property contains the actual routes.
          // We also need to provide appropriate meta for the base 'employees' path.
          ...hrManagementRoutes.map(route => {
            if (route.path === 'employees') {
              return { ...route, meta: { title: 'menu:hr.employees', requiredPermissions: ['employee:list'], ...route.meta } };
            }
            if (route.path === 'employees/new') {
              return { ...route, meta: { title: 'menu:hr.employeesNew', requiredPermissions: ['employee:create'], ...route.meta } };
            }
            if (route.path === 'employees/:employeeId') {
              return { ...route, meta: { title: 'menu:hr.employeesDetail', requiredPermissions: ['employee:view'], hideInBreadcrumbIfParentOfNext: true, ...route.meta } };
            }
            if (route.path === 'employees/:employeeId/edit') {
              return { ...route, meta: { title: 'menu:hr.employeesEdit', requiredPermissions: ['employee:edit'], ...route.meta } };
            }
            return route;
          }),
          // New route for bulk import
          {
            path: 'employees/bulk-import',
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Bulk Import...</div>}><EmployeeBulkImportPage /></React.Suspense>,
            meta: { title: 'menu:hr.employeesBulkImport', requiredPermissions: ['employee:create'] }
          },
          // { path: 'dashboard', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading HR Dashboard...</div>}><HRDashboardPage /></React.Suspense>, meta: { title: 'hr:dashboard_page_title' } },
          // EmployeeListPage import is removed, new routes handle /hr/employees
          { path: 'leave', element: <LeavePage />, meta: { title: 'menu:hr.leaveManagement', requiredPermissions: ['leave:manage'] } },
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
        meta: { title: 'menu:payroll.title', allowedRoles: ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'] },
        children: [
          // { path: 'payroll', element: <PayrollPage />, meta: { title: 'payroll_management', requiredPermissions: ['payroll:manage'] } }, // This is the old, incorrect payroll route
          {
            path: 'payroll',
            element: <Outlet />,
            meta: { title: 'menu:payroll.title', requiredPermissions: ['payroll_run:view'] },
            children: payrollRoutes, // These are the routes from Payroll/routes.ts
          }
        ],
      },
      {
        path: 'simple-payroll',
        element: (
          <AppProtectedRoute allowedRoles={['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'HR_MANAGER']}>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Simple Payroll...</div>}>
              {React.createElement(lazy(() => import('../pages/SimplePayroll')))}
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { 
          title: 'menu:simplePayroll.title', 
          allowedRoles: ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'HR_MANAGER'],
          requiredPermissions: ['payroll_period:view', 'payroll_run:view'],
          permissionMatchMode: 'any'
        }
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
        meta: { title: 'menu:manager.title', allowedRoles: ['MANAGER', 'SUPER_ADMIN'] },
        children: managerRoutes,
      },
      {
        path: 'view-reports',
        element: <Navigate to="/admin/report-config" replace />,
        meta: { 
          title: 'menu:reports.title', 
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'],
          requiredPermissions: ['report:view_reports']
        }
      },
      {
        path: 'batch-reports',
        element: <Navigate to="/admin/report-config?tab=batch-reports" replace />,
        meta: { 
          title: 'menu:batchReports.title', 
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'],
          requiredPermissions: ['report:export', 'payroll_run:view'],
          permissionMatchMode: 'any'
        }
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
        meta: { title: 'menu:personal.title' },
        children: [
          { index: true, element: <Navigate to="my-info" replace /> },
          { path: 'my-info', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading My Info...</div>}><MyInfo /></React.Suspense>, meta: { title: 'menu:personal.myInfo' } },
          { path: 'my-payslips', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading My Payslips...</div>}><MyPayslips /></React.Suspense>, meta: { title: 'menu:personal.myPayslips' } },
          { path: 'my-leave', element: <LeavePage />, meta: { title: 'menu:personal.myLeave' } },
        ],
      },
      {
        path: 'personal',
        element: (
          <AppProtectedRoute>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Personal Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'menu:personal.title' },
        children: [
          { index: true, element: <Navigate to="employee-info" replace /> },
        ],
      },
      {
        path: '/test',
        element: (
          <AppProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Test Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'menu:test.title', allowedRoles: ['SUPER_ADMIN'] },
        children: [
          { index: true, element: <Navigate to="employee-list-v3" replace /> },
          {
            path: 'employee-list-v3',
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Employee List V3...</div>}><EmployeeListPageV3 /></React.Suspense>,
            meta: { title: 'menu:test.employeeListV3' },
          },
          {
            path: 'report-table-demo',
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Table Demo...</div>}><ReportTableDemo /></React.Suspense>,
            meta: { title: 'menu:test.reportTableDemo' },
          },
          {
            path: 'report-template-demo',
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Template Demo...</div>}><ReportTemplateDemo /></React.Suspense>,
            meta: { title: 'menu:test.reportTemplateDemo' },
          },
          {
            path: 'payroll-workflow',
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Payroll Workflow...</div>}><PayrollWorkflowPage /></React.Suspense>,
            meta: { title: 'menu:test.payrollWorkflow' },
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    meta: { title: 'common:not_found' },
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