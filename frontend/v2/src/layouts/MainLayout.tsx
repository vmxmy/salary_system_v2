import React, { useState, useEffect } from 'react';
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
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
// import routes from '../router/routes'; // 用于动态菜单和面包屑，后续实现
// import { AppRouteObject } from '../router/routes'; // 类型导入

const { Header, Content, Sider, Footer } = Layout;
const { Text } = Typography;

// 简单的面包屑名称映射，后续可以从路由 meta 中获取
const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/admin': '系统管理',
  '/admin/users': '用户管理',
  '/admin/roles': '角色管理',
  '/admin/config': '系统配置',
  // ...更多路径
};


const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const logoutAction = useAuthStore((state) => state.logoutAction);
  const authToken = useAuthStore((state) => state.authToken);

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
      label: <Link to="/employee/my-info">个人中心</Link>, // 假设有此路由
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // 生成面包屑
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const extraBreadcrumbItems: { key: string; title: React.ReactNode }[] = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const name = breadcrumbNameMap[url] || pathSnippets[index];
    return {
      key: url,
      title: index === pathSnippets.length - 1 ? name : <Link to={url}>{name}</Link>,
    };
  });

  const breadcrumbItems: { key: string; title: React.ReactNode }[] = [
    {
      key: 'home',
      title: <Link to="/dashboard"><HomeOutlined /></Link>,
    },
    ...extraBreadcrumbItems,
  ];

  // 侧边栏菜单项 (静态示例，后续可改为动态生成)
  // TODO: 根据用户角色动态生成菜单
  const siderMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">仪表盘</Link>,
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: '/admin/users', label: <Link to="/admin/users">用户管理</Link>, icon: <TeamOutlined /> },
        { key: '/admin/roles', label: <Link to="/admin/roles">角色管理</Link> },
      ],
    },
    // ...其他模块
  ];
  
  // 获取当前选中的菜单项key
  const getSelectedKeys = () => {
    const currentPath = location.pathname;
    let selectedKey = '';
    // 优先完全匹配或子路径匹配
    for (const item of siderMenuItems) {
      if (item.key === currentPath) {
        selectedKey = item.key;
        break;
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.key === currentPath) {
            selectedKey = child.key;
            // 如果需要父菜单也高亮，可以考虑返回 item.key 或 child.key 的数组
            break;
          }
        }
      }
      if (selectedKey) break;
    }
    // 如果没有完全匹配的子菜单，尝试匹配父菜单
    if (!selectedKey) {
        const matchedParent = siderMenuItems.find(item => item.key && currentPath.startsWith(item.key));
        if (matchedParent && matchedParent.key) {
            selectedKey = matchedParent.key;
        }
    }
    return selectedKey ? [selectedKey] : ['/dashboard']; // 默认
  };

  // 获取当前需要展开的父菜单项key
  const getDefaultOpenKeys = () => {
    const currentPath = location.pathname;
    const openKey = siderMenuItems.find(item => item.children?.some(child => child.key === currentPath));
    return openKey?.key ? [openKey.key] : [];
  };


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} theme="dark">
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {collapsed ? '薪' : '薪酬管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/dashboard']}
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getDefaultOpenKeys()} // 自动展开当前选中子菜单的父菜单
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
            <Text>{currentUser?.username || '用户'}</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar style={{ cursor: 'pointer' }} icon={<UserOutlined />} /* src={currentUser?.avatar_url} // 假设有头像 */ />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={breadcrumbItems} />
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Salary Management System ©{new Date().getFullYear()} Created by AI Assistant</Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 