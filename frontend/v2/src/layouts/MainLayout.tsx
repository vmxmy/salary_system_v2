import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Breadcrumb, Button, Tour, type TourProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
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

// Layout components
import { Box, FlexLayout } from '../components/Layout';
import { zIndex } from '../styles/z-index';
import { designTokens } from '../styles/design-tokens';

// Import payroll permissions
import { P_PAYROLL_PERIOD_VIEW, P_PAYROLL_RUN_VIEW, P_PAYROLL_ENTRY_VIEW, P_PAYROLL_ENTRY_BULK_IMPORT, P_PAYROLL_COMPONENT_VIEW } from '../pages/Payroll/constants/payrollPermissions';
// Import Manager permissions
import { P_MANAGER_SUBORDINATES_VIEW, P_MANAGER_LEAVE_APPROVALS_VIEW } from '../pages/Manager/routes';

const { Header, Content, Sider, Footer } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const { t, i18n, ready } = useTranslation(['common', 'menu']);

  const [collapsed, setCollapsed] = useState(true); // 侧边栏默认收起
  const [openKeys, setOpenKeys] = useState<string[]>([]); // 添加openKeys状态
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const authToken = useSelector((state: RootState) => state.auth.authToken);
  const userPermissions = useSelector((state: RootState) => state.auth.userPermissions);
  const userRoleCodes = useSelector((state: RootState) => state.auth.userRoleCodes);
  const { hasPermission, hasRole } = usePermissions();

  // Refs for Tour targets - Dashboard removed
  const refBulkImport = useRef(null);
  const refAiRobot = useRef(null);

  // State for Tour visibility - disabled after dashboard removal
  const [openTour, setOpenTour] = useState<boolean>(false);

  // Tour steps - simplified after dashboard removal  
  const steps: TourProps['steps'] = [
    {
      title: t('tour:bulk_import.title'),
      description: t('tour:bulk_import.description'),
      target: () => refBulkImport.current,
      nextButtonProps: { children: t('tour:common.next') },
      prevButtonProps: { children: t('tour:common.previous') },
    },
    {
      title: t('tour:ai_robot.title'),
      description: t('tour:ai_robot.description'),
      target: () => refAiRobot.current,
      nextButtonProps: { children: t('tour:common.finish') }, // Last step
      prevButtonProps: { children: t('tour:common.previous') },
    },
  ];
  
  useEffect(() => {
    // Tour disabled after dashboard removal
    const tourSeen = localStorage.getItem('mainTourSeenV2');
    if (tourSeen !== 'true') {
      // Tour functionality simplified - no automatic opening for now
      setOpenTour(false);
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
            return rPath === uPath;
        });
        const name = route?.handle?.breadcrumbName?.(i18n.t) || route?.handle?.title || snippet;
        if (!route) {
          return null;
        }
        return {
          key: url,
          title: index === pathSnippets.length - 1 ? name : <Link to={url}>{name}</Link>,
        };
      })
      .filter(Boolean);
  }, [pathSnippets, i18n]);

  const breadcrumbItems = [
    {
      key: 'home',
      title: (
        <Link to="/">
          <HomeOutlined />
        </Link>
      ),
    },
    ...(extraBreadcrumbItems as any),
  ];

  // 使用 hasPermission 判断菜单项是否应该显示 - 添加新的权限判断
  const { permissions: employeePermissions } = useEmployeePermissions();

  const siderMenuItems = useMemo(() => {
    const items = [];

    // 简洁工资单
    items.push({
      key: 'simple-payroll',
      icon: <DollarCircleOutlined />,
      label: <Link to="/simple-payroll">{t('menu:simple_payroll')}</Link>,
    });

    // 人力资源管理菜单
    const hrChildren = [];
    if (employeePermissions.canViewEmployees) {
      hrChildren.push({
        key: 'hr-employees',
        icon: <TeamOutlined />,
        label: <Link to="/hr/employees">{t('menu:employees')}</Link>,
      });
    }

    if (hrChildren.length > 0) {
      items.push({
        key: 'hr',
        icon: <TeamOutlined />,
        label: t('menu:hr_management'),
        children: hrChildren,
      });
    }

    // 工资管理菜单
    const payrollChildren = [];
    if (hasPermission(P_PAYROLL_PERIOD_VIEW)) {
      payrollChildren.push({
        key: 'payroll-periods',
        icon: <CalendarOutlined />,
        label: <Link to="/payroll/periods">{t('menu:payroll_periods')}</Link>,
      });
    }
    if (hasPermission(P_PAYROLL_RUN_VIEW)) {
      payrollChildren.push({
        key: 'payroll-runs',
        icon: <CalculatorOutlined />,
        label: <Link to="/payroll/runs">{t('menu:payroll_runs')}</Link>,
      });
    }
    if (hasPermission(P_PAYROLL_ENTRY_VIEW)) {
      payrollChildren.push({
        key: 'payroll-entries',
        icon: <SolutionOutlined />,
        label: <Link to="/payroll/entries">{t('menu:payroll_entries')}</Link>,
      });
    }
    if (hasPermission(P_PAYROLL_ENTRY_BULK_IMPORT)) {
      payrollChildren.push({
        key: 'payroll-bulk-import',
        icon: <UploadOutlined />,
        label: <Link to="/payroll/bulk-import">{t('menu:payroll_bulk_import')}</Link>,
      });
    }
    if (hasPermission(P_PAYROLL_COMPONENT_VIEW)) {
      payrollChildren.push({
        key: 'payroll-calculation-config',
        icon: <ControlOutlined />,
        label: <Link to="/payroll/calculation-config">{t('menu:payroll_calculation_config')}</Link>,
      });
    }

    if (payrollChildren.length > 0) {
      items.push({
        key: 'payroll',
        icon: <DollarCircleOutlined />,
        label: t('menu:payroll_management'),
        children: payrollChildren,
      });
    }

    // Manager菜单
    const managerChildren = [];
    if (hasPermission(P_MANAGER_SUBORDINATES_VIEW)) {
      managerChildren.push({
        key: 'manager-subordinates',
        icon: <TeamOutlined />,
        label: <Link to="/manager/subordinates">{t('menu:subordinates')}</Link>,
      });
    }
    if (hasPermission(P_MANAGER_LEAVE_APPROVALS_VIEW)) {
      managerChildren.push({
        key: 'manager-leave-approvals',
        icon: <ProfileOutlined />,
        label: <Link to="/manager/leave-approvals">{t('menu:leave_approvals')}</Link>,
      });
    }

    if (managerChildren.length > 0) {
      items.push({
        key: 'manager',
        icon: <UserSwitchOutlined />,
        label: t('menu:manager'),
        children: managerChildren,
      });
    }

    // 系统管理菜单
    const adminChildren = [];
    if (hasRole('ADMIN')) {
      adminChildren.push({
        key: 'admin-users',
        icon: <UserOutlined />,
        label: <Link to="/admin/users">{t('menu:users')}</Link>,
      });
      adminChildren.push({
        key: 'admin-roles',
        icon: <SafetyOutlined />,
        label: <Link to="/admin/roles">{t('menu:roles')}</Link>,
      });
      adminChildren.push({
        key: 'admin-permissions',
        icon: <SafetyOutlined />,
        label: <Link to="/admin/permissions">{t('menu:permissions')}</Link>,
      });
      adminChildren.push({
        key: 'admin-config',
        icon: <SettingOutlined />,
        label: <Link to="/admin/config">{t('menu:configuration')}</Link>,
      });
    }

    // 组织架构子菜单
    const orgChildren = [];
    if (hasRole('ADMIN') || hasRole('HR_MANAGER')) {
      orgChildren.push({
        key: 'admin-organization-departments',
        icon: <ApartmentOutlined />,
        label: <Link to="/admin/organization/departments">{t('menu:departments')}</Link>,
      });
      orgChildren.push({
        key: 'admin-organization-actual-positions',
        icon: <BranchesOutlined />,
        label: <Link to="/admin/organization/actual-positions">{t('menu:actual_positions')}</Link>,
      });
      orgChildren.push({
        key: 'admin-organization-job-position-levels',
        icon: <IdcardOutlined />,
        label: <Link to="/admin/organization/job-position-levels">{t('menu:job_position_levels')}</Link>,
      });
      orgChildren.push({
        key: 'admin-organization-personnel-categories',
        icon: <UsergroupAddOutlined />,
        label: <Link to="/admin/organization/personnel-categories">{t('menu:personnel_categories')}</Link>,
      });
    }

    if (orgChildren.length > 0) {
      adminChildren.push({
        key: 'admin-organization',
        icon: <ApartmentOutlined />,
        label: t('menu:organization_structure'),
        children: orgChildren,
      });
    }

    if (adminChildren.length > 0) {
      items.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: t('menu:system_management'),
        children: adminChildren,
      });
    }

    return items;
  }, [hasPermission, hasRole, employeePermissions, t]);

  // 根据路由设置选中的菜单项
  const selectedKeys = useMemo(() => {
    // 优先查找当前完整路径
    const fullPathKey = siderMenuItems.find(item => {
      if (item.label && 'props' in item.label && item.label.props.to === location.pathname) {
        return true;
      }
      return item.children?.some((child: any) => 
        child.label && 'props' in child.label && child.label.props.to === location.pathname
      );
    });

    if (fullPathKey) {
      return [fullPathKey.key];
    }

    // 如果没有找到完整路径，尝试匹配路径前缀
    const pathParts = location.pathname.split('/').filter(Boolean);
    const possibleKeys = pathParts.map((_, index) => 
      pathParts.slice(0, index + 1).join('-')
    );

    for (const key of possibleKeys.reverse()) {
      if (siderMenuItems.some(item => item.key === key || 
        item.children?.some((child: any) => child.key === key))) {
        return [key];
      }
    }

    return ['/simple-payroll'];
  }, [location.pathname, siderMenuItems]);

  // 计算默认展开的菜单项
  const defaultOpenKeys = useMemo(() => {
    const keys: string[] = [];
    siderMenuItems.forEach(item => {
      if (item.children && item.children.some((child: any) => 
        selectedKeys.includes(child.key))) {
        keys.push(item.key);
      }
    });
    return keys;
  }, [selectedKeys, siderMenuItems]);

  // 确保在菜单项变化时更新展开状态
  useEffect(() => {
    if (openKeys.length === 0 && defaultOpenKeys.length > 0) {
      setOpenKeys(defaultOpenKeys);
    }
  }, [defaultOpenKeys, openKeys.length]);

  return (
    <Layout className="min-height-full-viewport">
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)} 
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: zIndex.sidebar
        }}
      >
        <Box p="4" className="sider-header-style">
          {collapsed ? t('common:sider.title.collapsed'): t('common:sider.title.full')}
        </Box>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['/simple-payroll']}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={siderMenuItems}
        />
      </Sider>
      <Layout 
        className="site-layout" 
        style={{ 
          marginLeft: collapsed ? 80 : 200,
          transition: 'margin-left 0.2s'
        }}
      >
        <Header 
          className="main-header-style"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: zIndex.stickyHeader,
            background: designTokens.colors.background.primary,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: designTokens.shadows.sm
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="main-layout-collapsed-button-style"
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <FlexLayout 
            gap="4" 
            align="center"
            px="6"
          >
            <LanguageSwitcher />
            <Text className="margin-left-8">{currentUser?.username || t('user_menu:default_user_text')}</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar className="cursor-pointer" icon={<UserOutlined />} />
            </Dropdown>
          </FlexLayout>
        </Header>
        <Content>
          <Box px="4" py="4">
            <Breadcrumb items={breadcrumbItems} />
          </Box>
          <Box px="4" pb="4">
            <Box
              p="6"
              bg="primary"
              borderRadius="lg"
              shadow="base"
              minHeight="360px"
            >
              <React.Suspense fallback={
                <FlexLayout justify="center" align="center" style={{ minHeight: '200px' }}>
                  {t('common:loading_page_content')}
                </FlexLayout>
              }>
                <Outlet />
              </React.Suspense>
            </Box>
          </Box>
        </Content>
        <Footer style={{ textAlign: 'center', padding: `${designTokens.spacing[4]} ${designTokens.spacing[6]}` }}>
          <FlexLayout justify="center" align="center" gap="2">
            <span>
              {t('common:footer.copyright_text')} ©{new Date().getFullYear()}
            </span>
            <img 
              src={hyperchainLogoPath} 
              alt={t('common:footer.hyperchain_logo_alt_text')} 
              style={{ height: '20px', verticalAlign: 'middle' }} 
            />
          </FlexLayout>
        </Footer>
      </Layout>
      {/* Render the Tour component */}
      <Tour open={openTour} onClose={handleCloseTour} steps={steps} />
    </Layout>
  );
};

export default MainLayout;