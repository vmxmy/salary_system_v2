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
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { allAppRoutes, type AppRouteObject } from '../router/routes'; // Import allAppRoutes and AppRouteObject type
import LanguageSwitcher from '../components/common/LanguageSwitcher'; // Import LanguageSwitcher
import { useTranslation } from 'react-i18next'; // Import useTranslation
import hyperchainLogoPath from '../assets/images/hyperchainLogo.svg'; // Standard image import

// Import payroll permissions
import { P_PAYROLL_PERIOD_VIEW, P_PAYROLL_RUN_VIEW, P_PAYROLL_ENTRY_VIEW, P_PAYROLL_ENTRY_BULK_IMPORT, P_PAYROLL_COMPONENT_VIEW } from '../pages/Payroll/constants/payrollPermissions';
// Import Manager permissions
import { P_MANAGER_SUBORDINATES_VIEW, P_MANAGER_LEAVE_APPROVALS_VIEW } from '../pages/Manager/routes';

const { Header, Content, Sider, Footer } = Layout;
const { Text } = Typography;

// 简单的面包屑名称映射，后续可以从路由 meta 中获取 - THIS WILL BE DEPRECATED by new logic
// const breadcrumbNameMap: Record<string, string> = {
//   '/dashboard': '仪表盘',
//   '/admin': '系统管理',
//   '/admin/users': '用户管理',
//   '/admin/roles': '角色管理',
//   '/admin/config': '系统配置',
//   '/admin/organization': '组织架构',
//   '/admin/organization/departments': '部门管理',
//   '/admin/organization/job-titles': '职位管理',
//   '/admin/permissions': '权限管理',
//   '/hr': '人事管理',
//   '/hr/employees': '员工档案',
//   // ...更多路径
// };


