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
    titleKey: 'common:menu.dashboard',
    icon: <DashboardOutlined />,
    component: './Dashboard',
  },
  {
    path: '/personal',
    titleKey: 'common:menu.personal',
    icon: <SolutionOutlined />,
    children: [
      {
        path: '/employee-info/my-info',
        titleKey: 'common:menu.personal.myInfo',
        component: './Employee/MyInfo',
      },
      {
        path: '/employee-info/my-payslips',
        titleKey: 'common:menu.personal.myPayslips',
        component: './Employee/MyPayslips',
      },
      {
        path: '/personal/leave',
        titleKey: 'common:menu.personal.myLeave',
        component: './Employee/MyLeave',
      },
    ],
  },
  {
    path: '/view-reports',
    titleKey: 'common:menu.viewReports',
    icon: <EyeOutlined />,
    children: [
      {
        path: '/view-reports/management',
        titleKey: 'common:menu.viewReports.management',
        icon: <EyeOutlined />,
        component: './Admin/ReportView',
      },
    ],
  },
  {
    path: '/payroll',
    titleKey: 'common:menu.payroll',
    icon: <DollarCircleOutlined />,
    children: [
      {
        path: '/finance/payroll/periods',
        titleKey: 'common:menu.payroll.periods',
        component: './Payroll/pages/PayrollPeriodsPage',
      },
      {
        path: '/finance/payroll/runs',
        titleKey: 'common:menu.payroll.runs',
        component: './Payroll/pages/PayrollRunsPage',
      },
      {
        path: '/finance/payroll/entry',
        titleKey: 'common:menu.payroll.entry',
        component: './Payroll/pages/PayrollEntryPage',
      },
      {
        path: '/finance/payroll/components',
        titleKey: 'common:menu.payroll.components',
        component: './Payroll/pages/PayrollComponentsPage',
      },
      {
        path: '/finance/payroll/bulk-import',
        titleKey: 'common:menu.payroll.bulkImport',
        component: './Payroll/pages/PayrollBulkImportPage',
      },
      {
        path: '/finance/payroll/runs/:id',
        titleKey: 'common:menu.payroll.runDetail',
        hideInMenu: true,
        component: './Payroll/pages/PayrollRunDetailPage',
      },
    ],
  },
  {
    path: '/hr',
    titleKey: 'common:menu.hr',
    icon: <TeamOutlined />,
    children: [
      {
        path: '/hr/employees',
        titleKey: 'common:menu.hr.employees',
        icon: <TeamOutlined />,
        component: './HRManagement/employees/EmployeeListPage',
      },
      {
        path: '/hr/employees/new',
        titleKey: 'common:menu.hr.employeesNew',
        icon: <UserAddOutlined />,
        component: './HRManagement/employees/CreateEmployeePage',
      },
      {
        path: '/hr/employees/bulk-import',
        titleKey: 'common:menu.hr.employeesBulkImport',
        icon: <UploadOutlined />,
        component: './HRManagement/bulkImport/EmployeeBulkImportPage',
      },
      {
        path: '/hr/employees/:id',
        titleKey: 'common:menu.hr.employeesDetail',
        hideInMenu: true,
        component: './HRManagement/employees/EmployeeDetailPage',
      },
      {
        path: '/hr/employees/:id/edit',
        titleKey: 'common:menu.hr.employeesEdit',
        hideInMenu: true,
        component: './HRManagement/employees/EditEmployeePage',
      },
    ],
  },
  {
    path: '/organization',
    titleKey: 'common:menu.organization',
    icon: <ApartmentOutlined />,
    children: [
      {
        path: '/admin/organization/departments',
        titleKey: 'common:menu.organization.departments',
        component: './Admin/Organization/DepartmentsPage',
      },
      {
        path: '/admin/organization/personnel-categories',
        titleKey: 'common:menu.organization.personnelCategories',
        component: './Admin/Organization/PersonnelCategoriesPage',
      },
      {
        path: '/admin/organization/positions',
        titleKey: 'common:menu.organization.positions',
        component: './Admin/Organization/ActualPositionTab',
      },
    ],
  },
  {
    path: '/manager',
    titleKey: 'common:menu.manager',
    icon: <UserSwitchOutlined />,
    children: [
      {
        path: '/manager/subordinates',
        titleKey: 'common:menu.manager.subordinates',
        component: './Manager/Subordinates',
      },
      {
        path: '/manager/leave-approvals',
        titleKey: 'common:menu.manager.leaveApprovals',
        component: './Manager/LeaveApprovals',
      },
    ],
  },
  {
    path: '/admin',
    titleKey: 'common:menu.admin',
    icon: <SettingOutlined />,
    access: 'admin',
    children: [
      {
        path: '/admin/users',
        titleKey: 'common:menu.admin.users',
        component: './Admin/Permissions/UserListPage',
      },
      {
        path: '/admin/roles',
        titleKey: 'common:menu.admin.roles',
        component: './Admin/Permissions/RoleListPage',
      },
      {
        path: '/admin/permissions',
        titleKey: 'common:menu.admin.permissions',
        component: './Admin/Permissions/PermissionListPage',
      },
      {
        path: '/admin/system-settings',
        titleKey: 'common:menu.admin.systemSettings',
        component: './Admin/Configuration/SystemSettings',
      },
      {
        path: '/admin/data-import',
        name: '数据导入',
        titleKey: 'common:menu.admin.dataImport',
        icon: <DatabaseOutlined />,
        component: './Admin/Configuration/DataImport',
      },
      {
        path: '/admin/sql-editor',
        name: 'SQL编辑器',
        titleKey: 'common:menu.admin.sqlEditor',
        icon: <CodeOutlined />,
        component: './Admin/Configuration/SqlEditorPage',
      },
      {
        path: '/admin/report-template',
        name: '报表模板',
        titleKey: 'common:menu.admin.reportTemplate',
        icon: <FileTextOutlined />,
        component: './Admin/Configuration/ReportTemplateDemo',
      },
      {
        path: '/admin/report-table',
        name: '报表表格',
        titleKey: 'common:menu.admin.reportTable',
        icon: <TableOutlined />,
        component: './Admin/Configuration/ReportTableDemo',
      },
    ],
  },
];

// 🔧 菜单数据处理工具函数
export const transformMenuData = (data: AppMenuDataItem[]): MenuDataItem[] => {
  const { t } = useTranslation(['common']);
  return data.map((item) => ({
    ...item,
    children: item.children ? transformMenuData(item.children) : undefined,
    name: item.name || (item.titleKey ? t(item.titleKey) : undefined),
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
  const breadcrumbMap: Record<string, MenuDataItem> = {};
  const { t } = useTranslation(['common']);
  
  const traverse = (data: AppMenuDataItem[], parentPath = '') => {
    data.forEach((item) => {
      if (item.path) {
        const fullPath = item.path.startsWith('/') ? item.path : `${parentPath}${item.path}`;
        breadcrumbMap[fullPath] = {
          ...item,
          name: item.titleKey ? t(item.titleKey) : item.name,
        };
        
        if (item.children) {
          traverse(item.children, fullPath);
        }
      }
    });
  };
  
  traverse(menuData);
  return breadcrumbMap;
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