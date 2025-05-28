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
  message,
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
import { useAuthStore } from '../store/authStore';
import { menuData, transformMenuData, getBreadcrumbNameMap } from '../config/menuConfig';
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
  const { t, i18n } = useTranslation();

  // 🔄 切换语言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
    i18n.changeLanguage(newLang);
    message.success(t('common.language_switched'));
  };

  // 👤 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          {t('user_menu.profile')}
        </Space>
      ),
    },
    {
      key: 'settings',
      label: (
        <Space>
          <SettingOutlined />
          {t('user_menu.settings')}
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
          {t('user_menu.logout')}
        </Space>
      ),
      onClick: onLogout,
    },
  ];

  return (
    <Space size="middle">
      {/* 🌓 主题切换 */}
      <Tooltip title={t('common.theme_toggle')}>
        <Switch
          checked={isDark}
          onChange={onThemeChange}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          size="small"
        />
      </Tooltip>

      {/* 🌐 语言切换 */}
      <Tooltip title={t('common.language_toggle')}>
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
        <Space style={{ cursor: 'pointer' }}>
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
  const { t } = useTranslation();
  const screens = useBreakpoint();
  
  // 🏪 状态管理
  const { currentUser, logoutAction } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [layoutSettings, setLayoutSettings] = useState(defaultProLayoutSettings);
  const [logoError, setLogoError] = useState(false);

  // 📱 响应式侧边栏控制
  useEffect(() => {
    // 在小屏幕（md以下）自动收起侧边栏
    const shouldCollapse = !screens.md;
    console.log('Screen breakpoints:', screens, 'Should collapse:', shouldCollapse);
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
    
    message.success(t(`common.theme_switched_to_${newMode}`));
  }, [t]);

  // 🚪 登出处理
  const handleLogout = useCallback(async () => {
    try {
      await logoutAction();
      navigate('/login', { replace: true });
      message.success(t('auth.logout_success'));
    } catch (error) {
      message.error(t('auth.logout_failed'));
    }
  }, [logoutAction, navigate, t]);

  // 🧭 菜单点击处理
  const handleMenuClick = useCallback((item: MenuDataItem) => {
    if (item.path && item.path !== location.pathname) {
      navigate(item.path);
    }
  }, [navigate, location.pathname]);

  // 📝 面包屑配置
  const breadcrumbNameMap = getBreadcrumbNameMap(menuData);

  // 处理图片加载失败
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Logo加载失败，使用文本替代');
    setLogoError(true);
    e.currentTarget.style.display = 'none';
  };
  
  // 渲染Logo组件
  const renderLogo = () => {
    if (logoError) {
      return <BankOutlined style={{ fontSize: 28, color: '#1890ff' }} />;
    }
    return (
      <img
        src={hyperchainLogo}
        alt="Logo"
        style={{ height: 28 }}
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
      console.log('ProLayout onCollapse called with:', value);
      setCollapsed(value);
    },
    siderWidth: 220, // 设置合适的侧边栏宽度
    collapsedWidth: 48, // 收起时的宽度
    breakpoint: 'md', // 在 md 断点以下自动收起
    // 通过menuProps设置默认展开的菜单项
    menuProps: {
      defaultOpenKeys: ['/hr', '/payroll', '/manager', '/admin', '/organization', '/test', '/personal'],
    },
    menuDataRender: () => {
      console.log('Rendering menu data:', menuData);
      const transformedData = transformMenuData(menuData);
      console.log('Transformed menu data:', transformedData);
      return transformedData;
    },
    menuItemRender: (item: MenuDataItem, dom: React.ReactNode) => (
      <div 
        onClick={() => handleMenuClick(item)}
        style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}
      >
        {dom}
      </div>
    ),
    breadcrumbRender: (routers: any[] = []) => [
      {
        path: '/',
        breadcrumbName: t('pageTitle.home'),
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
          <span style={{ fontWeight: 600, fontSize: 16, marginLeft: 8 }}>
            高新区财政人事薪资管理系统
          </span>
        )}
      </div>
    ),
    collapsedButtonRender: () => (
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: '16px',
          width: 32,
          height: 32,
        }}
        title={collapsed ? t('common.expand_sidebar') : t('common.collapse_sidebar')}
      />
    ),
    footerRender: () => (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <Space split="|">
          <span>成都高新区财政国资局 人事工资信息管理系统 ©2025</span>
          {!logoError ? (
            <img
              src={hyperchainLogo}
              alt="趣链科技 Logo"
              style={{ height: 16 }}
              onError={handleLogoError}
            />
          ) : (
            <BankOutlined style={{ fontSize: 16, color: '#1890ff' }} />
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