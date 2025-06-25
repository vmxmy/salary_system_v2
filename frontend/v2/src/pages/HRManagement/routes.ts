// HRManagement Module Routes
import React from 'react';
import type { AppRouteObject } from '../../router/routes'; // Corrected: AppRouteObject is exported from routes.tsx
// 不要在模块级别导入 i18n 并直接调用 t() 函数
// import i18n from '../../i18n'; // Import i18n instance

// 使用现代化版本的员工列表页面
const EmployeeListPageUniversal = React.lazy(() => import('./employees/EmployeeListPageUniversal'));
const CreateEmployeePage = React.lazy(() => import('./employees/CreateEmployeePageModern'));
const EditEmployeePage = React.lazy(() => import('./employees/EditEmployeePageModern'));
const EmployeeDetailPage = React.lazy(() => import('./employees/EmployeeDetailPageModern'));

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
      React.createElement(EmployeeListPageUniversal)
    ),
    meta: {
      title: 'employee:universal_list_page.page_title', // 使用新版员工列表页面
      requiredPermissions: ['employee:list'], // Changed from permission to requiredPermissions
      hideInBreadcrumbIfParentOfNext: true,
    },
  },
  {
    path: 'employees/universal',
    element: React.createElement(
      React.Suspense,
      { fallback: React.createElement('div', { className: 'page-loading-suspense' }, 'Loading Universal Employee List...') },
      React.createElement(EmployeeListPageUniversal)
    ),
    meta: {
      title: 'employee:universal_list_page.page_title', // 新版员工列表页面标题
      requiredPermissions: ['employee:list'], // 相同的权限要求
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