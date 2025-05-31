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
    name: '仪表盘',
    titleKey: 'dashboard',
    icon: <DashboardOutlined />,
    component: './Dashboard',
  },
  {
    path: '/personal',
    name: '个人中心',
    titleKey: 'personal',
    icon: <SolutionOutlined />,
    children: [
      {
        path: '/employee-info/my-info',
        name: '我的信息',
        titleKey: 'personalMyInfo',
        component: './Employee/MyInfo',
      },
      {
        path: '/employee-info/my-payslips',
        name: '我的工资单',
        titleKey: 'personalMyPayslips',
        component: './Employee/MyPayslips',
      },
      {
        path: '/personal/leave',
        name: '我的请假',
        titleKey: 'personalLeave',
        component: './Employee/MyLeave',
      },
    ],
  },
  {
    path: '/view-reports',
    name: '视图报表',
    titleKey: 'viewReports',
    icon: <EyeOutlined />,
    children: [
      {
        path: '/view-reports/management', // 修改子菜单路径以确保唯一性
        name: '报表管理',
        titleKey: 'viewReportsManagement',
        icon: <EyeOutlined />, // 子菜单图标可以考虑移除或更改，以区分父菜单
        component: './Admin/ReportView',
      },
    ],
  },
  {
    path: '/payroll',
    name: '薪资管理',
    titleKey: 'payroll',
    icon: <DollarCircleOutlined />,
    children: [
      {
        path: '/finance/payroll/periods',
        name: '薪资周期',
        titleKey: 'payrollPeriods',
        component: './Payroll/pages/PayrollPeriodsPage',
      },
      {
        path: '/finance/payroll/runs',
        name: '薪资审核',
        titleKey: 'payrollRuns',
        component: './Payroll/pages/PayrollRunsPage',
      },
      {
        path: '/finance/payroll/entry',
        name: '薪资条目',
        titleKey: 'payrollEntry',
        component: './Payroll/pages/PayrollEntryPage',
      },
      {
        path: '/finance/payroll/components',
        name: '薪资字段',
        titleKey: 'payrollComponents',
        component: './Payroll/pages/PayrollComponentsPage',
      },
      {
        path: '/finance/payroll/bulk-import',
        name: '薪资批量导入',
        titleKey: 'payrollBulkImport',
        component: './Payroll/pages/PayrollBulkImportPage',
      },
      {
        path: '/finance/payroll/runs/:id',
        name: '薪资审核详情',
        titleKey: 'payrollRunDetail',
        hideInMenu: true,
        component: './Payroll/pages/PayrollRunDetailPage',
      },
    ],
  },
  {
    path: '/hr',
    name: '员工管理',
    titleKey: 'hr',
    icon: <TeamOutlined />,
    children: [
      {
        path: '/hr/employees',
        name: '员工档案',
        titleKey: 'hrEmployees',
        icon: <TeamOutlined />,
        component: './HRManagement/employees/EmployeeListPage',
      },
      {
        path: '/hr/employees/new',
        name: '创建员工',
        titleKey: 'hrEmployeesNew',
        icon: <UserAddOutlined />,
        component: './HRManagement/employees/CreateEmployeePage',
      },
      {
        path: '/hr/employees/bulk-import',
        name: '员工批量导入',
        titleKey: 'hrEmployeesBulkImport',
        icon: <UploadOutlined />,
        component: './HRManagement/bulkImport/EmployeeBulkImportPage',
      },
      {
        path: '/hr/employees/:id',
        name: '员工详情',
        titleKey: 'hrEmployeesDetail',
        hideInMenu: true,
        component: './HRManagement/employees/EmployeeDetailPage',
      },
      {
        path: '/hr/employees/:id/edit',
        name: '编辑员工',
        titleKey: 'hrEmployeesEdit',
        hideInMenu: true,
        component: './HRManagement/employees/EditEmployeePage',
      },
    ],
  },
  {
    path: '/organization',
    name: '组织架构',
    titleKey: 'organization',
    icon: <ApartmentOutlined />,
    children: [
      {
        path: '/admin/organization/departments',
        name: '部门管理',
        titleKey: 'organizationDepartments',
        component: './Admin/Organization/DepartmentsPage',
      },
      {
        path: '/admin/organization/personnel-categories',
        name: '人员类别',
        titleKey: 'organizationPersonnelCategories',
        component: './Admin/Organization/PersonnelCategoriesPage',
      },
      {
        path: '/admin/organization/positions',
        name: '实际职务',
        titleKey: 'organizationPositions',
        component: './Admin/Organization/ActualPositionTab',
      },
    ],
  },
  {
    path: '/manager',
    name: '经理视图',
    titleKey: 'manager',
    icon: <UserSwitchOutlined />,
    children: [
      {
        path: '/manager/subordinates',
        name: '下属管理',
        titleKey: 'managerSubordinates',
        component: './Manager/Subordinates',
      },
      {
        path: '/manager/leave-approvals',
        name: '请假审批',
        titleKey: 'managerLeaveApprovals',
        component: './Manager/LeaveApprovals',
      },
    ],
  },
  {
    path: '/admin',
    name: '系统管理',
    titleKey: 'admin',
    icon: <SettingOutlined />,
    children: [
      {
        path: '/admin/users',
        name: '用户管理',
        titleKey: 'adminUsers',
        component: './Admin/Users',
      },
      {
        path: '/admin/roles',
        name: '角色管理',
        titleKey: 'adminRoles',
        component: './Admin/Roles',
      },
      {
        path: '/admin/permissions',
        name: '权限管理',
        titleKey: 'adminPermissions',
        component: './Admin/Permissions/PermissionListPage',
      },
      {
        path: '/admin/config',
        name: '系统配置',
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