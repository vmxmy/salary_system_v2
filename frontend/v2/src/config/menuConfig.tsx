import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  TeamOutlined,
  UserAddOutlined,
  UploadOutlined,
  DollarCircleOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  ApartmentOutlined,
  SolutionOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TableOutlined,
  CalculatorOutlined,
  DatabaseOutlined,
  CodeOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-components';

// 导出MenuDataItem类型供其他文件使用
export type { MenuDataItem };

// 🎯 菜单项类型定义
export interface AppMenuDataItem extends MenuDataItem {
  /** 菜单名称 */
  name?: string;
  /** 翻译key */
  titleKey?: string;
  /** 图标 */
  icon?: React.ReactNode;
  /** 路径 */
  path?: string;
  /** 子菜单 */
  children?: AppMenuDataItem[];
  /** 权限标识 */
  access?: string;
  /** 是否隐藏菜单 */
  hideInMenu?: boolean;
  /** 是否隐藏子菜单 */
  hideChildrenInMenu?: boolean;
  /** 组件 */
  component?: string;
  /** 重定向路径 */
  redirect?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 菜单组标题 */
  groupTitle?: string;
}

// 🌐 菜单国际化转换函数 (Corrected function definition)
export const transformMenuDataWithI18n = (
  data: AppMenuDataItem[],
  t: (key: string) => string
): MenuDataItem[] => {
  return data.map(item => {
    const transformedItem: MenuDataItem = {
      ...item,
      name: item.titleKey ? t(item.titleKey) : item.name,
    };

    if (item.children) {
      transformedItem.children = transformMenuDataWithI18n(item.children, t);
    }

    return transformedItem;
  });
};

// 📋 菜单数据配置
export const menuData: AppMenuDataItem[] = [
  {
    path: '/dashboard',
    titleKey: 'dashboard',
    icon: <DashboardOutlined />,
    component: './Dashboard',
  },
  {
    path: '/personal',
    titleKey: 'personal.title',
    icon: <SolutionOutlined />,
    children: [
      {
        path: '/employee-info/my-info',
        titleKey: 'personal.myInfo',
        component: './Employee/MyInfo',
      },
      {
        path: '/employee-info/my-payslips',
        titleKey: 'personal.myPayslips',
        component: './Employee/MyPayslips',
      },
      {
        path: '/personal/leave',
        titleKey: 'personal.myLeave',
        component: './Employee/MyLeave',
      },
    ],
  },
  {
    path: '/view-reports',
    titleKey: 'viewReports.title',
    icon: <EyeOutlined />,
    children: [
      {
        path: '/view-reports/management',
        titleKey: 'viewReports.management',
        icon: <EyeOutlined />,
        component: './Admin/ReportView',
      },
    ],
  },
  {
    path: '/payroll',
    titleKey: 'payroll.title',
    icon: <DollarCircleOutlined />,
    children: [
      {
        path: '/finance/payroll/periods',
        titleKey: 'payroll.periods',
        component: './Payroll/pages/PayrollPeriodsPage',
      },
      {
        path: '/finance/payroll/runs',
        titleKey: 'payroll.runs',
        component: './Payroll/pages/PayrollRunsPage',
      },
      {
        path: '/finance/payroll/entry',
        titleKey: 'payroll.entry',
        component: './Payroll/pages/PayrollEntryPage',
      },
      {
        path: '/finance/payroll/components',
        titleKey: 'payroll.components',
        component: './Payroll/pages/PayrollComponentsPage',
      },
      {
        path: '/finance/payroll/bulk-import',
        titleKey: 'payroll.bulkImport',
        component: './Payroll/pages/PayrollBulkImportPage',
      },
      {
        path: '/finance/payroll/calculation-config',
        titleKey: 'payroll.calculationConfig',
        component: './Payroll/pages/PayrollCalculationConfigPage',
      },
      {
        path: '/finance/payroll/attendance',
        titleKey: 'payroll.attendance',
        component: './Payroll/pages/AttendanceManagementPage',
      },
      {
        path: '/finance/payroll/runs/:id',
        titleKey: 'payroll.runDetail',
        hideInMenu: true,
        component: './Payroll/pages/PayrollRunDetailPage',
      },
    ],
  },
  {
    path: '/hr',
    titleKey: 'hr.title',
    icon: <TeamOutlined />,
    children: [
      {
        path: '/hr/employees',
        titleKey: 'hr.employees',
        icon: <TeamOutlined />,
        component: './HRManagement/employees/EmployeeListPage',
      },
      {
        path: '/hr/employees/new',
        titleKey: 'hr.employeesNew',
        icon: <UserAddOutlined />,
        component: './HRManagement/employees/CreateEmployeePage',
      },
      {
        path: '/hr/employees/bulk-import',
        titleKey: 'hr.employeesBulkImport',
        icon: <UploadOutlined />,
        component: './HRManagement/bulkImport/EmployeeBulkImportPage',
      },
      {
        path: '/hr/employees/:id',
        titleKey: 'hr.employeesDetail',
        hideInMenu: true,
        component: './HRManagement/employees/EmployeeDetailPage',
      },
      {
        path: '/hr/employees/:id/edit',
        titleKey: 'hr.employeesEdit',
        hideInMenu: true,
        component: './HRManagement/employees/EditEmployeePage',
      },
    ],
  },
  {
    path: '/organization',
    titleKey: 'organization.title',
    icon: <ApartmentOutlined />,
    children: [
      {
        path: '/admin/organization/departments',
        titleKey: 'organization.departments',
        component: './Admin/Organization/DepartmentsPage',
      },
      {
        path: '/admin/organization/personnel-categories',
        titleKey: 'organization.personnelCategories',
        component: './Admin/Organization/PersonnelCategoriesPage',
      },
      {
        path: '/admin/organization/positions',
        titleKey: 'organization.positions',
        component: './Admin/Organization/PositionsPage',
      },
    ],
  },
  {
    path: '/manager',
    titleKey: 'manager.title',
    icon: <UserSwitchOutlined />,
    children: [
      {
        path: '/manager/subordinates',
        titleKey: 'manager.subordinates',
        component: './Manager/SubordinatesPage',
      },
      {
        path: '/manager/leave-approvals',
        titleKey: 'manager.leaveApprovals',
        component: './Manager/LeaveApprovalsPage',
      },
    ],
  },
  {
    path: '/admin',
    titleKey: 'admin.title',
    icon: <SettingOutlined />,
    access: 'admin',
    children: [
      {
        path: '/admin/users',
        titleKey: 'admin.users',
        component: './Admin/Permissions/UserListPage',
      },
      {
        path: '/admin/roles',
        titleKey: 'admin.roles',
        component: './Admin/Permissions/RoleListPage',
      },
      {
        path: '/admin/permissions',
        titleKey: 'admin.permissions',
        component: './Admin/Permissions/PermissionListPage',
      },
      {
        path: '/admin/config',
        titleKey: 'admin.systemSettings',
        component: './Admin/Config',
      },
      {
        path: '/admin/data-import',
        titleKey: 'admin.dataImport',
        component: './Admin/DataImport',
      },
      {
        path: '/admin/sql-editor',
        titleKey: 'admin.sqlEditor',
        component: './Admin/SQLEditor',
      },
      {
        path: '/admin/report-templates',
        titleKey: 'admin.reportTemplate',
        component: './Admin/ReportView',
      },
      {
        path: '/admin/report-tables',
        titleKey: 'admin.reportTable',
        component: './Admin/ReportTableDemo',
      },
    ],
  },
  {
    path: '/test',
    titleKey: 'test.title',
    icon: <CalculatorOutlined />,
    hideInMenu: false,
    children: [
      {
        path: '/test/employee-list-v3',
        titleKey: 'test.employeeListV3',
        component: './HRManagement/employees/EmployeeListPageV3',
      },
      {
        path: '/test/report-table-demo',
        titleKey: 'test.reportTableDemo',
        component: './Admin/ReportTableDemoPage',
      },
      {
        path: '/test/report-template-demo',
        titleKey: 'test.reportTemplateDemo',
        component: './Admin/ReportTemplateDemoPage',
      },
    ],
  },
];

