import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Breadcrumb, Button, Tour, type TourProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  SafetyOutlined,
  UserSwitchOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  IdcardOutlined,
  ControlOutlined,
  UsergroupAddOutlined,
  UserAddOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  CalculatorOutlined,
  SolutionOutlined,
  ProfileOutlined,
  UploadOutlined,
  EditOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store';
import { usePermissions } from '../hooks/usePermissions';
import { allAppRoutes, type AppRouteObject } from '../router/routes'; // Import allAppRoutes and AppRouteObject type
import LanguageSwitcher from '../components/common/LanguageSwitcher'; // Import LanguageSwitcher
import { useTranslation } from 'react-i18next'; // Import useTranslation
import hyperchainLogoPath from '../assets/images/hyperchainLogo.svg'; // Standard image import
import { useEmployeePermissions } from '../hooks/useEmployeePermissions';

// Import payroll permissions
import { P_PAYROLL_PERIOD_VIEW, P_PAYROLL_RUN_VIEW, P_PAYROLL_ENTRY_VIEW, P_PAYROLL_ENTRY_BULK_IMPORT, P_PAYROLL_COMPONENT_VIEW } from '../pages/Payroll/constants/payrollPermissions';
// Import Manager permissions
import { P_MANAGER_SUBORDINATES_VIEW, P_MANAGER_LEAVE_APPROVALS_VIEW } from '../pages/Manager/routes';

const { Header, Content, Sider, Footer } = Layout;
const { Text } = Typography;

// 简单的面包屑名称映射，后续可以从路由 meta 中获取 - THIS WILL BE DEPRECATED by new logic
// const breadcrumbNameMap: Record<string, string> = {
//   '/dashboard': t('common:auto_text_e4bbaa'),
//   '/admin': t('common:auto_text_e7b3bb'),
//   '/admin/users': t('common:auto_text_e794a8'),
//   '/admin/roles': t('common:auto_text_e8a792'),
//   '/admin/config': t('common:auto_text_e7b3bb'),
//   '/admin/organization': t('common:auto_text_e7bb84'),
//   '/admin/organization/departments': t('common:auto_text_e983a8'),
//   '/admin/organization/job-titles': t('common:auto_text_e8818c'),
//   '/admin/permissions': t('common:auto_text_e69d83'),
//   '/hr': t('common:auto_text_e4baba'),
//   '/hr/employees': t('common:auto_text_e59198'),
//   // ...更多路径
// };


