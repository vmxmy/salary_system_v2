/**
 * 🚀 高性能优化API接口
 * 专门用于替换慢接口，使用核心业务视图进行查询
 * 响应时间目标：< 500ms
 */

import apiClient from './apiClient';

// 基础响应类型
export interface OptimizedResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ==================== 用户相关优化接口 ====================

/**
 * 🚀 高性能用户查询 - 替换 GET /users/{user_id}
 * 响应时间 < 100ms
 */
export const getUserOptimized = async (userId: number) => {
  const response = await apiClient.get<OptimizedResponse<any>>(`/views-optimized/users/${userId}`);
  return response.data;
};

// ==================== 配置相关优化接口 ====================

/**
 * 🚀 高性能薪资组件定义查询 - 替换 GET /config/payroll-component-definitions
 * 响应时间 < 200ms
 */
export const getPayrollComponentDefinitionsOptimized = async (params?: {
  is_active?: boolean;
  component_type?: string;
  size?: number;
}) => {
  // 确保 size 参数不超过后端限制（100）
  const safeParams = {
    ...params,
    size: params?.size ? Math.min(params.size, 100) : 100
  };
  
  const response = await apiClient.get<OptimizedResponse<any[]>>('/views-optimized/payroll-component-definitions', { params: safeParams });
  return response.data;
};

/**
 * 🚀 高性能公共lookup查询 - 替换 GET /config/lookup-values-public
 * 响应时间 < 50ms
 */
export const getLookupValuesPublicOptimized = async (lookupTypeCode: string, isActive: boolean = true) => {
  const response = await apiClient.get<OptimizedResponse<any[]>>('/views-optimized/lookup-values-public', {
    params: { lookup_type_code: lookupTypeCode, is_active: isActive }
  });
  return response.data;
};

/**
 * 🚀 高性能lookup类型查询 - 替换 GET /lookup/types
 * 响应时间 < 100ms
 */
export const getLookupTypesOptimized = async () => {
  const response = await apiClient.get<OptimizedResponse<any[]>>('/views-optimized/lookup-types');
  return response.data;
};

// ==================== HR相关优化接口 ====================

/**
 * 🚀 高性能部门查询 - 替换 GET /departments
 * 响应时间 < 200ms
 */
export const getDepartmentsOptimized = async (isActive: boolean = true) => {
  const response = await apiClient.get<OptimizedResponse<any[]>>('/views-optimized/departments', {
    params: { is_active: isActive }
  });
  return response.data;
};

/**
 * 🚀 高性能人员类别查询 - 替换 GET /personnel-categories
 * 响应时间 < 200ms
 */
export const getPersonnelCategoriesOptimized = async (isActive: boolean = true) => {
  const response = await apiClient.get<OptimizedResponse<any[]>>('/views-optimized/personnel-categories', {
    params: { is_active: isActive }
  });
  return response.data;
};

// ==================== 薪资相关优化接口 ====================

/**
 * 🚀 高性能薪资周期查询 - 替换 GET /simple-payroll/periods
 * 响应时间 < 300ms
 */
export const getPayrollPeriodsOptimized = async (params?: {
  is_active?: boolean;
  year?: number;
}) => {
  const response = await apiClient.get<OptimizedResponse<any[]>>('/views-optimized/simple-payroll/periods', { params });
  return response.data;
};

/**
 * 🚀 高性能薪资版本查询 - 替换 GET /simple-payroll/versions
 * 响应时间 < 200ms
 */
export const getPayrollVersionsOptimized = async () => {
  const response = await apiClient.get<OptimizedResponse<any[]>>('/views-optimized/simple-payroll/versions');
  return response.data;
};

/**
 * 🚀 高性能薪资版本详情查询 - 替换 GET /simple-payroll/versions/{version_id}
 * 响应时间 < 200ms
 */
export const getPayrollVersionOptimized = async (versionId: number) => {
  const response = await apiClient.get<OptimizedResponse<any>>(`/views-optimized/simple-payroll/versions/${versionId}`);
  return response.data;
};

/**
 * 🚀 高性能薪资审核汇总查询 - 替换 GET /simple-payroll/audit/summary/{version_id}
 * 响应时间 < 300ms
 */
export const getPayrollAuditSummaryOptimized = async (versionId: number) => {
  const response = await apiClient.get<OptimizedResponse<any>>(`/views-optimized/simple-payroll/audit/summary/${versionId}`);
  return response.data;
};

// ==================== 批量查询接口 ====================

/**
 * 🚀 批量lookup查询 - 一次请求获取多个lookup类型
 * 减少前端并发请求数量，响应时间 < 500ms
 */
export const batchLookupOptimized = async (lookupTypes: string[]) => {
  const response = await apiClient.post<OptimizedResponse<Record<string, any[]>>>('/views-optimized/batch-lookup', lookupTypes);
  return response.data;
};

// ==================== 健康检查接口 ====================

/**
 * 健康检查接口
 */
export const healthCheck = async () => {
  const response = await apiClient.get<OptimizedResponse<any>>('/views-optimized/health');
  return response.data;
};

// ==================== 便捷方法 ====================

/**
 * 🚀 一次性获取所有常用lookup数据
 * 用于应用初始化时减少并发请求
 */
export const getAllCommonLookupsOptimized = async () => {
  const commonLookupTypes = [
    'GENDER',
    'EMPLOYEE_STATUS', 
    'EMPLOYMENT_TYPE',
    'MARITAL_STATUS',
    'EDUCATION_LEVEL'
  ];
  
  return await batchLookupOptimized(commonLookupTypes);
};

/**
 * 🚀 获取HR基础数据（部门+人员类别）
 * 用于HR相关页面初始化
 */
export const getHRBasicDataOptimized = async () => {
  const [departments, personnelCategories] = await Promise.all([
    getDepartmentsOptimized(),
    getPersonnelCategoriesOptimized()
  ]);
  
  return {
    departments: departments.data,
    personnelCategories: personnelCategories.data
  };
};

/**
 * 🚀 获取薪资基础数据（周期+组件定义）
 * 用于薪资相关页面初始化
 */
export const getPayrollBasicDataOptimized = async () => {
  const [periods, components] = await Promise.all([
    getPayrollPeriodsOptimized(),
    getPayrollComponentDefinitionsOptimized()
  ]);
  
  return {
    periods: periods.data,
    components: components.data
  };
};

// ==================== 导出默认对象 ====================

export const optimizedApi = {
  // 用户相关
  getUserOptimized,
  
  // 配置相关
  getPayrollComponentDefinitionsOptimized,
  getLookupValuesPublicOptimized,
  getLookupTypesOptimized,
  
  // HR相关
  getDepartmentsOptimized,
  getPersonnelCategoriesOptimized,
  
  // 薪资相关
  getPayrollPeriodsOptimized,
  getPayrollVersionsOptimized,
  getPayrollVersionOptimized,
  getPayrollAuditSummaryOptimized,
  
  // 批量查询
  batchLookupOptimized,
  getAllCommonLookupsOptimized,
  getHRBasicDataOptimized,
  getPayrollBasicDataOptimized,
  
  // 健康检查
  healthCheck
};

export default optimizedApi; 