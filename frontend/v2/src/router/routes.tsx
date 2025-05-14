import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AppProtectedRoute from './ProtectedRoute'; // 新导入的受保护路由组件

// 导入页面组件
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/Dashboard';
import UserListPage from '../pages/Admin/Users';
import RoleListPage from '../pages/Admin/Roles';
import ConfigPage from '../pages/Admin/Config';
import EmployeeListPage from '../pages/Employees';
import LeavePage from '../pages/Leave';
import PayrollPage from '../pages/Payroll';
import SubordinatesPage from '../pages/Manager/Subordinates';
import LeaveApprovalsPage from '../pages/Manager/LeaveApprovals';
import MyLeavePage from '../pages/Employee/MyLeave';
import MyPayslipsPage from '../pages/Employee/MyPayslips';
import MyInfoPage from '../pages/Employee/MyInfo';
import NotFoundPage from '../pages/NotFoundPage'; // 假设有一个404页面
import UnauthorizedPage from '../pages/UnauthorizedPage'; // 我们将创建这个页面

// 定义路由接口 - React Router v6 RouteObject 兼容
// RouteObject 本身就包含 element, path, children, index
// 我们将 meta 附加到自定义的 RouteConfig 上
export interface AppRouteObject {
  path?: string;
  element?: React.ReactNode;
  index?: boolean;
  children?: AppRouteObject[];
  caseSensitive?: boolean;
  meta?: {
    // requiresAuth is implicit if wrapped in AppProtectedRoute
    requiredRoles?: string[];
    title?: string;
    // breadcrumb?: string; // 可选的面包屑名称
  };
}

// 基础布局/包装器，可以在这里添加通用的 Layout 组件
const RootLayout = () => {
  // 这里可以放置如 AdminLayout 等全局布局组件的逻辑
  // 如果AppProtectedRoute自身就是布局，或者布局在更上层（如App.tsx），则此组件可能不需要
  // 或者它就是 AdminLayout/MainLayout 的一个简单包装，传递 Outlet
  return <Outlet />; // 对于顶层路由，通常渲染 Outlet
};


// 重构后的路由配置
const routes: AppRouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
    meta: {
      title: '登录',
    },
  },
  {
    path: '/unauthorized', // 我们将创建这个页面
    element: <UnauthorizedPage />,
    meta: {
      title: '无权限',
    },
  },
  {
    path: '/',
    element: <AppProtectedRoute />, // 所有根路径下的内容都需要认证
    // errorElement: <RootErrorPage />, // 可选的错误边界
    children: [
      // 默认重定向，也可以是 Dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <DashboardPage />, // DashboardPage 应该在 AppProtectedRoute 的 Outlet 中渲染
        meta: { title: '仪表盘' },
      },
      {
        path: 'admin',
        element: <AppProtectedRoute allowedRoles={['admin']} />, // 额外保护 admin 路径
        meta: { title: '系统管理', requiredRoles: ['admin'] },
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <UserListPage />, meta: { title: '用户管理' } },
          { path: 'roles', element: <RoleListPage />, meta: { title: '角色管理' } },
          { path: 'config', element: <ConfigPage />, meta: { title: '系统配置' } },
        ],
      },
      {
        path: 'hr',
        element: <AppProtectedRoute allowedRoles={['admin', 'hr']} />,
        meta: { title: '人事管理', requiredRoles: ['admin', 'hr'] },
        children: [
          { index: true, element: <Navigate to="employees" replace /> },
          { path: 'employees', element: <EmployeeListPage />, meta: { title: '员工管理' } },
          { path: 'leave', element: <LeavePage />, meta: { title: '假期管理' } },
        ],
      },
      {
        path: 'finance',
        element: <AppProtectedRoute allowedRoles={['admin', 'finance']} />,
        meta: { title: '财务管理', requiredRoles: ['admin', 'finance'] },
        children: [
          { index: true, element: <Navigate to="payroll" replace /> },
          { path: 'payroll', element: <PayrollPage />, meta: { title: '工资计算与发放' } },
        ],
      },
      {
        path: 'manager',
        element: <AppProtectedRoute allowedRoles={['admin', 'manager']} />,
        meta: { title: '部门主管', requiredRoles: ['admin', 'manager'] },
        children: [
          { index: true, element: <Navigate to="subordinates" replace /> },
          { path: 'subordinates', element: <SubordinatesPage />, meta: { title: '下属信息查看' } },
          { path: 'leave-approvals', element: <LeaveApprovalsPage />, meta: { title: '假期申请审批' } },
        ],
      },
      {
        path: 'employee', //员工自助，通常所有员工角色都有权限
        element: <AppProtectedRoute allowedRoles={['employee', 'admin']} />, // 假设 'employee' 角色， admin 也应该能看
        meta: { title: '员工自助', requiredRoles: ['employee', 'admin'] },
        children: [
          { index: true, element: <Navigate to="my-info" replace /> },
          { path: 'my-info', element: <MyInfoPage />, meta: { title: '我的信息' } },
          { path: 'my-leave', element: <MyLeavePage />, meta: { title: '我的假期' } },
          { path: 'my-payslips', element: <MyPayslipsPage />, meta: { title: '我的工资单' } },
        ],
      },
      // 可以在这里添加一个受保护的 404 页面，如果用户已登录但访问了无效路径
      // { path: '*'", element: <Navigate to="/dashboard" replace /> } // 或者重定向到仪表盘
    ],
  },
  // 顶层 Catch-all / 404 路由 - 如果用户未登录或访问不存在的顶层路径
  {
    path: '*',
    element: <NotFoundPage />,
    meta: { title: '页面未找到' },
  },
];

export default routes;