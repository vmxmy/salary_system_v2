/**
 * 🚀 优化服务包装器
 * 在现有服务中集成高性能接口，提供自动降级功能
 */

import optimizedApi from '../api/optimizedApi';
import apiClient from '../api/apiClient';

// 性能监控配置
const PERFORMANCE_CONFIG = {
  slowThreshold: 1000, // 1秒以上认为是慢请求
  enableFallback: true, // 启用自动降级
  enableLogging: true   // 启用性能日志
};

// 性能日志记录
const logPerformance = (apiName: string, duration: number, isOptimized: boolean) => {
  if (!PERFORMANCE_CONFIG.enableLogging) return;
  
  const emoji = isOptimized ? '🚀' : '🐌';
  const type = duration > PERFORMANCE_CONFIG.slowThreshold ? '极慢' : '正常';
  
  console.log(`${emoji} ${type}请求: ${apiName} ${duration.toFixed(2)}ms (优化: ${isOptimized})`);
};

// 通用优化包装器
const createOptimizedWrapper = <T extends any[], R>(
  optimizedFn: (...args: T) => Promise<R>,
  fallbackFn: (...args: T) => Promise<R>,
  apiName: string
) => {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    
    try {
      // 尝试使用优化接口
      const result = await optimizedFn(...args);
      const duration = performance.now() - startTime;
      logPerformance(apiName, duration, true);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (PERFORMANCE_CONFIG.enableFallback) {
        console.warn(`🔄 优化接口失败，降级到原接口: ${apiName}`, error);
        
        try {
          const fallbackResult = await fallbackFn(...args);
          const totalDuration = performance.now() - startTime;
          logPerformance(`${apiName} (fallback)`, totalDuration, false);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`❌ 降级接口也失败: ${apiName}`, fallbackError);
          throw fallbackError;
        }
      } else {
        logPerformance(apiName, duration, true);
        throw error;
      }
    }
  };
};

// ==================== 优化服务包装器 ====================

/**
 * 🚀 优化的用户服务
 */
export const optimizedUserService = {
  getUser: createOptimizedWrapper(
    optimizedApi.getUserOptimized,
    (userId: number) => apiClient.get(`/users/${userId}`).then(res => res.data),
    'GET /users/{id}'
  )
};

/**
 * 🚀 优化的配置服务
 */
export const optimizedConfigService = {
  getPayrollComponentDefinitions: createOptimizedWrapper(
    optimizedApi.getPayrollComponentDefinitionsOptimized,
    (params?: any) => apiClient.get('/views-optimized/payroll-component-definitions', { params }).then(res => res.data),
    'GET /config/payroll-component-definitions'
  ),
  
  getLookupValuesPublic: createOptimizedWrapper(
    optimizedApi.getLookupValuesPublicOptimized,
    (lookupTypeCode: string, isActive = true) => 
      apiClient.get('/views-optimized/lookup-values-public', { 
        params: { lookup_type_code: lookupTypeCode, is_active: isActive } 
      }).then(res => res.data),
    'GET /config/lookup-values-public'
  ),
  
  getLookupTypes: createOptimizedWrapper(
    optimizedApi.getLookupTypesOptimized,
    () => apiClient.get('/views-optimized/lookup-types').then(res => res.data),
    'GET /lookup/types'
  )
};

/**
 * 🚀 优化的HR服务
 */
export const optimizedHRService = {
  getDepartments: createOptimizedWrapper(
    optimizedApi.getDepartmentsOptimized,
    (isActive = true) => apiClient.get('/views-optimized/departments', { params: { is_active: isActive } }).then(res => res.data),
    'GET /departments'
  ),
  
  getPersonnelCategories: createOptimizedWrapper(
    optimizedApi.getPersonnelCategoriesOptimized,
    (isActive = true) => apiClient.get('/views-optimized/personnel-categories', { params: { is_active: isActive } }).then(res => res.data),
    'GET /personnel-categories'
  ),
  
  // 批量获取HR基础数据
  getHRBasicData: createOptimizedWrapper(
    optimizedApi.getHRBasicDataOptimized,
    async () => {
      const [departments, personnelCategories] = await Promise.all([
        apiClient.get('/views-optimized/departments').then(res => res.data),
        apiClient.get('/views-optimized/personnel-categories').then(res => res.data)
      ]);
      return { departments, personnelCategories };
    },
    'GET HR基础数据批量'
  )
};

/**
 * 🚀 优化的薪资服务
 */
export const optimizedPayrollService = {
  getPayrollPeriods: createOptimizedWrapper(
    optimizedApi.getPayrollPeriodsOptimized,
    (params?: any) => apiClient.get('/views-optimized/simple-payroll/periods', { params }).then(res => res.data),
    'GET /simple-payroll/periods'
  ),
  
  getPayrollVersions: createOptimizedWrapper(
    optimizedApi.getPayrollVersionsOptimized,
    () => apiClient.get('/views-optimized/simple-payroll/versions').then(res => res.data),
    'GET /simple-payroll/versions'
  ),
  
  // 批量获取薪资基础数据
  getPayrollBasicData: createOptimizedWrapper(
    optimizedApi.getPayrollBasicDataOptimized,
    async () => {
      const [periods, components] = await Promise.all([
        apiClient.get('/views-optimized/simple-payroll/periods').then(res => res.data),
        apiClient.get('/views-optimized/payroll-component-definitions').then(res => res.data)
      ]);
      return { periods, components };
    },
    'GET 薪资基础数据批量'
  )
};

/**
 * 🚀 优化的Lookup服务
 */
export const optimizedLookupService = {
  // 批量获取常用lookup数据
  getAllCommonLookups: createOptimizedWrapper(
    optimizedApi.getAllCommonLookupsOptimized,
    async () => {
      const lookupTypes = ['GENDER', 'EMPLOYEE_STATUS', 'EMPLOYMENT_TYPE', 'MARITAL_STATUS', 'EDUCATION_LEVEL'];
      const results = await Promise.all(
        lookupTypes.map(type => 
          apiClient.get('/views-optimized/lookup-values-public', { 
            params: { lookup_type_code: type } 
          }).then(res => ({ [type]: res.data }))
        )
      );
      return Object.assign({}, ...results);
    },
    'GET 常用Lookup批量'
  )
};

// ==================== 统一导出 ====================

export const optimizedServices = {
  user: optimizedUserService,
  config: optimizedConfigService,
  hr: optimizedHRService,
  payroll: optimizedPayrollService,
  lookup: optimizedLookupService
};

export default optimizedServices; 