// 🔧 菜单数据处理工具函数
export const transformMenuData = (
  data: AppMenuDataItem[],
  t: (key: string, options?: { ns?: string; defaultValue?: string }) => string
): MenuDataItem[] => {
  return data.map((item) => ({
    ...item,
    children: item.children ? transformMenuData(item.children, t) : undefined,
    name: item.name || (item.titleKey ? t(`menu:${item.titleKey}`) : undefined),
  }));
};

// 🎯 根据路径查找菜单项
export const findMenuItemByPath = (
  menuData: AppMenuDataItem[],
  path: string
): AppMenuDataItem | null => {
  for (const item of menuData) {
    if (item.path === path) {
      return item;
    }
    if (item.children) {
      const found = findMenuItemByPath(item.children, path);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// 📝 获取面包屑数据
export const getBreadcrumbNameMap = (
  menuData: AppMenuDataItem[],
  t: (key: string) => string
): Record<string, MenuDataItem> => {
  const map: Record<string, MenuDataItem> = {};
  const traverse = (data: AppMenuDataItem[], parentPath = '') => {
    data.forEach(item => {
      const currentPath = item.path || '';
      const fullPath = currentPath.startsWith('/') ? currentPath : `${parentPath}/${currentPath}`;
      if (fullPath) {
        map[fullPath] = { ...item, name: item.titleKey ? t(`menu:${item.titleKey}`) : item.name };
      }
      if (item.children) {
        traverse(item.children, fullPath);
      }
    });
  };
  traverse(menuData);
  return map;
};

// 🎨 菜单主题配置
export const menuTheme = {
  dark: {
    itemBg: '#001529',
    subMenuItemBg: '#000c17',
    itemSelectedBg: '#1890ff',
    itemHoverBg: '#111b26',
    itemColor: 'rgba(255, 255, 255, 0.85)',
    itemSelectedColor: '#ffffff',
    itemHoverColor: '#ffffff',
  },
  light: {
    itemBg: '#ffffff',
    subMenuItemBg: '#fafafa',
    itemSelectedBg: '#e6f7ff',
    itemHoverBg: '#f5f5f5',
    itemColor: 'rgba(0, 0, 0, 0.85)',
    itemSelectedColor: '#1890ff',
    itemHoverColor: '#1890ff',
  },
};

// 📱 响应式菜单配置
export const responsiveMenuConfig = {
  // 移动端菜单模式
  mobile: {
    collapsed: true,
    onlyShowIcon: true,
  },
  // 平板端菜单模式
  tablet: {
    collapsed: false,
    onlyShowIcon: false,
  },
  // 桌面端菜单模式
  desktop: {
    collapsed: false,
    onlyShowIcon: false,
  },
};