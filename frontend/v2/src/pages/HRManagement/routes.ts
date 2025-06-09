// HRManagement Module Routes
import React from 'react';
import type { AppRouteObject } from '../../router/routes'; // Corrected: AppRouteObject is exported from routes.tsx
// 不要在模块级别导入 i18n 并直接调用 t() 函数
// import i18n from '../../i18n'; // Import i18n instance

// 使用动态导入替代静态导入，避免与路由中的动态导入冲突
const EmployeeListPage = React.lazy(() => import('./employees/EmployeeListPage'));
const CreateEmployeePage = React.lazy(() => import('./employees/CreateEmployeePage'));
const EditEmployeePage = React.lazy(() => import('./employees/EditEmployeePage'));
const EmployeeDetailPage = React.lazy(() => import('./employees/EmployeeDetailPage'));

// Placeholders for page components - will be replaced with actual imports later
const CreateEmployeePagePlaceholder = () => React.createElement('div', null, 'pageTitle:create_employee_placeholder');
const EditEmployeePagePlaceholder = () => React.createElement('div', null, 'pageTitle:edit_employee_placeholder');
const EmployeeDetailPagePlaceholder = () => React.createElement('div', null, 'pageTitle:employee_detail_placeholder');
// const HRManagementLayoutPlaceholder = ({ children }: { children: React.ReactNode }) => <>{children}</>; // Example if a sub-layout was used

export const hrManagementRoutes: AppRouteObject[] = [
  {
    path: 'employees',
    element: React.createElement(
      React.Suspense,
      { fallback: React.createElement('div', { className: 'page-loading-suspense' }, 'Loading Employee List...') },
      React.createElement(EmployeeListPage)
    ),
    meta: {
      title: 'employee:list_page.page_title', // 使用静态翻译键
      requiredPermissions: ['employee:list'], // Changed from permission to requiredPermissions
      hideInBreadcrumbIfParentOfNext: true,
    },
  },
  {
    path: 'employees/new',
    element: React.createElement(
      React.Suspense,
      { fallback: React.createElement('div', { className: 'page-loading-suspense' }, 'Loading Create Employee...') },
      React.createElement(CreateEmployeePage)
    ),
    meta: {
      title: 'employee:create_employee_page.title', // 使用静态翻译键
      requiredPermissions: ['employee:create'], // Changed from permission to requiredPermissions
    },
  },
  {
    path: 'employees/:employeeId/edit',
    element: React.createElement(
      React.Suspense,
      { fallback: React.createElement('div', { className: 'page-loading-suspense' }, 'Loading Edit Employee...') },
      React.createElement(EditEmployeePage)
    ),
    meta: {
      title: 'employee:edit_employee_page.title', // 使用静态翻译键
      requiredPermissions: ['employee:edit'], // Changed from permission to requiredPermissions
    },
  },
  {
    path: 'employees/:employeeId', // Detail page route
    element: React.createElement(
      React.Suspense,
      { fallback: React.createElement('div', { className: 'page-loading-suspense' }, 'Loading Employee Detail...') },
      React.createElement(EmployeeDetailPage)
    ),
    meta: {
      title: 'employee:detail_page.title', // 使用静态翻译键
      requiredPermissions: ['employee:view'], // Changed from permission to permission
    },
  },
  // Future HR Management routes can be added here
  // e.g., for leave management, performance reviews, etc.
]; 