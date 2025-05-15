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
  SafetyOutlined,
  UserSwitchOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  IdcardOutlined,
  ControlOutlined,
  UsergroupAddOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
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
  '/admin/organization': '组织架构',
  '/admin/organization/departments': '部门管理',
  '/admin/organization/job-titles': '职位管理',
  '/admin/permissions': '权限管理',
  '/hr': '人事管理',
  '/hr/employees': '员工档案',
  // ...更多路径
};


const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const logoutAction = useAuthStore((state) => state.logoutAction);
  const authToken = useAuthStore((state) => state.authToken);
  const { hasPermission, hasRole } = usePermissions();

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
      label: <Link to="/employee-info/my-info">个人中心</Link>, // Corrected from /employee/my-info based on routes.tsx
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

  // Dynamically build admin children based on permissions
  const organizationChildren = [
    { key: '/admin/organization/departments', label: <Link to="/admin/organization/departments">部门管理</Link>, icon: <BranchesOutlined /> },
    { key: '/admin/organization/job-titles', label: <Link to="/admin/organization/job-titles">职位管理</Link>, icon: <IdcardOutlined /> },
  ];

  // Define initial admin children, order matters for display. Organization is now a top-level item.
  const adminChildren = [
    { key: '/admin/users', label: <Link to="/admin/users">用户管理</Link>, icon: <TeamOutlined /> },
    { key: '/admin/roles', label: <Link to="/admin/roles">角色管理</Link>, icon: <UserSwitchOutlined /> },
    // Permissions will be inserted after roles if user is SUPER_ADMIN
    // Organization item removed from here
    { key: '/admin/config', label: <Link to="/admin/config">系统配置</Link>, icon: <ControlOutlined /> },
  ];

  // Conditionally add 'Permissions Management' for SUPER_ADMIN
  // This ensures it's placed correctly, e.g., after 'Roles'
  if (hasRole('SUPER_ADMIN')) {
    const permissionsLink = {
      key: '/admin/permissions',
      label: <Link to="/admin/permissions">权限管理</Link>,
      icon: <SafetyOutlined />,
    };
    const rolesIndex = adminChildren.findIndex(child => child.key === '/admin/roles');
    if (rolesIndex !== -1) {
      adminChildren.splice(rolesIndex + 1, 0, permissionsLink);
    } else {
      // Fallback if roles are not found (e.g. if adminChildren is empty or roles link is removed for some reason)
      // Insert before config, or push to end. Let's push to end for simplicity as this is a fallback.
      adminChildren.push(permissionsLink);
    }
  }

  // Define the new top-level organization menu item
  const organizationMenuItem = {
    key: '/admin/organization', // Parent key for the menu group
    label: '组织架构',
    icon: <ApartmentOutlined />,
    children: organizationChildren,
  };

  // HR Management Menu Item
  const hrManagementChildren = [
    {
        key: '/hr/employees',
        label: <Link to="/hr/employees">员工档案</Link>,
        icon: <TeamOutlined />, // Using existing TeamOutlined for consistency or specific icon
    },
    {
      label: <Link to="/hr/employees/create">创建员工</Link>,
      key: '/hr/employees/create', 
      path: '/hr/employees/create', // Restored path attribute
      icon: <UserAddOutlined />,
    },
    // Future HR sub-modules like leave, payroll (if they become sub-items of HR top menu)
    // { key: '/hr/leave', label: <Link to="/hr/leave">假勤管理</Link>, icon: <CalendarOutlined /> },
  ];

  const hrManagementMenuItem = {
    key: '/hr',
    label: '人事管理',
    icon: <UsergroupAddOutlined />,
    children: hrManagementChildren,
    // Add permission check if HR menu itself should be conditional
    // visible: hasPermission('hr_module:access') || hasRole(['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN'])
  };

  // 侧边栏菜单项
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
      children: adminChildren, // adminChildren no longer contains Organization
    },
    organizationMenuItem, // Add Organization as a top-level menu item
    hrManagementMenuItem, // Added HR Management Menu
    // ...其他模块 (if any)
  ];
  
  // 获取当前选中的菜单项key
  const getSelectedKeys = () => {
    const currentPath = location.pathname;
    let selectedKey = '';
    // 优先完全匹配或子路径匹配
    for (const item of siderMenuItems) {
      if (item.key === currentPath) {
        selectedKey = item.key as string; // Assuming key is string
        break;
      }
      // Check if children exists and is an array, and that item itself is an object
      if (typeof item === 'object' && item !== null && 'children' in item && item.children && Array.isArray(item.children)) {
        for (const child of item.children) {
          // Ensure child is an object with a key property
          if (child && typeof child === 'object' && 'key' in child && child.key === currentPath) {
            selectedKey = child.key as string; // Assuming key is string
            // 如果需要父菜单也高亮，可以考虑返回 item.key 或 child.key 的数组
            break;
          }
        }
      }
      if (selectedKey) break;
    }
    // 如果没有完全匹配的子菜单，尝试匹配父菜单
    if (!selectedKey) {
        // Ensure item is an object with a key property for find
        const matchedParent = siderMenuItems.find(item => 
            item && typeof item === 'object' && 'key' in item && item.key && 
            typeof item.key === 'string' && currentPath.startsWith(item.key)
        );
        if (matchedParent && typeof matchedParent === 'object' && 'key' in matchedParent && matchedParent.key) {
            selectedKey = matchedParent.key as string; // Assuming key is string
        }
    }
    return selectedKey ? [selectedKey] : ['/dashboard']; // 默认
  };

  // 获取当前需要展开的父菜单项key
  const getDefaultOpenKeys = () => {
    const currentPath = location.pathname;
    const openKeyItem = siderMenuItems.find(item => {
      // Ensure item is an object with children array
      if (typeof item === 'object' && item !== null && 'children' in item && item.children && Array.isArray(item.children)) {
        // Ensure child is an object with a key property
        return item.children.some(child => 
            child && typeof child === 'object' && 'key' in child && child.key === currentPath
        );
      }
      return false;
    });
    // Ensure openKeyItem is an object with a key property
    return (openKeyItem && typeof openKeyItem === 'object' && 'key' in openKeyItem && openKeyItem.key) ? [openKeyItem.key as string] : []; // Assuming key is string
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
            <React.Suspense fallback={<div className="page-loading-suspense">Loading page content...</div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Salary Management System ©{new Date().getFullYear()} Created by AI Assistant</Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 