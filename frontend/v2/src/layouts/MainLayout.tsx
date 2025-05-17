import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Breadcrumb, Button } from 'antd';
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
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { allAppRoutes, type AppRouteObject } from '../router/routes'; // Import allAppRoutes and AppRouteObject type
import LanguageSwitcher from '../components/common/LanguageSwitcher'; // Import LanguageSwitcher
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Import payroll permissions
import { P_PAYROLL_PERIOD_VIEW, P_PAYROLL_RUN_VIEW } from '../pages/Payroll/constants/payrollPermissions';

const { Header, Content, Sider, Footer } = Layout;
const { Text } = Typography;

// 简单的面包屑名称映射，后续可以从路由 meta 中获取 - THIS WILL BE DEPRECATED by new logic
const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/admin': '系统管理',
  '/admin/users': '用户管理',
  '/admin/roles': '角色管理',
  '/admin/config': '系统配置',
  '/admin/organization': '组织架构',
  '/admin/organization/departments': '部门管理',
  '/admin/organization/job-titles': '职位管理',
  '/admin/permissions': '权限管理',
  '/hr': '人事管理',
  '/hr/employees': '员工档案',
  // ...更多路径
};


const MainLayout: React.FC = () => {
  const { t } = useTranslation(); // Initialize t function
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const logoutAction = useAuthStore((state) => state.logoutAction);
  const authToken = useAuthStore((state) => state.authToken);
  const { hasPermission, hasRole } = usePermissions();
  const userPermissions = useAuthStore((state) => state.userPermissions);
  const userRoleCodes = useAuthStore((state) => state.userRoleCodes); // For hasRole dependency

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
      label: <Link to="/employee-info/my-info">{t('user_menu.profile')}</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: t('user_menu.logout'),
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
        // Find route from allAppRoutes (which now has keys in meta.title)
        const route = allAppRoutes.find((r) => {
            // Handle potential trailing slashes or exact matches
            const rPath = r.path?.endsWith('/') ? r.path.slice(0, -1) : r.path;
            const uPath = url.endsWith('/') ? url.slice(0, -1) : url;
            return rPath === uPath;
        });

        if (route?.meta?.hideInBreadcrumbIfParentOfNext && index < pathSnippets.length - 1) {
          return null;
        }

        const nameKey = route?.meta?.title || snippet; // nameKey is now a translation key or a snippet
        const translatedName = t(nameKey as string, snippet); // Provide snippet as fallback

        return {
          key: url,
          title: index === pathSnippets.length - 1 ? translatedName : <Link to={url}>{translatedName}</Link>,
        };
      })
      .filter(item => item !== null) as { key: string; title: React.ReactNode }[];
  }, [location.pathname, allAppRoutes, t]); // Added t to dependencies

  const breadcrumbItems: { key: string; title: React.ReactNode }[] = [
    {
      key: 'home',
      title: <Link to="/dashboard"><HomeOutlined /></Link>, // Home icon usually doesn't need translation itself, but if it had text...
    },
    ...extraBreadcrumbItems,
  ];

  // Dynamically build admin children based on permissions
  const organizationChildren = [
    // These labels come from route.meta.title via allAppRoutes, so they will be translated if link text is derived from it in Menu items.
    // Or, if Menu items are constructed with explicit labels, those labels need t()
    { key: '/admin/organization/departments', label: <Link to="/admin/organization/departments">{t('page_title.department_management')}</Link>, icon: <BranchesOutlined /> },
    { key: '/admin/organization/job-titles', label: <Link to="/admin/organization/job-titles">{t('page_title.job_title_management')}</Link>, icon: <IdcardOutlined /> },
  ];

  const adminChildren = useMemo(() => {
    const baseAdminChildren = [
      { key: '/admin/users', label: <Link to="/admin/users">{t('page_title.user_management')}</Link>, icon: <TeamOutlined /> },
      { key: '/admin/roles', label: <Link to="/admin/roles">{t('page_title.role_management')}</Link>, icon: <UserSwitchOutlined /> },
      { key: '/admin/config', label: <Link to="/admin/config">{t('page_title.system_configuration')}</Link>, icon: <ControlOutlined /> },
    ];
    if (hasRole('SUPER_ADMIN')) {
      const permissionsLink = {
        key: '/admin/permissions',
        label: <Link to="/admin/permissions">{t('page_title.permission_management')}</Link>,
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
  }, [hasRole, t]); // Added t

  const organizationMenuItem = useMemo(() => ({
    key: '/admin/organization',
    label: t('page_title.organization_structure'),
    icon: <ApartmentOutlined />,
    children: organizationChildren, 
  }), [organizationChildren, t]); // Added t

  const hrManagementChildren = useMemo(() => [
    {
        key: '/hr/employees',
        label: <Link to="/hr/employees">{t('page_title.employee_files')}</Link>, 
        icon: <TeamOutlined />, 
    },
    {
      label: <Link to="/hr/employees/create">{t('page_title.create_employee')}</Link>,
      key: '/hr/employees/create', 
      icon: <UserAddOutlined />,
    },
  ], [t]); // Added t

  const hrManagementMenuItem = useMemo(() => ({
    key: '/hr',
    label: t('page_title.hr_management'),
    icon: <UsergroupAddOutlined />,
    children: hrManagementChildren,
  }), [hrManagementChildren, t]); // Added t

  const siderMenuItems = useMemo(() => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/dashboard">{t('page_title.dashboard')}</Link>,
      },
      {
        key: '/admin',
        icon: <SettingOutlined />,
        label: t('page_title.system_management'),
        children: adminChildren,
      },
      organizationMenuItem,
      hrManagementMenuItem,
    ];

    const currentPayrollManagementChildren = [];
    if (hasPermission(P_PAYROLL_PERIOD_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/periods',
        label: <Link to="/finance/payroll/periods">{t('page_title.payroll_periods')}</Link>,
        icon: <CalendarOutlined />,
      });
    }
    if (hasPermission(P_PAYROLL_RUN_VIEW)) {
      currentPayrollManagementChildren.push({
        key: '/finance/payroll/runs',
        label: <Link to="/finance/payroll/runs">{t('page_title.payroll_runs')}</Link>,
        icon: <CalculatorOutlined />,
      });
    }

    const currentPayrollManagementMenuItem = currentPayrollManagementChildren.length > 0 ? {
      key: '/finance/payroll',
      label: t('page_title.payroll_management'), // Top level menu item for payroll
      icon: <DollarCircleOutlined />,
      children: currentPayrollManagementChildren,
    } : null;

    if (currentPayrollManagementMenuItem) {
      return [...baseItems, currentPayrollManagementMenuItem];
    }
    return baseItems;
  }, [hasPermission, userPermissions, userRoleCodes, adminChildren, organizationMenuItem, hrManagementMenuItem, t]); // Added t
  
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
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} theme="dark">
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {collapsed ? t('sider.title.collapsed') : t('sider.title.full')}
        </div>
        <Menu
          theme="dark"
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
          <Space>
            <LanguageSwitcher />
            <Text style={{ marginLeft: '8px' }}>{currentUser?.username || t('user_menu.default_user_text', '用户')}</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar style={{ cursor: 'pointer' }} icon={<UserOutlined />} /* src={currentUser?.avatar_url} // 假设有头像 */ />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={breadcrumbItems} />
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
            <React.Suspense fallback={<div className="page-loading-suspense">{t('common.loading', 'Loading page content...')}</div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          {t('footer.system_name')} ©{new Date().getFullYear()} {t('footer.created_by')}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 