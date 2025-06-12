import React from 'react';
import { useTranslation } from 'react-i18next';
import {
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
  CalculatorOutlined,
  UserOutlined,
  SafetyOutlined,
  ControlOutlined,
  ProfileOutlined,
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

// ====== 完整菜单配置 ======
export const menuData: AppMenuDataItem[] = [
  {
    name: '简单工资',
    titleKey: 'menu.simplePayroll.title',
    path: '/simple-payroll',
    icon: <CalculatorOutlined />,
  },
  {
    name: '报表管理',
    titleKey: 'menu.admin.reportConfig',
    path: '/admin/report-config',
    icon: <BarChartOutlined />,
  },
  {
    name: '薪资管理',
    titleKey: 'menu.payroll.title',
    path: '/finance/payroll',
    icon: <DollarCircleOutlined />,
    children: [
      {
        name: '工资期间',
        titleKey: 'menu.payroll.periods',
        path: '/finance/payroll/periods',
        icon: <SolutionOutlined />,
      },
      {
        name: '工资运行',
        titleKey: 'menu.payroll.runs',
        path: '/finance/payroll/runs',
        icon: <CalculatorOutlined />,
      },
      {
        name: '工资条目',
        titleKey: 'menu.payroll.entry',
        path: '/finance/payroll/entry',
        icon: <FileTextOutlined />,
      },
      {
        name: '批量导入',
        titleKey: 'menu.payroll.bulkImport',
        path: '/finance/payroll/bulk-import',
        icon: <UploadOutlined />,
      },
      {
        name: '薪资组件',
        titleKey: 'menu.payroll.components',
        path: '/finance/payroll/components',
        icon: <ProfileOutlined />,
      },
    ],
  },
  {
    name: '员工管理',
    titleKey: 'menu.hr.title',
    path: '/hr',
    icon: <TeamOutlined />,
    children: [
      {
        name: '员工列表',
        titleKey: 'menu.hr.employees',
        path: '/hr/employees',
        icon: <UserOutlined />,
      },
      {
        name: '新增员工',
        titleKey: 'menu.hr.employeesNew',
        path: '/hr/employees/new',
        icon: <UserAddOutlined />,
      },
      {
        name: '批量导入',
        titleKey: 'menu.hr.bulkImport',
        path: '/employee-management/bulk-import',
        icon: <UploadOutlined />,
      },
    ],
  },
  {
    name: '组织架构',
    titleKey: 'menu.organization.title',
    path: '/admin/organization',
    icon: <ApartmentOutlined />,
    children: [
      {
        name: '组织管理',
        titleKey: 'menu.organization.managementV2',
        path: '/admin/organization/management-v2',
        icon: <SettingOutlined />,
      },
    ],
  },

  {
    name: '系统管理',
    titleKey: 'menu.admin.title',
    path: '/admin',
    icon: <SettingOutlined />,
    children: [
      {
        name: '用户管理',
        titleKey: 'menu.admin.users',
        path: '/admin/users',
        icon: <TeamOutlined />,
      },
      {
        name: '角色管理',
        titleKey: 'menu.admin.roles',
        path: '/admin/roles',
        icon: <UserSwitchOutlined />,
      },
      {
        name: '权限管理',
        titleKey: 'menu.admin.permissions',
        path: '/admin/permissions',
        icon: <SafetyOutlined />,
      },
      {
        name: '系统配置',
        titleKey: 'menu.admin.systemSettings',
        path: '/admin/config',
        icon: <ControlOutlined />,
      },
    ],
  },
];

// ====== 动态菜单生成函数 ======
export const generateMenuData = (isDev: boolean = false): AppMenuDataItem[] => {
  const baseMenu = [...menuData];
  

  
  return baseMenu;
};

// ====== 菜单国际化处理函数（简单实现）======
export function transformMenuDataWithI18n(menu: AppMenuDataItem[], t?: (key: string) => string): AppMenuDataItem[] {
  return menu.map(item => ({
    ...item,
    name: t && item.titleKey ? t(item.titleKey) : item.name,
    children: item.children ? transformMenuDataWithI18n(item.children, t) : undefined,
  }));
}

// ====== 面包屑映射函数（简单实现）======
export function getBreadcrumbNameMap(
  menu: AppMenuDataItem[],
  t?: (key: string) => string
): Record<string, string> {
  const map: Record<string, string> = {};
  function traverse(items: AppMenuDataItem[]) {
    items.forEach(item => {
      if (item.path && item.name) {
        map[item.path] = item.name;
      }
      if (item.children) {
        traverse(item.children);
      }
    });
  }
  traverse(menu);
  return map;
}