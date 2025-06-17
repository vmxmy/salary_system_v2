import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  ProLayout,
  ProBreadcrumb,
  ErrorBoundary,
} from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import {
  Button,
  Dropdown,
  Avatar,
  Space,
  Tooltip,
  Grid,
  App,
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store';
import { menuData, generateMenuData, transformMenuDataWithI18n, getBreadcrumbNameMap } from '../config/menuConfig';
import { defaultProLayoutSettings, proLayoutExtendedSettings } from '../config/theme';
import type { AppMenuDataItem } from '../config/menuConfig';
import hyperchainLogo from '../assets/images/hyperchainLogo.svg';

const { useBreakpoint } = Grid;

// 🎯 组件属性类型定义
interface ProLayoutWrapperProps {
  children?: React.ReactNode;
}

// 🌐 右上角操作区域组件
const RightContent: React.FC<{
  currentUser: any;
  onLogout: () => void;
}> = ({ currentUser, onLogout }) => {
  const { t } = useTranslation(['common', 'components']);
  const { message: messageApi } = App.useApp();

  // 👤 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          {t('common:user_menu.profile')}
        </Space>
      ),
    },
    {
      key: 'settings',
      label: (
        <Space>
          <SettingOutlined />
          {t('common:user_menu.settings')}
        </Space>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          {t('common:user_menu.logout')}
        </Space>
      ),
      onClick: onLogout,
    },
  ];

  return (
    <Space size="middle">
      {/* 👤 用户信息 */}
      <Dropdown
        menu={{ items: userMenuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Space className="cursor-pointer">
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{currentUser?.username || 'Admin'}</span>
        </Space>
      </Dropdown>
    </Space>
  );
};

// 🏗️ ProLayout 包装组件
const ProLayoutWrapper: React.FC<ProLayoutWrapperProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation([
    'common',
    'user_menu',
    'tour',
    'hr',
    'employee',
    'admin',
    'auth',

    'department',
    'jobTitle',
    'manager',
    'payroll',
    'permission',
    'role',
    'user',
    'personnelCategory',
    'menu'
  ]);
  const screens = useBreakpoint();
  const { message: messageApi } = App.useApp();
  
  // 🏪 状态管理
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  
  const [collapsed, setCollapsed] = useState(true); // 默认收起侧边栏
  const [layoutSettings, setLayoutSettings] = useState(defaultProLayoutSettings);
  const [logoError, setLogoError] = useState(false);

  // 📱 响应式侧边栏控制
  useEffect(() => {
    // 在小屏幕（md以下）自动收起侧边栏，大屏幕也默认收起
    const shouldCollapse = !screens.md || true; // 始终保持收起状态
    setCollapsed(shouldCollapse);
  }, [screens]);



  // 🚪 登出处理
  const handleLogout = useCallback(async () => {
    try {
      dispatch(logout());
      navigate('/login', { replace: true });
      messageApi.success(t('common:auth.logout_success'));
    } catch (error) {
      messageApi.error(t('common:auth.logout_failed'));
    }
  }, [dispatch, navigate, t, messageApi]);

  // 🧭 菜单点击处理
  const handleMenuClick = useCallback((item: MenuDataItem) => {
    if (item.path && item.path !== location.pathname) {
      navigate(item.path);
    }
  }, [navigate, location.pathname]);

  // 📝 面包屑配置
  const currentMenuData = generateMenuData(import.meta.env.DEV);
  const breadcrumbNameMap = getBreadcrumbNameMap(currentMenuData, t);

  // 处理图片加载失败
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLogoError(true);
    e.currentTarget.style.display = 'none';
  };
  
  // 渲染Logo组件
  const renderLogo = () => {
    if (logoError) {
      return <BankOutlined className="icon-bank-logo" />;
    }
    return (
      <img
        src={hyperchainLogo}
        alt="Logo"
        className="logo-height-28"
        onError={handleLogoError}
      />
    );
  };

  // ⚙️ ProLayout 配置
  const proLayoutProps = {
    ...layoutSettings,
    location,
    // 响应式侧边栏配置
    layout: 'side',
    fixedHeader: true, // 固定头部，确保右上角内容正确显示
    fixSiderbar: true,
    collapsed: collapsed, // 使用响应式的 collapsed 状态
    onCollapse: (value: boolean) => {
      setCollapsed(value);
    },
    siderWidth: 220, // 设置合适的侧边栏宽度
    collapsedWidth: 48, // 收起时的宽度
    breakpoint: 'md', // 在 md 断点以下自动收起
    headerHeight: 64, // 设置头部高度
    // 通过menuProps设置默认展开的菜单项
    menuProps: {
      defaultOpenKeys: ['/business', '/system', '/business/payroll', '/business/hr', '/business/employees', '/system/permissions', '/system/organization', '/system/payroll-config', '/system/ai-config', '/personal', '/reports'],
    },
    menuDataRender: () => {
      // 使用动态菜单生成函数，支持开发模式
      const currentMenuData = generateMenuData(import.meta.env.DEV);
      const transformedData = transformMenuDataWithI18n(currentMenuData, (key: string) => t(key, { ns: 'menu' }));
      return transformedData;
    },
    menuItemRender: (item: MenuDataItem, dom: React.ReactNode) => (
      <div 
        onClick={() => handleMenuClick(item)}
        className="flex-align-center-padding-horizontal-8"
      >
        {dom}
      </div>
    ),
    breadcrumbRender: (routers: any[] = []) => [
      {
        path: '/',
        breadcrumbName: t('menu:home'),
      },
      ...routers,
    ],
    itemRender: (route: any) => route.breadcrumbName,
    actionsRender: () => [
      <RightContent
        key="user-info"
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    ],
    headerTitleRender: (logo: React.ReactNode, title: React.ReactNode, props: any) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/simple-payroll')}
      >
        {renderLogo()}
        {!props?.collapsed && (
          <span className="header-title-text">
            人事薪资管理系统
          </span>
        )}
      </div>
    ),
    collapsedButtonRender: () => (
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        className="collapsed-button-style"
        title={collapsed ?      t('common:expand_sidebar'): t('common:collapse_sidebar')}
      />
    ),
    footerRender: () => (
      <div className="footer-style">
        <Space split="|">
          <span>成都高新区财政国资局 人事工资信息管理系统 ©2025</span>
          {!logoError ? (
            <img
              src={hyperchainLogo}
              alt={t('common:hyperchain_logo')}
              style={{ height: 16 }}
              onError={handleLogoError}
            />
          ) : (
            <BankOutlined className="icon-bank-logo-small" />
          )}
        </Space>
      </div>
    ),
    contentStyle: {
      margin: 0,
      minHeight: 'calc(100vh - 64px - 48px)', // 减去头部和脚部高度
      paddingTop: 0, // 确保内容区域不会被固定头部遮挡
    },
    logo: renderLogo(),
  } as any;

  return (
    <div style={{ height: '100vh' }}>
      <ProLayout 
        {...proLayoutProps}
      >
        <ErrorBoundary>
          {/* 📄 页面内容 */}
          <div>
            {children || <Outlet />}
          </div>
        </ErrorBoundary>
      </ProLayout>
    </div>
  );
};

export default ProLayoutWrapper; 