import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // 导入认证 store
import type { Role } from '../api/types'; // 导入 Role 类型
import MainLayout from '../layouts/MainLayout'; // 新增导入
import { Spin } from 'antd'; // 导入 Spin 组件用于加载指示

interface ProtectedRouteProps {
  allowedRoles?: Role['code'][] | string[]; // 允许的角色代码列表，例如 ['admin', 'hr_manager']
  // children?: React.ReactNode; // children prop is not directly used when MainLayout is the primary child
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const authToken = useAuthStore((state) => state.authToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoadingUser = useAuthStore((state) => state.isLoadingUser);
  const location = useLocation();

  const isAuthenticated = !!authToken;

  if (isLoadingUser && !currentUser) {
    // 如果正在加载用户信息（通常在 token 存在但用户信息尚未获取时）
    // 显示一个全局加载指示器
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载用户信息中..." fullscreen />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 用户未认证 (没有 token)，重定向到登录页
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 用户已认证 (有 token)，但可能仍在等待 currentUser 数据首次加载完成，或者已经加载了
  // 如果 currentUser 仍然为 null 但 isLoadingUser 为 false，表示获取用户信息失败或用户不存在
  // 这种情况可能也应该重定向或显示错误，但暂时先依赖下面的角色检查
  // 如果 !currentUser && !isLoadingUser 且有 authToken，这可能是个问题状态

  if (allowedRoles && allowedRoles.length > 0) {
    if (!currentUser) {
      // 如果需要角色检查，但用户信息（包含角色）尚未加载或加载失败，
      // 这可能表示一个不一致的状态或正在等待用户数据。避免直接判为无权限。
      // 如果 isLoadingUser 已经是 false，则表示获取用户信息失败或用户无角色。
      // 这种情况下，视为无权限可能是合理的，或者显示特定错误页面。
      // 为简单起见，如果用户已认证但无法获取用户信息（包含角色），暂时视为无权限。
      // 更复杂的处理可能需要检查 fetchUserError 状态。
      console.warn('ProtectedRoute: User is authenticated but currentUser data is not available for role check.');
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    const userRoles = currentUser.roles?.map(role => role.code).filter(Boolean) as string[] || [];
    const hasRequiredRole = allowedRoles.some(roleCode => userRoles.includes(roleCode!));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // 用户已认证，（如果需要）具有所需角色，并且用户信息已加载或不需要角色检查
  return <MainLayout />;
};

export default ProtectedRoute; 