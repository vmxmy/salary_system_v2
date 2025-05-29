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
      // 列表查看权限 - 使用新的现代权限格式
      canViewList: hasAnyPermission([
        'employee:view_list',
        'employee:view',
        'hr:employee_view',
        'EMPLOYEE_LIST_VIEW'
      ]),

      // 详情查看权限
      canViewDetail: hasAnyPermission([
        'employee:view_detail',
        'employee:view',
        'hr:employee_detail',
        'EMPLOYEE_DETAIL_VIEW'
      ]),

      // 创建权限
      canCreate: hasAnyPermission([
        'employee:create',
        'hr:employee_create',
        'employee:add',
        'EMPLOYEE_CREATE'
      ]),

      // 更新权限
      canUpdate: hasAnyPermission([
        'employee:update',
        'employee:edit',
        'hr:employee_update',
        'hr:employee_edit',
        'EMPLOYEE_UPDATE',
        'EMPLOYEE_EDIT'
      ]),

      // 删除权限
      canDelete: hasAnyPermission([
        'employee:delete',
        'hr:employee_delete',
        'EMPLOYEE_DELETE'
      ]),

      // 导出权限
      canExport: hasAnyPermission([
        'employee:export',
        'hr:employee_export',
        'employee:download',
        'EMPLOYEE_EXPORT'
      ]),

      // 批量导入权限
      canBulkImport: hasAnyPermission([
        'employee:bulk_import',
        'employee:import',
        'hr:employee_import',
        'EMPLOYEE_IMPORT'
      ]),

      // 模块访问权限
      canViewModule: hasAnyPermission([
        'employee:module_view',
        'hr:module_view',
        'employee:access',
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