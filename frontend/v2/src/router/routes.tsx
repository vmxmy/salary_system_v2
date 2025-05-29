import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import AppProtectedRoute from './ProtectedRoute'; // This is the main guard component
import MainLayout from '../layouts/MainLayout';
import ProLayoutWrapper from '../layouts/ProLayoutWrapper';
import i18n from '../i18n'; // Import i18n instance

// 导入页面组件
import LoginPage from '../pages/LoginPage';
// Legacy Dashboard (旧版仪表盘)
const DashboardPageLegacy = lazy(() => import('../pages/Dashboard'));
// New optimized Dashboard V3 (新版优化仪表盘)
const DashboardV3 = lazy(() => import('../pages/Dashboard/DashboardV3'));
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

// Import Report Management components (lazy loaded)
const ReportDesigner = lazy(() => import('../pages/Admin/ReportManagement/ReportDesigner'));
const ReportTemplates = lazy(() => import('../pages/Admin/ReportManagement/ReportTemplates'));
const CalculatedFields = lazy(() => import('../pages/Admin/ReportManagement/CalculatedFields'));
const DataSources = lazy(() => import('../pages/Admin/ReportManagement/DataSources'));
const ReportViewer = lazy(() => import('../pages/Admin/ReportManagement/ReportViewer'));
const ReportTemplateDetail = lazy(() => import('../pages/Admin/ReportManagement/ReportTemplateDetail'));

// Placeholder for HR, Finance, Manager sections - replace with actual components
// const HRDashboardPage = lazy(() => import('../pages/HR/HRDashboardPage'));
// const FinanceDashboardPage = lazy(() => import('../pages/Finance/FinanceDashboardPage'));
// const ManagerDashboardPage = lazy(() => import('../pages/Manager/ManagerDashboardPage'));

import MyPayslips from '../pages/Employee/MyPayslips';
import MyInfo from '../pages/Employee/MyInfo';
import NotFoundPage from '../pages/NotFoundPage'; // Create this if needed
import UnauthorizedPage from '../pages/UnauthorizedPage'; // 我们将创建这个页面

// Admin pages (lazy loaded)
const PersonnelCategoriesPage = lazy(() => import('../pages/Admin/Organization/PersonnelCategoriesPage'));
const DepartmentsPage = lazy(() => import('../pages/Admin/Organization/DepartmentsPage'));

