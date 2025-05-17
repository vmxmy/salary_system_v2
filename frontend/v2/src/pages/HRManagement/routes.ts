// HRManagement Module Routes
import React from 'react';
import type { AppRouteObject } from '../../router/routes'; // Corrected: AppRouteObject is exported from routes.tsx
import i18n from '../../i18n'; // Import i18n instance

// Import page components
import EmployeeListPage from './employees/EmployeeListPage';
import CreateEmployeePage from './employees/CreateEmployeePage';
import EditEmployeePage from './employees/EditEmployeePage';
import EmployeeDetailPage from './employees/EmployeeDetailPage'; // Import the new detail page

// Placeholders for page components - will be replaced with actual imports later
const EmployeeListPagePlaceholder = () => React.createElement('div', null, '员工列表页面占位符');
const CreateEmployeePagePlaceholder = () => React.createElement('div', null, '新建员工页面占位符');
const EditEmployeePagePlaceholder = () => React.createElement('div', null, '编辑员工页面占位符');
const EmployeeDetailPagePlaceholder = () => React.createElement('div', null, '员工详情页面占位符 - 待实现');
// const HRManagementLayoutPlaceholder = ({ children }: { children: React.ReactNode }) => <>{children}</>; // Example if a sub-layout was used

export const hrManagementRoutes: AppRouteObject[] = [
  {
    path: 'employees',
    element: React.createElement(EmployeeListPage),
    meta: {
      title: i18n.t('page_title.employee_files'),
      requiredPermissions: ['employee:list'], // Changed from permission to requiredPermissions
      hideInBreadcrumbIfParentOfNext: true,
    },
  },
  {
    path: 'employees/create',
    element: React.createElement(CreateEmployeePage),
    meta: {
      title: i18n.t('page_title.create_employee'),
      requiredPermissions: ['employee:create'], // Changed from permission to requiredPermissions
    },
  },
  {
    path: 'employees/:employeeId/edit',
    element: React.createElement(EditEmployeePage),
    meta: {
      title: i18n.t('page_title.edit_employee'),
      requiredPermissions: ['employee:edit'], // Changed from permission to requiredPermissions
    },
  },
  {
    path: 'employees/:employeeId', // Detail page route
    element: React.createElement(EmployeeDetailPage), // Use the actual component
    meta: {
      title: i18n.t('page_title.employee_details'),
      requiredPermissions: ['employee:view'], // Changed from permission to requiredPermissions
    },
  },
  // Future HR Management routes can be added here
  // e.g., for leave management, performance reviews, etc.
]; 