import React from 'react';
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

// 🌐 菜单国际化转换函数
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
    name: {t('common:auto_text_e4bbaa')},
    titleKey: 'dashboard',
    icon: <DashboardOutlined />,
    component: './Dashboard',
  },
  {
    path: '/personal',
    name: {t('common:auto_text_e4b8aa')},
    titleKey: 'personal',
    icon: <SolutionOutlined />,
    children: [
      {
        path: '/employee-info/my-info',
        name: {t('common:auto_text_e68891')},
        titleKey: 'personalMyInfo',
        component: './Employee/MyInfo',
      },
      {
        path: '/employee-info/my-payslips',
        name: {t('common:auto_text_e68891')},
        titleKey: 'personalMyPayslips',
        component: './Employee/MyPayslips',
      },
      {
        path: '/personal/leave',
        name: {t('common:auto_text_e68891')},
        titleKey: 'personalLeave',
        component: './Employee/MyLeave',
      },
    ],
  },
  {
    path: '/view-reports',
    name: {t('common:auto_text_e8a786')},
    titleKey: 'viewReports',
    icon: <EyeOutlined />,
    children: [
      {
        path: '/view-reports/management', // 修改子菜单路径以确保唯一性
        name: {t('common:auto_text_e68aa5')},
        titleKey: 'viewReportsManagement',
        icon: <EyeOutlined />, // 子菜单图标可以考虑移除或更改，以区分父菜单
        component: './Admin/ReportView',
      },
    ],
  },
  {
    path: '/payroll',
    name: {t('common:auto_text_e896aa')},
    titleKey: 'payroll',
    icon: <DollarCircleOutlined />,
    children: [
      {
        path: '/finance/payroll/periods',
        name: {t('common:auto_text_e896aa')},
        titleKey: 'payrollPeriods',
        component: './Payroll/pages/PayrollPeriodsPage',
      },
      {
        path: '/finance/payroll/runs',
        name: {t('common:auto_text_e896aa')},
        titleKey: 'payrollRuns',
        component: './Payroll/pages/PayrollRunsPage',
      },
      {
        path: '/finance/payroll/entry',
        name: {t('common:auto_text_e896aa')},
        titleKey: 'payrollEntry',
        component: './Payroll/pages/PayrollEntryPage',
      },
      {
        path: '/finance/payroll/components',
        name: {t('common:auto_text_e896aa')},
        titleKey: 'payrollComponents',
        component: './Payroll/pages/PayrollComponentsPage',
      },
      {
        path: '/finance/payroll/bulk-import',
        name: {t('common:auto_text_e896aa')},
        titleKey: 'payrollBulkImport',
        component: './Payroll/pages/PayrollBulkImportPage',
      },
      {
        path: '/finance/payroll/runs/:id',
        name: {t('common:auto_text_e896aa')},
        titleKey: 'payrollRunDetail',
        hideInMenu: true,
        component: './Payroll/pages/PayrollRunDetailPage',
      },
    ],
  },
  {
    path: '/hr',
    name: {t('common:auto_text_e59198')},
    titleKey: 'hr',
    icon: <TeamOutlined />,
    children: [
      {
        path: '/hr/employees',
        name: {t('common:auto_text_e59198')},
        titleKey: 'hrEmployees',
        icon: <TeamOutlined />,
        component: './HRManagement/employees/EmployeeListPage',
      },
      {
        path: '/hr/employees/new',
        name: {t('common:auto_text_e5889b')},
        titleKey: 'hrEmployeesNew',
        icon: <UserAddOutlined />,
        component: './HRManagement/employees/CreateEmployeePage',
      },
      {
        path: '/hr/employees/bulk-import',
        name: {t('common:auto_text_e59198')},
        titleKey: 'hrEmployeesBulkImport',
        icon: <UploadOutlined />,
        component: './HRManagement/bulkImport/EmployeeBulkImportPage',
      },
      {
        path: '/hr/employees/:id',
        name: {t('common:auto_text_e59198')},
        titleKey: 'hrEmployeesDetail',
        hideInMenu: true,
        component: './HRManagement/employees/EmployeeDetailPage',
      },
      {
        path: '/hr/employees/:id/edit',
        name: {t('common:auto_text_e7bc96')},
        titleKey: 'hrEmployeesEdit',
        hideInMenu: true,
        component: './HRManagement/employees/EditEmployeePage',
      },
    ],
  },
  {
    path: '/organization',
    name: {t('common:auto_text_e7bb84')},
    titleKey: 'organization',
    icon: <ApartmentOutlined />,
    children: [
      {
        path: '/admin/organization/departments',
        name: {t('common:auto_text_e983a8')},
        titleKey: 'organizationDepartments',
        component: './Admin/Organization/DepartmentsPage',
      },
      {
        path: '/admin/organization/personnel-categories',
        name: {t('common:auto_text_e4baba')},
        titleKey: 'organizationPersonnelCategories',
        component: './Admin/Organization/PersonnelCategoriesPage',
      },
      {
        path: '/admin/organization/positions',
        name: {t('common:auto_text_e5ae9e')},
        titleKey: 'organizationPositions',
        component: './Admin/Organization/ActualPositionTab',
      },
    ],
  },
  {
    path: '/manager',
    name: {t('common:auto_text_e7bb8f')},
    titleKey: 'manager',
    icon: <UserSwitchOutlined />,
    children: [
      {
        path: '/manager/subordinates',
        name: {t('common:auto_text_e4b88b')},
        titleKey: 'managerSubordinates',
        component: './Manager/Subordinates',
      },
      {
        path: '/manager/leave-approvals',
        name: {t('common:auto_text_e8afb7')},
        titleKey: 'managerLeaveApprovals',
        component: './Manager/LeaveApprovals',
      },
    ],
  },
  {
    path: '/admin',
    name: {t('common:auto_text_e7b3bb')},
    titleKey: 'admin',
    icon: <SettingOutlined />,
    children: [
      {
        path: '/admin/users',
        name: {t('common:auto_text_e794a8')},
        titleKey: 'adminUsers',
        component: './Admin/Users',
      },
      {
        path: '/admin/roles',
        name: {t('common:auto_text_e8a792')},
        titleKey: 'adminRoles',
        component: './Admin/Roles',
      },
      {
        path: '/admin/permissions',
        name: {t('common:auto_text_e69d83')},
        titleKey: 'adminPermissions',
        component: './Admin/Permissions/PermissionListPage',
      },
      {
        path: '/admin/config',
        name: {t('common:auto_text_e7b3bb')},
        titleKey: 'adminConfig',
        component: './Admin/Config',
      },
    ],
  },
];

// 🔧 菜单数据处理工具函数
export const transformMenuData = (data: AppMenuDataItem[]): MenuDataItem[] => {
  return data.map((item) => ({
    ...item,
    children: item.children ? transformMenuData(item.children) : undefined,
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
  menuData: AppMenuDataItem[]
): Record<string, MenuDataItem> => {
  const map: Record<string, MenuDataItem> = {};
  
  const traverse = (data: AppMenuDataItem[], parentPath = '') => {
    data.forEach((item) => {
      if (item.path) {
        const fullPath = item.path.startsWith('/') ? item.path : `${parentPath}${item.path}`;
        map[fullPath] = item;
        
        if (item.children) {
          traverse(item.children, fullPath);
        }
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