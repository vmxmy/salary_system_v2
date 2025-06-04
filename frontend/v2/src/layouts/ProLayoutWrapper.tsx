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
  Switch,
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
  SunOutlined,
  MoonOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store';
import { menuData, transformMenuDataWithI18n, getBreadcrumbNameMap } from '../config/menuConfig';
import { defaultProLayoutSettings, proLayoutExtendedSettings, getThemeConfig, type ThemeMode } from '../config/theme';
import type { AppMenuDataItem } from '../config/menuConfig';
import hyperchainLogo from '../assets/images/hyperchainLogo.svg';

const { useBreakpoint } = Grid;

// 🎯 组件属性类型定义
interface ProLayoutWrapperProps {
  children?: React.ReactNode;
}

// 🌐 右上角操作区域组件
const RightContent: React.FC<{
  isDark: boolean;
  onThemeChange: (checked: boolean) => void;
  currentUser: any;
  onLogout: () => void;
}> = ({ isDark, onThemeChange, currentUser, onLogout }) => {
  const { t, i18n } = useTranslation(['common', 'components']);
  const { message: messageApi } = App.useApp();

  // 🔄 切换语言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
    i18n.changeLanguage(newLang);
    messageApi.success(t('common:language_switched'));
  };

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
      {/* 🌓 主题切换 */}
      <Tooltip title={t('common:theme_toggle')}>
        <Switch
          checked={isDark}
          onChange={onThemeChange}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          size="small"
        />
      </Tooltip>

      {/* 🌐 语言切换 */}
      <Tooltip title={t('common:language_toggle')}>
        <Button
          type="text"
          icon={<GlobalOutlined />}
          onClick={toggleLanguage}
          size="small"
        >
          {i18n.language === 'zh-CN' ? '中' : 'EN'}
        </Button>
      </Tooltip>

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
    'personnelCategory',
    'menu'
  ]);
  const screens = useBreakpoint();
  const { message: messageApi } = App.useApp();
  
  // 🏪 状态管理
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  
  const [collapsed, setCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [layoutSettings, setLayoutSettings] = useState(defaultProLayoutSettings);
  const [logoError, setLogoError] = useState(false);

  // 📱 响应式侧边栏控制
  useEffect(() => {
    // 在小屏幕（md以下）自动收起侧边栏
    const shouldCollapse = !screens.md;
    setCollapsed(shouldCollapse);
  }, [screens]);

  // 🎨 主题切换处理
  const handleThemeChange = useCallback((checked: boolean) => {
    const newMode: ThemeMode = checked ? 'dark' : 'light';
    setThemeMode(newMode);
    
    // 更新 ProLayout 设置
    setLayoutSettings(prev => ({
      ...prev,
      navTheme: checked ? 'realDark' : 'light', // 根据主题切换明暗色
    }));
    
    messageApi.success(t(`common:theme_switched_to_${newMode}`));
  }, [t, messageApi]);

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
  const breadcrumbNameMap = getBreadcrumbNameMap(menuData, t);

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
    fixSiderbar: true,
    collapsed: collapsed, // 使用响应式的 collapsed 状态
    onCollapse: (value: boolean) => {
      setCollapsed(value);
    },
    siderWidth: 220, // 设置合适的侧边栏宽度
    collapsedWidth: 48, // 收起时的宽度
    breakpoint: 'md', // 在 md 断点以下自动收起
    // 通过menuProps设置默认展开的菜单项
    menuProps: {
      defaultOpenKeys: ['/business', '/system', '/business/payroll', '/business/hr', '/business/employees', '/system/permissions', '/system/organization', '/system/payroll-config', '/system/ai-config', '/personal', '/reports'],
    },
    menuDataRender: () => {
const transformedData = transformMenuDataWithI18n(menuData, (key: string) => t(key, { ns: 'menu' }));
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
    rightContentRender: () => (
      <RightContent
        isDark={themeMode === 'dark'}
        onThemeChange={handleThemeChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    ),
    headerTitleRender: (logo: React.ReactNode, title: React.ReactNode, props: any) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/dashboard')}
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