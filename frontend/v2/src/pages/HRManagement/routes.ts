// HRManagement Module Routes
import React from 'react';
import type { AppRouteObject } from '../../router/routes'; // Corrected: AppRouteObject is exported from routes.tsx
// 不要在模块级别导入 i18n 并直接调用 t() 函数
// import i18n from '../../i18n'; // Import i18n instance

// Import page components
import EmployeeListPage from './employees/EmployeeListPage';
import CreateEmployeePage from './employees/CreateEmployeePage';
import EditEmployeePage from './employees/EditEmployeePage';
import EmployeeDetailPage from './employees/EmployeeDetailPage'; // Import the new detail page

// Placeholders for page components - will be replaced with actual imports later
const CreateEmployeePagePlaceholder = () => React.createElement('div', null, 'pageTitle:create_employee_placeholder');
const EditEmployeePagePlaceholder = () => React.createElement('div', null, 'pageTitle:edit_employee_placeholder');
const EmployeeDetailPagePlaceholder = () => React.createElement('div', null, 'pageTitle:employee_detail_placeholder');
// const HRManagementLayoutPlaceholder = ({ children }: { children: React.ReactNode }) => <>{children}</>; // Example if a sub-layout was used

export const hrManagementRoutes: AppRouteObject[] = [
  {
    path: 'employees',
    element: React.createElement(EmployeeListPage),
    meta: {
      title: 'employee:list_page.page_title', // 使用静态翻译键
      requiredPermissions: ['employee:list'], // Changed from permission to requiredPermissions
      hideInBreadcrumbIfParentOfNext: true,
    },
  },
  {
    path: 'employees/new',
    element: React.createElement(CreateEmployeePage),
    meta: {
      title: 'employee:create_employee_page.title', // 使用静态翻译键
      requiredPermissions: ['employee:create'], // Changed from permission to requiredPermissions
    },
  },
  {
    path: 'employees/:employeeId/edit',
    element: React.createElement(EditEmployeePage),
    meta: {
      title: 'employee:edit_employee_page.title', // 使用静态翻译键
      requiredPermissions: ['employee:edit'], // Changed from permission to requiredPermissions
    },
  },
  {
    path: 'employees/:employeeId', // Detail page route
    element: React.createElement(EmployeeDetailPage), // Use the actual component
    meta: {
      title: 'employee:detail_page.title', // 使用静态翻译键
      requiredPermissions: ['employee:view'], // Changed from permission to permission
    },
  },
  // Future HR Management routes can be added here
  // e.g., for leave management, performance reviews, etc.
]; 