// Lazy load the new bulk import page
const EmployeeBulkImportPage = lazy(() => import('../pages/HRManagement/bulkImport/EmployeeBulkImportPage'));

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
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Dashboard...</div>}><DashboardV3 /></React.Suspense>,
        meta: { title: 'dashboard' },
      },
      {
        path: 'legacy-dashboard',
        element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Legacy Dashboard...</div>}><DashboardPageLegacy /></React.Suspense>,
        meta: { title: 'legacy_dashboard' },
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
        meta: { title: 'system_management', requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <UsersPageV2 />, meta: { title: 'user_management', requiredPermissions: ['user:list'] } },
          { path: 'roles', element: <RolesPageV2 />, meta: { title: 'role_management', requiredPermissions: ['role:list'] } },
          { path: 'permissions', element: <PermissionListPageV2 />, meta: { title: 'permission_management', requiredPermissions: ['permission:list'] } },
          { path: 'config', element: <ConfigPage />, meta: { title: 'system_configuration' } },
          {
            path: 'organization',
            element: <Outlet />,
            meta: { title: 'organization_structure' },
            children: [
              { index: true, element: <Navigate to="departments" replace /> },
              { path: 'departments', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Departments...</div>}><DepartmentsPage /></React.Suspense>, meta: { title: 'department_management' } },
              { path: 'job-titles', element: <React.Suspense fallback={<div className="suspense">Loading Personnel Categories...</div>}><PersonnelCategoriesPage /></React.Suspense>, meta: { title: 'job_title_management' } },
              { path: 'personnel-categories', element: <React.Suspense fallback={<div className="suspense">Loading Personnel Categories...</div>}><PersonnelCategoriesPage /></React.Suspense>, meta: { title: 'personnel_categories_management' } },
              { path: 'positions', element: <React.Suspense fallback={<div className="suspense">Loading Positions...</div>}><PersonnelCategoriesPage /></React.Suspense>, meta: { title: 'positions_management' } },
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
        meta: { title: 'hr_management', requiredRoles: ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN'] },
        children: [
          // The first child of hrManagementRoutes is an object whose 'children' property contains the actual routes.
          // We also need to provide appropriate meta for the base 'employees' path.
          ...hrManagementRoutes.map(route => { // Directly map over hrManagementRoutes
            if (route.path === 'employees') {
              return { ...route, meta: { title: 'employee_list', requiredPermissions: ['employee:list'], ...route.meta } };
            }
            if (route.path === 'employees/new') {
              return { ...route, meta: { title: 'create_employee', requiredPermissions: ['employee:create'], ...route.meta } };
            }
            if (route.path === 'employees/:employeeId') {
              return { ...route, meta: { title: 'employee_details', requiredPermissions: ['employee:view'], ...route.meta } };
            }
            if (route.path === 'employees/:employeeId/edit') {
              return { ...route, meta: { title: 'edit_employee', requiredPermissions: ['employee:edit'], ...route.meta } };
            }
            return route;
          }),
          // New route for bulk import
          {
            path: 'employees/bulk-import',
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Bulk Import...</div>}><EmployeeBulkImportPage /></React.Suspense>,
            meta: { title: 'hr:bulk_import.page_title', requiredPermissions: ['employee:create'] }
          },
          // { path: 'dashboard', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading HR Dashboard...</div>}><HRDashboardPage /></React.Suspense>, meta: { title: 'HR仪表盘' } },
          // EmployeeListPage import is removed, new routes handle /hr/employees
          { path: 'leave', element: <LeavePage />, meta: { title: 'leave_management', requiredPermissions: ['leave:manage'] } },
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
        meta: { title: 'finance_management', requiredRoles: ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'] },
        children: [
          // { path: 'payroll', element: <PayrollPage />, meta: { title: '薪资管理', requiredPermissions: ['payroll:manage'] } }, // This is the old, incorrect payroll route
          {
            path: 'payroll',
            element: <Outlet />,
            meta: { title: 'payroll_calculation', requiredPermissions: ['payroll_run:view'] },
            children: payrollRoutes, // These are the routes from Payroll/routes.ts
          }
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
        meta: { title: 'manager_view', requiredRoles: ['MANAGER', 'SUPER_ADMIN'] },
        children: managerRoutes,
      },
      {
        path: 'reports',
        element: (
          <AppProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER']}>
            <React.Suspense fallback={<div className="page-loading-suspense">Loading Reports Section...</div>}>
              <Outlet />
            </React.Suspense>
          </AppProtectedRoute>
        ),
        meta: { title: 'report_management', requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'] },
        children: [
          { index: true, element: <Navigate to="viewer" replace /> },
          { 
            path: 'designer', 
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Designer...</div>}><ReportDesigner /></React.Suspense>, 
            meta: { title: 'report_designer', requiredPermissions: ['report:design'] } 
          },
          { 
            path: 'templates', 
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Templates...</div>}><ReportTemplates /></React.Suspense>, 
            meta: { title: 'report_templates', requiredPermissions: ['report:view_templates'] } 
          },
          { 
            path: 'templates/:id', 
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Template Detail...</div>}><ReportTemplateDetail /></React.Suspense>, 
            meta: { title: 'report_template_detail', requiredPermissions: ['report:view_template_detail'] } 
          },
          { 
            path: 'templates/:id/edit', 
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Designer...</div>}><ReportDesigner /></React.Suspense>, 
            meta: { title: 'edit_report_template', requiredPermissions: ['report:edit_template'] } 
          },
          { 
            path: 'calculated-fields', 
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Calculated Fields...</div>}><CalculatedFields /></React.Suspense>, 
            meta: { title: 'calculated_fields', requiredPermissions: ['report:view_calculated_fields'] } 
          },
          { 
            path: 'data-sources', 
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Data Sources...</div>}><DataSources /></React.Suspense>, 
            meta: { title: 'data_sources', requiredPermissions: ['report:view_datasources'] } 
          },
          { 
            path: 'viewer', 
            element: <React.Suspense fallback={<div className="page-loading-suspense">Loading Report Viewer...</div>}><ReportViewer /></React.Suspense>, 
            meta: { title: 'report_viewer', requiredPermissions: ['report:view'] } 
          },
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
        meta: { title: 'employee_hub' },
        children: [
          { index: true, element: <Navigate to="my-info" replace /> },
          { path: 'my-info', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading My Info...</div>}><MyInfo /></React.Suspense>, meta: { title: 'my_info' } },
          { path: 'my-payslips', element: <React.Suspense fallback={<div className="page-loading-suspense">Loading My Payslips...</div>}><MyPayslips /></React.Suspense>, meta: { title: 'my_payslips' } },
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
        meta: { title: 'personal_center' },
        children: [
          { index: true, element: <Navigate to="leave" replace /> },
          { path: 'leave', element: <LeavePage />, meta: { title: 'leave_application' } },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    meta: { title: 'not_found' },
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