const MainLayout: React.FC = () => {
  const { t, i18n, ready } = useTranslation([
    'pageTitle', 
    'common', 
    'user_menu', 
    'tour', 
    'hr', 
    'employee',
    'admin',
    'auth',
    'dashboard',
    'department',
    'jobTitle',
    'manager',
    'myPayslips',
    'myInfo',
    'payroll',
    'permission',
    'role',
    'user',
    'personnelCategory'
  ]); // 确保包含所有可能需要的命名空间
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const logoutAction = useAuthStore((state) => state.logoutAction);
  const authToken = useAuthStore((state) => state.authToken);
  const { hasPermission, hasRole } = usePermissions();
  const userPermissions = useAuthStore((state) => state.userPermissions);
  const userRoleCodes = useAuthStore((state) => state.userRoleCodes); // For hasRole dependency

  // Refs for Tour targets
  const refDashboard = useRef(null);
  const refBulkImport = useRef(null);
  const refAiRobot = useRef(null);

  // State for Tour visibility
  const [openTour, setOpenTour] = useState<boolean>(false);

  // Tour steps
  const steps: TourProps['steps'] = [
    {
      title: t('tour:dashboard.title', '仪表盘概览'),
      description: t('tour:dashboard.description', '这里是系统的概览和快捷入口，您可以快速了解关键数据和导航至各功能模块。'),
      target: () => refDashboard.current,
      nextButtonProps: { children: t('tour:common.next', '下一步') },
      prevButtonProps: { children: t('tour:common.previous', '上一步') },
    },
    {
      title: t('tour:bulk_import.title', '批量导入员工'),
      description: t('tour:bulk_import.description', '若您需要一次性添加多名员工信息，可以使用此功能通过上传文件快速完成。'),
      target: () => refBulkImport.current,
      nextButtonProps: { children: t('tour:common.next', '下一步') },
      prevButtonProps: { children: t('tour:common.previous', '上一步') },
      // disabled: !refBulkImport.current, // Example: Disable step if target is not available (though ref is assigned in useEffect)
    },
    {
      title: t('tour:ai_robot.title', 'AI 助手'),
      description: t('tour:ai_robot.description', '有任何疑问或需要操作指引吗？随时点击右下角的 AI 助手图标，它会尽力帮助您。'),
      target: () => refAiRobot.current,
      nextButtonProps: { children: t('tour:common.finish', '完成') }, // Last step
      prevButtonProps: { children: t('tour:common.previous', '上一步') },
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
          console.warn("Tour: Dashboard link not found, tour will not start.");
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
    await logoutAction();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/employee-info/my-info">{ready ? t('user_menu:profile') : 'Profile'}</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: ready ? t('user_menu:logout') : 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // 生成面包屑
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const extraBreadcrumbItems = useMemo(() => {
    console.log('[MainLayout:Breadcrumb] ready state:', ready, 'for pathname:', location.pathname);
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
          translatedName = t(nameKey, { defaultValue: nameKey });
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
      title: <Link to="/dashboard"><HomeOutlined /></Link>,
    },
    ...extraBreadcrumbItems,
  ];

  // Set document title effect
  useEffect(() => {
    if (ready) {
      let currentTitleKey = 'sider.title.full'; // Default title key
      let titleNs = ['pageTitle', 'common', 'hr', 'user_menu', 'tour', 'auth', 'admin', 'payroll']; // Add all relevant namespaces

      const currentRoute = allAppRoutes.find(r => location.pathname === r.path || (r.path && location.pathname.startsWith(r.path + '/') && r.path !== '/'));
      
      if (currentRoute?.meta?.title) {
        currentTitleKey = currentRoute.meta.title;
      }
      
      // Heuristic to determine if the key already contains a namespace
      if (!currentTitleKey.includes(':')) {
         // If no namespace in key, and it's a common page title, prefix with 'pageTitle'
         // This might need adjustment based on how keys are structured.
         // For now, we assume keys like 'dashboard', 'user_management' are in 'pageTitle' ns.
         // Keys like 'hr:bulk_import.page_title' already have their ns.
        if (['dashboard', 'system_management', 'user_management', 'role_management', 'permission_management', 'system_configuration', 'organization_structure', 'department_management', 'job_title_management', 'hr_management', 'employee_list', 'create_employee', 'employee_details', 'edit_employee', 'leave_management', 'finance_management', 'payroll_calculation', 'manager_view', 'employee_hub', 'my_info', 'my_payslips', 'not_found', 'login', 'unauthorized', 'employee_center', 'periods', 'bulk_import_employees'].includes(currentTitleKey)) {
             currentTitleKey = `pageTitle:${currentTitleKey}`;
        }
      }
      
      const appBaseTitle = t('sider.title.full', { ns: 'pageTitle', defaultValue: "Salary System" });
      const dynamicTitle = t(currentTitleKey, { ns: titleNs, defaultValue: currentTitleKey.substring(currentTitleKey.indexOf(':') + 1) });

      if (dynamicTitle && dynamicTitle !== currentTitleKey.substring(currentTitleKey.indexOf(':') + 1)) { // check if translation was successful
        document.title = `${dynamicTitle} - ${appBaseTitle}`;
      } else if (currentRoute?.meta?.title) { // Fallback to key if translation fails but key exists
        document.title = `${currentRoute.meta.title} - ${appBaseTitle}`;
      } else {
        document.title = appBaseTitle;
      }
    }
  }, [location.pathname, t, ready, allAppRoutes]);

  // Dynamically build admin children based on permissions
  const organizationChildren = [
    // These labels come from route.meta.title via allAppRoutes, so they will be translated if link text is derived from it in Menu items.
    // Or, if Menu items are constructed with explicit labels, those labels need t()
    { key: '/admin/organization/departments', label: <Link to="/admin/organization/departments">{ready ? t('pageTitle:department_management') : 'Departments'}</Link>, icon: <BranchesOutlined /> },
    { key: '/admin/organization/job-titles', label: <Link to="/admin/organization/job-titles">{ready ? t('pageTitle:job_title_management') : 'Job Titles'}</Link>, icon: <IdcardOutlined /> },
  ];

  const adminChildren = useMemo(() => {
    console.log('[MainLayout:AdminMenu] ready state:', ready);
    const baseAdminChildren = [
      { key: '/admin/users', label: <Link to="/admin/users">{t('pageTitle:user_management')}</Link>, icon: <TeamOutlined /> },
      { key: '/admin/roles', label: <Link to="/admin/roles">{t('pageTitle:role_management')}</Link>, icon: <UserSwitchOutlined /> },
      { key: '/admin/config', label: <Link to="/admin/config">{t('pageTitle:system_configuration')}</Link>, icon: <ControlOutlined /> },
    ];
    if (hasRole('SUPER_ADMIN')) {
      const permissionsLink = {
        key: '/admin/permissions',
        label: <Link to="/admin/permissions">{t('pageTitle:permission_management')}</Link>,
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

  const organizationMenuItem = useMemo(() => ({
    key: '/admin/organization',
    label: t('pageTitle:organization_structure'),
    icon: <ApartmentOutlined />,
    children: organizationChildren, 
  }), [organizationChildren, t, ready]); // Added t and ready

  const hrManagementChildren = useMemo(() => {
    console.log('[MainLayout:HRMenu] ready state:', ready);
    const children = [
      {
        key: '/hr/employees',
        label: <Link to="/hr/employees">{t('pageTitle:employee_files')}</Link>, 
        icon: <TeamOutlined />, 
      },
      {
        label: <Link to="/hr/employees/new">{t('pageTitle:create_employee')}</Link>, // Ensure key matches path used in routes.tsx for creation
        key: '/hr/employees/new', // Corrected from /hr/employees/create if routes.tsx uses /new
        icon: <UserAddOutlined />,
      },
    ];

    // Conditionally add Bulk Import if user has permission
    // Assuming P_EMPLOYEE_CREATE is the correct permission for bulk import as well
    if (hasPermission('P_EMPLOYEE_CREATE')) { 
      children.push({
        label: <Link to="/hr/employees/bulk-import" id="tour-bulk-import-link">{t('pageTitle:bulk_import_employees')}</Link>,
        key: '/hr/employees/bulk-import',
        icon: <UploadOutlined />, // Using UploadOutlined as an example
      });
    }
    
    // Potentially add other HR related sub-menu items here, e.g., Leave Management
    // Example for Leave Management, if it's to be a sub-menu of HR and not top-level:
    if (hasPermission('leave:manage')) { // Or appropriate permission for leave management visibility
      children.push({
        key: '/hr/leave', 
        label: <Link to="/hr/leave">{t('pageTitle:leave_management')}</Link>,
        icon: <CalendarOutlined />,
      });
    }

    return children;
  }, [t, ready, hasPermission]); // Added hasPermission to dependency array

  const hrManagementMenuItem = useMemo(() => ({
    key: '/hr',
    label: ready ? (t('pageTitle:hr_management')) : '人力资源管理',
    icon: <UsergroupAddOutlined />,
    children: hrManagementChildren,
  }), [hrManagementChildren, t, ready]);

  const siderMenuItems = useMemo(() => {
    console.log('[MainLayout:SiderMenu] Building menu, ready state:', ready);
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/dashboard" id="tour-dashboard-link">{t('pageTitle:dashboard')}</Link>,
      },
      {
        key: '/admin',
        icon: <SettingOutlined />,
        label: t('pageTitle:system_management'),
        children: adminChildren,
      },
      organizationMenuItem,
      hrManagementMenuItem,
      {
        key: '/employee-info',
        icon: <SolutionOutlined />,
        label: t('pageTitle:employee_center'),
        children: [
          {
            key: '/employee-info/my-info',
            label: <Link to="/employee-info/my-info">{t('pageTitle:my_info')}</Link>,
            icon: <UserOutlined />,
          },
          {
            key: '/employee-info/my-payslips',
            label: <Link to="/employee-info/my-payslips">{t('pageTitle:my_payslips')}</Link>,
            icon: <ProfileOutlined />,
          },
        ],
      },
    ];

    // 在构建薪资管理菜单项的部分添加薪资字段管理
    const currentPayrollManagementChildren = [];
    if (hasPermission(P_PAYROLL_PERIOD_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/periods',
        label: <Link to="/finance/payroll/periods">{t('pageTitle:payroll_periods')}</Link>,
        icon: <CalendarOutlined />,
      });
    }
    if (hasPermission(P_PAYROLL_RUN_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/runs',
        label: <Link to="/finance/payroll/runs">{t('pageTitle:payroll_runs')}</Link>,
        icon: <CalculatorOutlined />,
      });
    }
    // Add payroll entry menu item
    if (hasPermission(P_PAYROLL_ENTRY_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/entry',
        label: <Link to="/finance/payroll/entry">{t('pageTitle:payroll_entry')}</Link>,
        icon: <EditOutlined />,
      });
    }
    
    // Add payroll bulk import menu item
    if (hasPermission(P_PAYROLL_ENTRY_BULK_IMPORT)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/bulk-import',
        label: <Link to="/finance/payroll/bulk-import">{t('payroll:page_title.payroll_bulk_import')}</Link>,
        icon: <UploadOutlined />,
      });
    }
    
    // Add payroll components management menu item
    if (hasPermission(P_PAYROLL_COMPONENT_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/components',
        label: <Link to="/finance/payroll/components">{t('payroll:page_title.payroll_components')}</Link>,
        icon: <ProfileOutlined />,
      });
    }
    
    const currentPayrollManagementMenuItem = currentPayrollManagementChildren.length > 0 ? {
      key: '/finance/payroll',
      label: t('pageTitle:payroll_management'), // Top level menu item for payroll
      icon: <DollarCircleOutlined />,
      children: currentPayrollManagementChildren,
    } : null;

    // 创建经理模块的菜单项
    const managerChildren = [];

    // 添加下属管理菜单项
    if (hasPermission(P_MANAGER_SUBORDINATES_VIEW)) {
      managerChildren.push({
        key: '/manager/subordinates',
        label: <Link to="/manager/subordinates">{t('pageTitle:subordinates')}</Link>,
        icon: <TeamOutlined />,
      });
    }

    // 添加请假审批菜单项
    if (hasPermission(P_MANAGER_LEAVE_APPROVALS_VIEW)) {
      managerChildren.push({
        key: '/manager/leave-approvals',
        label: <Link to="/manager/leave-approvals">{t('pageTitle:leave_approvals')}</Link>,
        icon: <CalendarOutlined />,
      });
    }

    // 如果有子菜单项，则返回经理视图菜单项
    const managerMenuItem = managerChildren.length > 0 ? {
      key: '/manager',
      label: t('pageTitle:manager_view'),
      icon: <UserSwitchOutlined />,
      children: managerChildren,
    } : null;

    // 构建最终菜单项
    const finalItems = [...baseItems];
    
    if (currentPayrollManagementMenuItem) {
      finalItems.push(currentPayrollManagementMenuItem);
    }
    
    if (managerMenuItem) {
      finalItems.push(managerMenuItem);
    }
    
    return finalItems;
  }, [hasPermission, userPermissions, userRoleCodes, adminChildren, organizationMenuItem, hrManagementMenuItem, t, ready]); // Added t and ready
  
  // 获取当前选中的菜单项key
  const selectedKeys = useMemo(() => {
    const currentPath = location.pathname;
    let selectedKey = '';
    // 优先完全匹配或子路径匹配
    for (const item of siderMenuItems) {
      if (!item) continue; // Skip null items (like payrollManagementMenuItem if it's null)
      if (item.key === currentPath) {
        selectedKey = item.key as string;
        break;
      }
      // Check if children exists and is an array before iterating
      if ('children' in item && item.children && Array.isArray(item.children)) {
        for (const child of item.children) {
          if (child && child.key === currentPath) {
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

  // 获取当前需要展开的父菜单项key
  const defaultOpenKeys = useMemo(() => {
    const currentPath = location.pathname;
    const openKeyItem = siderMenuItems.find(item => {
      if (!item) return false; // Skip null items
      // Check if children exists and is an array before trying to access .some
      return 'children' in item && item.children && Array.isArray(item.children) && item.children.some(child => child && child.key === currentPath);
    });
    return (openKeyItem && openKeyItem.key) ? [openKeyItem.key as string] : [];
  }, [location.pathname, siderMenuItems]);


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} theme="light">
        <div style={{ height: '32px', margin: '16px', background: 'rgba(0, 0, 0, 0.05)', textAlign: 'center', lineHeight: '32px', color: '#454552', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {collapsed ? t('common:sider.title.collapsed') : t('common:sider.title.full')}
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['/dashboard']}
          selectedKeys={selectedKeys}
          defaultOpenKeys={defaultOpenKeys}
          items={siderMenuItems}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space style={{ padding: '0 8px', borderRadius: '4px', border: '1px solid rgba(5, 5, 5, 0.06)' }}>
            <LanguageSwitcher />
            <Text style={{ marginLeft: '8px' }}>{currentUser?.username || t('user_menu:default_user_text', '用户')}</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar style={{ cursor: 'pointer' }} icon={<UserOutlined />} /* src={currentUser?.avatar_url} // 假设有头像 */ />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={breadcrumbItems} />
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
            <React.Suspense fallback={<div className="page-loading-suspense">{t('common:loading.generic_loading_text', 'Loading page content...')}</div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px' }}>
          <span style={{ marginRight: '8px' }}>
            {t('common:footer.copyright', '成都高新区财政国资局 人事工资信息管理系统')} ©{new Date().getFullYear()}
          </span>
          <img src={hyperchainLogoPath} alt={t('common:footer.hyperchain_logo_alt', '趣链科技 Logo')} style={{ height: '20px', marginRight: '4px', verticalAlign: 'middle' }} />
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