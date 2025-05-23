import { usePermissions } from './usePermissions';
import { useMemo } from 'react';

/**
 * 员工功能权限映射钩子
 * 基于用户实际拥有的权限动态判断各种员工功能的可用性
 */
export const useEmployeePermissions = () => {
  const { userPermissions, hasPermission, hasAnyPermission } = usePermissions();

  // 动态生成员工功能权限映射
  const employeePermissions = useMemo(() => {
    if (!userPermissions) {
      return {
        canViewList: false,
        canViewDetail: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
        canBulkImport: false,
        canViewModule: false,
      };
    }

    return {
      // 列表查看权限 - 检查多种可能的权限名称
      canViewList: hasAnyPermission([
        'P_EMPLOYEE_VIEW_LIST',
        'P_HR_EMPLOYEE_VIEW',
        'P_EMPLOYEE_VIEW',
        'EMPLOYEE_LIST_VIEW'
      ]),

      // 详情查看权限
      canViewDetail: hasAnyPermission([
        'P_EMPLOYEE_VIEW_DETAIL',
        'P_EMPLOYEE_VIEW',
        'P_HR_EMPLOYEE_DETAIL',
        'EMPLOYEE_DETAIL_VIEW'
      ]),

      // 创建权限
      canCreate: hasAnyPermission([
        'P_EMPLOYEE_CREATE',
        'P_HR_EMPLOYEE_CREATE',
        'P_EMPLOYEE_ADD',
        'EMPLOYEE_CREATE'
      ]),

      // 更新权限
      canUpdate: hasAnyPermission([
        'P_EMPLOYEE_UPDATE',
        'P_EMPLOYEE_EDIT',
        'P_HR_EMPLOYEE_UPDATE',
        'P_HR_EMPLOYEE_EDIT',
        'EMPLOYEE_UPDATE',
        'EMPLOYEE_EDIT'
      ]),

      // 删除权限
      canDelete: hasAnyPermission([
        'P_EMPLOYEE_DELETE',
        'P_HR_EMPLOYEE_DELETE',
        'EMPLOYEE_DELETE'
      ]),

      // 导出权限
      canExport: hasAnyPermission([
        'P_EMPLOYEE_EXPORT',
        'P_HR_EMPLOYEE_EXPORT',
        'P_EMPLOYEE_DOWNLOAD',
        'EMPLOYEE_EXPORT'
      ]),

      // 批量导入权限
      canBulkImport: hasAnyPermission([
        'P_EMPLOYEE_BULK_IMPORT',
        'P_EMPLOYEE_IMPORT',
        'P_HR_EMPLOYEE_IMPORT',
        'EMPLOYEE_IMPORT'
      ]),

      // 模块访问权限
      canViewModule: hasAnyPermission([
        'P_EMPLOYEE_MODULE_VIEW',
        'P_HR_MODULE_VIEW',
        'P_EMPLOYEE_ACCESS',
        'HR_MODULE_ACCESS'
      ]),
    };
  }, [userPermissions, hasAnyPermission]);

  return {
    ...employeePermissions,
    // 提供原始权限检查方法，用于特殊情况
    hasPermission,
    hasAnyPermission,
    userPermissions,
  };
}; 