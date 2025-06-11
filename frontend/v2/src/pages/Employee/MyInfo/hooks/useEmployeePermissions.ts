/**
 * 员工权限钩子
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/authStore';

export interface EmployeePermissions {
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

/**
 * 获取员工权限的自定义钩子
 */
export const useEmployeePermissions = (): EmployeePermissions => {
  const { currentUser, hasPermission } = useAuthStore();

  const permissions = useMemo(() => {
    // 基本权限检查 - 用户必须已登录
    if (!currentUser) {
      return {
        canView: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
      };
    }

    // 对于个人信息页面，用户通常可以查看自己的信息
    const canView = true;
    
    // 编辑权限 - 检查是否有员工管理权限或者查看自己的信息
    const canUpdate = hasPermission?.('employee:update') || true; // 用户应该能编辑自己的信息
    
    // 删除权限 - 通常个人不能删除自己的账户
    const canDelete = hasPermission?.('employee:delete') || false;
    
    // 导出权限
    const canExport = hasPermission?.('employee:export') || false;

    return {
      canView,
      canUpdate,
      canDelete,
      canExport,
    };
  }, [currentUser, hasPermission]);

  return permissions;
}; 