const MainLayout: React.FC = () => {
  const { t, i18n, ready } = useTranslation(['common', 'menu']);

  const [collapsed, setCollapsed] = useState(false); // 侧边栏默认展开
  const [openKeys, setOpenKeys] = useState<string[]>([]); // 添加openKeys状态
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const authToken = useSelector((state: RootState) => state.auth.authToken);
  const userPermissions = useSelector((state: RootState) => state.auth.userPermissions);
  const userRoleCodes = useSelector((state: RootState) => state.auth.userRoleCodes);
  const { hasPermission, hasRole } = usePermissions();

  // Refs for Tour targets
  const refDashboard = useRef(null);
  const refBulkImport = useRef(null);
  const refAiRobot = useRef(null);

  // State for Tour visibility
  const [openTour, setOpenTour] = useState<boolean>(false);

  // Tour steps
  const steps: TourProps['steps'] = [
    {
      title: t('tour:dashboard.title'),
      description: t('tour:dashboard.description'),
      target: () => refDashboard.current,
      nextButtonProps: { children: t('tour:common.next') },
      prevButtonProps: { children: t('tour:common.previous') },
    },
    {
      title: t('tour:bulk_import.title'),
      description: t('tour:bulk_import.description'),
      target: () => refBulkImport.current,
      nextButtonProps: { children: t('tour:common.next') },
      prevButtonProps: { children: t('tour:common.previous') },
      // disabled: !refBulkImport.current, // Example: Disable step if target is not available (though ref is assigned in useEffect)
    },
    {
      title: t('tour:ai_robot.title'),
      description: t('tour:ai_robot.description'),
      target: () => refAiRobot.current,
      nextButtonProps: { children: t('tour:common.finish') }, // Last step
      prevButtonProps: { children: t('tour:common.previous') },
      // disabled: !refAiRobot.current, // Example: Disable step if target is not available
    },
  ];
  
  useEffect(() => {
    const tourSeen = localStorage.getItem('mainTourSeenV2'); // Use a versioned key if needed
    if (tourSeen !== 'true') {
      setTimeout(() => {
        // @ts-ignore
        refDashboard.current = document.getElementById('tour-dashboard-link');
        // @ts-ignore
        refBulkImport.current = document.getElementById('tour-bulk-import-link');
        // @ts-ignore
        refAiRobot.current = document.getElementById('dify-chatbot-bubble-button');

        // Basic check if primary static target is available.
        // AI Bot target is dynamic, Tour step should handle if it's not immediately available or gracefully skip.
        if (refDashboard.current) { 
          // Check if all refs are loaded before opening the tour, especially dynamic ones
          // For a better UX, one might want to wait for refAiRobot.current to be available
          // or have the Tour component itself handle potentially missing targets gracefully per step.
          // A simple check: if (refDashboard.current && refAiRobot.current) 
          // For now, proceeding if dashboard is found.
          setOpenTour(true);
        } else {
        }
      }, 1500); // Increased delay to allow Dify bot to potentially load
    }
  }, []);

  const handleCloseTour = () => {
    setOpenTour(false);
    localStorage.setItem('mainTourSeenV2', 'true');
  };

  useEffect(() => {
    // 初始加载或 token 变化时，如果没有用户信息且有 token，尝试获取
    // (这个逻辑可能已在 authStore 初始化时处理，此处为双重保障或特定场景)
    // if (authToken && !currentUser) {
    //   useAuthStore.getState().fetchCurrentUser();
    // }
  }, [authToken, currentUser]);


  const handleLogout = async () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/employee-info/my-info">{ready ?      t('user_menu:profile'): 'Profile'}</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: ready ?      t('user_menu:logout'): 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // 生成面包屑
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const extraBreadcrumbItems = useMemo(() => {
    return pathSnippets
      .map((snippet, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        const route = allAppRoutes.find((r) => {
            // Normalize paths by removing trailing slashes for comparison
            const rPath = r.path?.replace(/\/+$/, '');
            const uPath = url.replace(/\/+$/, '');
            // Exact match or parameterized match (basic check)
            if (rPath === uPath) return true;
            if (rPath?.includes(':') && uPath.startsWith(rPath.substring(0, rPath.indexOf(':')))) {
              // Basic check for parameterized routes, consider more robust matching if needed
              const rPathParts = rPath.split('/');
              const uPathParts = uPath.split('/');
              if (rPathParts.length === uPathParts.length) {
                return rPathParts.every((part, i) => part.startsWith(':') || part === uPathParts[i]);
              }
            }
            return false;
        });

        if (route?.meta?.hideInBreadcrumbIfParentOfNext && index < pathSnippets.length - 1) {
          return null;
        }

        const nameKey = route?.meta?.title || snippet;
        let translatedName = nameKey; // Default to key or snippet

        // Only attempt translation if i18next is ready and it's a valid-looking key
        if (ready && route?.meta?.title) {
          // Assuming meta.title is always a key. If it might be an already translated string,
          // this logic would need to be smarter, or routes.tsx must guarantee only keys.
          // For keys like "hr:bulk_import.page_title", t function handles namespace.
          // For keys like "dashboard", it will use defaultNS or specified ns in useTranslation.
          // The namespaces provided to useTranslation at the top should cover all cases.
          translatedName = t(nameKey, { ns: 'menu', defaultValue: nameKey });
        } else if (!ready && route?.meta?.title) {
          // If not ready, use the key itself or a placeholder
          translatedName = nameKey; // Or some loading indicator like "Loading..."
        }

        return {
          key: url,
          title: index === pathSnippets.length - 1 ? translatedName : <Link to={url}>{translatedName}</Link>,
        };
      })
      .filter(item => item !== null) as { key: string; title: React.ReactNode }[];
  }, [location.pathname, allAppRoutes, t, ready]);

  const breadcrumbItems = [
    {
      key: 'home',
      title: <Link to="/dashboard"><HomeOutlined />{t('menu:home')}</Link>,
    },
    ...extraBreadcrumbItems,
  ];

  // Set document title effect
  useEffect(() => {
    if (ready) {
      let currentTitleKey = 'menu:home'; // Default to a menu key, e.g., home
      // No need for titleNs array if we consistently use keys with namespaces

      const currentRoute = allAppRoutes.find(r => location.pathname === r.path || (r.path && location.pathname.startsWith(r.path + '/') && r.path !== '/'));
      
      if (currentRoute?.meta?.title) {
        currentTitleKey = currentRoute.meta.title; // This should already be like 'menu:dashboard'
      }
      
      // For keys like "menu:dashboard", t function handles namespace automatically if it's available.
      // We explicitly pass `ns: 'menu'` just in case, though i18next should handle it based on the key itself.
      const appBaseTitle = t('sider.title.full', { ns: 'common', defaultValue: "Salary System" });
      const dynamicTitle = t(currentTitleKey, { ns: 'menu', defaultValue: currentTitleKey }); // Explicitly use menu namespace

      document.title = `${dynamicTitle} - ${appBaseTitle}`;
    }
  }, [location.pathname, t, ready, allAppRoutes]);

  // Dynamically build admin children based on permissions
  const organizationChildren = [
    // These labels come from route.meta.title via allAppRoutes, so they will be translated if link text is derived from it in Menu items.
    // Or, if Menu items are constructed with explicit labels, those labels need t()
    { key: '/admin/organization/departments', label: <Link to="/admin/organization/departments">{t('menu:organization.departments')}</Link>, icon: <BranchesOutlined /> },
    { key: '/admin/organization/positions', label: <Link to="/admin/organization/job-titles">{t('menu:organization.positions')}</Link>, icon: <IdcardOutlined /> },
  ];

  const adminChildren = useMemo(() => {
    const baseAdminChildren = [
      { key: '/admin/users', label: <Link to="/admin/users">{t('menu:admin.users')}</Link>, icon: <TeamOutlined /> },
      { key: '/admin/roles', label: <Link to="/admin/roles">{t('menu:admin.roles')}</Link>, icon: <UserSwitchOutlined /> },
      { key: '/admin/config', label: <Link to="/admin/config">{t('menu:admin.systemSettings')}</Link>, icon: <ControlOutlined /> },
    ];
    if (hasRole('SUPER_ADMIN')) {
      const permissionsLink = {
        key: '/admin/permissions',
        label: <Link to="/admin/permissions">{t('menu:admin.permissions')}</Link>,
        icon: <SafetyOutlined />,
      };
      const rolesIndex = baseAdminChildren.findIndex(child => child.key === '/admin/roles');
      if (rolesIndex !== -1) {
        baseAdminChildren.splice(rolesIndex + 1, 0, permissionsLink);
      } else {
        baseAdminChildren.push(permissionsLink);
      }
    }
    return baseAdminChildren;
  }, [hasRole, t, ready]); // Added t and ready

  // 定义 testChildren
  const testChildren = useMemo(() => [
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
  ], []);

  const organizationMenuItem = useMemo(() => ({
    key: '/admin/organization',
    label: <span>{t('menu:organization.title', { defaultValue: 'Organization' })}</span>,
    icon: <ApartmentOutlined />,
    children: [
      { key: '/admin/organization/departments', label: <Link to="/admin/organization/departments">{t('menu:organization.departments')}</Link>, icon: <BranchesOutlined /> },
      { key: '/admin/organization/personnel-categories', label: <Link to="/admin/organization/personnel-categories">{t('menu:organization.personnelCategories')}</Link>, icon: <IdcardOutlined /> },
      { key: '/admin/organization/positions', label: <Link to="/admin/organization/positions">{t('menu:organization.positions')}</Link>, icon: <UserSwitchOutlined /> },
    ],
  }), [t, ready]);

  // 添加员工权限hook
  const { canCreate: canCreateEmployee } = useEmployeePermissions();

  const hrManagementChildren = useMemo(() => {
    const children = [
      {
        key: '/hr/employees',
        label: <Link to="/hr/employees">{t('menu:hr.employees')}</Link>, 
        icon: <TeamOutlined />, 
      },
      {
        label: <Link to="/hr/employees/new">{t('menu:hr.employeesNew')}</Link>, // Ensure key matches path used in routes.tsx for creation
        key: '/hr/employees/new', // Corrected from /hr/employees/create if routes.tsx uses /new
        icon: <UserAddOutlined />,
      },
    ];

    // Conditionally add Bulk Import if user has permission
    if (canCreateEmployee) { 
      children.push({
        label: <Link to="/hr/employees/bulk-import" id="tour-bulk-import-link">{t('menu:hr.employeesBulkImport')}</Link>,
        key: '/hr/employees/bulk-import',
        icon: <UploadOutlined />, // Using UploadOutlined as an example
      });
    }
    
    // Potentially add other HR related sub-menu items here, e.g., Leave Management
    // Example for Leave Management, if it's to be a sub-menu of HR and not top-level:
    if (hasPermission('leave:manage')) { // Or appropriate permission for leave management visibility
      children.push({
        key: '/hr/leave', 
        label: <Link to="/hr/leave">{t('menu:hr.myLeave')}</Link>, // Assuming this links to manager's leave approvals or a shared translation
        icon: <CalendarOutlined />,
      });
    }

    return children;
  }, [t, ready, hasPermission, canCreateEmployee]); // Added hasPermission and canCreateEmployee to dependency array

  const hrManagementMenuItem = useMemo(() => ({
    key: '/hr',
    label: <span>{t('menu:hr.title', { defaultValue: 'HR Management' })}</span>,
    icon: <UsergroupAddOutlined />,
    children: hrManagementChildren,
  }), [hrManagementChildren, t, ready]);

  const siderMenuItems = useMemo(() => {
    
    // ========== 核心业务模块 ==========
    const coreBusinessItems = [];
    
    // 1. 仪表盘 - 最重要的入口
    coreBusinessItems.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard" id="tour-dashboard-link">{t('menu:dashboard', { defaultValue: 'Dashboard' })}</Link>,
    });

    // 2. 个人中心 - 个人功能
    coreBusinessItems.push({
      key: '/personal',
      icon: <SolutionOutlined />,
      label: <span>{t('menu:personal.title', { defaultValue: 'Personal Center' })}</span>,
      children: [
        {
          key: '/employee-info/my-info',
          label: <Link to="/employee-info/my-info">{t('menu:personal.myInfo', { defaultValue: 'My Information' })}</Link>,
          icon: <UserOutlined />,
        },
        {
          key: '/employee-info/my-payslips',
          label: <Link to="/employee-info/my-payslips">{t('menu:personal.myPayslips', { defaultValue: 'My Payslips' })}</Link>,
          icon: <ProfileOutlined />,
        },
        {
          key: '/personal/leave',
          label: <Link to="/personal/leave">{t('menu:personal.myLeave', { defaultValue: 'My Leave' })}</Link>,
          icon: <CalendarOutlined />,
        },
      ],
    });

    // 3. 视图报表 - 独立的报表管理功能
    if (hasPermission('report:view_reports')) {
      coreBusinessItems.push({
        key: '/view-reports',
        label: <span>{t('menu:viewReports.title', { defaultValue: 'View Reports' })}</span>,
        icon: <EyeOutlined />,
        children: [
          {
            key: '/view-reports/management',
            label: <Link to="/view-reports/management">{t('menu:viewReports.management', { defaultValue: 'Report Management' })}</Link>,
            icon: <EyeOutlined />,
          },
        ],
      });
    }

    // 4. 薪资管理 - 核心业务功能
    const currentPayrollManagementChildren = [];
    if (hasPermission(P_PAYROLL_PERIOD_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/periods',
        label: <Link to="/finance/payroll/periods">{t('menu:payroll.periods', { defaultValue: 'Payroll Periods' })}</Link>,
        icon: <CalendarOutlined />,
      });
    }
    if (hasPermission(P_PAYROLL_RUN_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/runs',
        label: <Link to="/finance/payroll/runs">{t('menu:payroll.runs', { defaultValue: 'Payroll Runs' })}</Link>,
        icon: <CalculatorOutlined />,
      });
    }
    if (hasPermission(P_PAYROLL_ENTRY_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/entry',
        label: <Link to="/finance/payroll/entry">{t('menu:payroll.entry', { defaultValue: 'Payroll Entry' })}</Link>,
        icon: <EditOutlined />,
      });
    }
    if (hasPermission(P_PAYROLL_ENTRY_BULK_IMPORT)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/bulk-import',
        label: <Link to="/finance/payroll/bulk-import">{t('menu:payroll.bulkImport', { defaultValue: 'Payroll Bulk Import' })}</Link>,
        icon: <UploadOutlined />,
      });
    }
    if (hasPermission(P_PAYROLL_COMPONENT_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/components',
        label: <Link to="/finance/payroll/components">{t('menu:payroll.components', { defaultValue: 'Payroll Components' })}</Link>,
        icon: <ProfileOutlined />,
      });
    }
    
    const currentPayrollManagementMenuItem = currentPayrollManagementChildren.length > 0 ? {
      key: '/finance/payroll',
      label: <span>{t('menu:payroll.title', { defaultValue: 'Payroll Management' })}</span>,
      icon: <DollarCircleOutlined />,
      children: currentPayrollManagementChildren,
    } : null;

    if (currentPayrollManagementMenuItem) {
      coreBusinessItems.push(currentPayrollManagementMenuItem);
    }

    // 5. 员工管理 - 核心业务功能
    coreBusinessItems.push(hrManagementMenuItem);

    // ========== 管理功能模块 ==========
    const managementItems = [];

    // 6. 组织架构 - 保持独立
    managementItems.push(organizationMenuItem);

    // 7. 经理视图 - 管理功能
    const managerChildren = [];
    if (hasPermission(P_MANAGER_SUBORDINATES_VIEW)) {
      managerChildren.push({
        key: '/manager/subordinates',
        label: <Link to="/manager/subordinates">{t('menu:manager.subordinates', { defaultValue: 'Subordinates' })}</Link>,
        icon: <TeamOutlined />,
      });
    }
    if (hasPermission(P_MANAGER_LEAVE_APPROVALS_VIEW)) {
      managerChildren.push({
        key: '/manager/leave-approvals',
        label: <Link to="/manager/leave-approvals">{t('menu:manager.leaveApprovals', { defaultValue: 'Leave Approvals' })}</Link>,
        icon: <CalendarOutlined />,
      });
    }

    const managerMenuItem = managerChildren.length > 0 ? {
      key: '/manager',
      label: <span>{t('menu:manager.title', { defaultValue: 'Manager View' })}</span>,
      icon: <UserSwitchOutlined />,
      children: managerChildren,
    } : null;

    if (managerMenuItem) {
      managementItems.push(managerMenuItem);
    }

    // ========== 系统配置模块 ==========
    const systemConfigItems = [];

    // 8. 系统管理 - 拥有admin权限才显示
    const adminMenuItem = {
      key: '/admin',
      label: <span>{t('menu:admin.title', { defaultValue: 'System Management' })}</span>,
      icon: <SettingOutlined />,
      children: adminChildren,
    };
    if (hasRole('admin') || hasRole('SUPER_ADMIN')) {
      systemConfigItems.push(adminMenuItem);
    }

    // 9. 测试页面 - 仅开发模式下显示
    if (import.meta.env.DEV) {
      systemConfigItems.push({
        key: '/test',
        label: <span>{t('menu:test.title', { defaultValue: 'Test Page' })}</span>,
        icon: <CalculatorOutlined />,
        children: testChildren,
      });
    }

    // ========== 构建最终菜单 ==========
    // 按照业务重要性和逻辑关系排序：
    // 1. 核心业务模块：仪表盘、个人中心、视图报表、薪资管理、员工管理
    // 2. 管理功能模块：组织架构、经理视图
    // 3. 系统配置模块：系统管理和测试页面
    const finalItems = [
      ...coreBusinessItems,      // 核心业务优先
      ...managementItems,        // 管理功能其次
      ...systemConfigItems,      // 系统配置最后
    ];

    return finalItems;
  }, [hasPermission, userPermissions, userRoleCodes, adminChildren, hrManagementMenuItem, organizationMenuItem, t, ready, testChildren, i18n.language]); // Added i18n.language
  
  // 获取当前选中的菜单项key
  const selectedKeys = useMemo(() => {
    const currentPath = location.pathname;
    let selectedKey = '';
    // 优先完全匹配或子路径匹配
    for (const item of siderMenuItems) {
      if (!item || !('key' in item)) continue; // Skip null or invalid items
      if (item.key === currentPath) {
        selectedKey = item.key as string;
        break;
      }
      // Check if children exists and is an array before iterating
      if ('children' in item && item.children && Array.isArray(item.children)) {
        for (const child of item.children) {
          if (!child || !('key' in child)) continue; // Skip null or invalid child items
          if (child.key === currentPath) {
            selectedKey = child.key as string;
            break;
          }
        }
      }
      if (selectedKey) break;
    }
    if (!selectedKey) {
      const matchedParent = siderMenuItems.find(item => 
        item && item.key && typeof item.key === 'string' && currentPath.startsWith(item.key)
      );
      if (matchedParent && matchedParent.key) {
        selectedKey = matchedParent.key as string;
      }
    }
    return selectedKey ? [selectedKey] : ['/dashboard'];
  }, [location.pathname, siderMenuItems]);

  // 获取当前需要展开的父菜单项key - 修改为默认展开所有有子菜单的项
  const defaultOpenKeys = useMemo(() => {
    // 获取所有有子菜单的菜单项的key，让它们默认展开
    const openKeys: string[] = [];
    siderMenuItems.forEach(item => {
      if (item && 'key' in item && 'children' in item && item.children && Array.isArray(item.children) && item.children.length > 0) {
        openKeys.push(item.key as string);
      }
    });
    return openKeys;
  }, [siderMenuItems]);

  // 初始化openKeys状态，让所有有子菜单的菜单项默认展开
  useEffect(() => {
    if (defaultOpenKeys.length > 0 && openKeys.length === 0) {
      setOpenKeys(defaultOpenKeys);
    }
  }, [defaultOpenKeys, openKeys.length]);

  return (
    <Layout className="min-height-full-viewport">
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} theme="light">
        <div className="sider-header-style">
          {collapsed ? t('common:sider.title.collapsed'): t('common:sider.title.full')}
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['/dashboard']}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={siderMenuItems}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="main-header-style">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="main-layout-collapsed-button-style"
          />
          <Space className="header-space-style">
            <LanguageSwitcher />
            <Text className="margin-left-8">{currentUser?.username || t('user_menu:default_user_text')}</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar className="cursor-pointer" icon={<UserOutlined />} /* src={currentUser?.avatar_url} // 假设有头像 */ />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={breadcrumbItems} />
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
            <React.Suspense fallback={<div className="page-loading-suspense">{t('common:loading_page_content')}</div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px' }}>
          <span style={{ marginRight: '8px' }}>
            {t('common:footer.copyright_text')} ©{new Date().getFullYear()}
          </span>
          <img src={hyperchainLogoPath} alt={t('common:footer.hyperchain_logo_alt_text')} style={{ height: '20px', marginRight: '4px', verticalAlign: 'middle' }} />
          <span style={{ verticalAlign: 'middle' }}>
          </span>
        </Footer>
      </Layout>
      {/* Render the Tour component */}
      <Tour open={openTour} onClose={handleCloseTour} steps={steps} />
    </Layout>
  );
};

export default MainLayout; 