import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deepCleanValue } from '../utils/payrollDataUtils';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { getPayrollData } from '../pages/Payroll/services/payrollBulkImportApi';
import apiClient from '../api/apiClient';

// 查询键工厂函数
export const payrollDataQueryKeys = {
  all: ['payrollData'] as const,
  lists: () => [...payrollDataQueryKeys.all, 'list'] as const,
  list: (filters: PayrollDataFilters) => [...payrollDataQueryKeys.lists(), filters] as const,
  details: () => [...payrollDataQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...payrollDataQueryKeys.details(), id] as const,
};

// 筛选参数接口
export interface PayrollDataFilters {
  periodId?: string;
  departmentId?: string;
  employeeId?: string;
  page?: number;
  size?: number;
  [key: string]: any;
}

// 薪资数据响应接口
export interface PayrollDataResponse {
  data: any[];
  total: number;
  page: number;
  size: number;
}

// Hook 配置选项
export interface UsePayrollDataQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onError?: (error: any) => void;
  onSuccess?: (data: PayrollDataResponse) => void;
}

/**
 * 薪资数据查询 Hook
 * 提供智能缓存、错误处理、重试逻辑等功能
 */
export function usePayrollDataQuery(
  filters: PayrollDataFilters,
  options: UsePayrollDataQueryOptions = {}
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    enabled = true,
    refetchInterval,
    onError,
    onSuccess,
  } = options;

  return useQuery({
    queryKey: payrollDataQueryKeys.list(filters),
    queryFn: async (): Promise<PayrollDataResponse> => {
      console.log('🔄 [usePayrollDataQuery] 开始获取薪资数据', { filters });
      
      try {
        // 使用批量模态框API - V2路由
        const response = await apiClient.get(`/reports/payroll-modals/period/${filters.periodId}?limit=${filters.size || 100}`);
        const modalDataList = response.data;
        
        // 增强的React元素检测和清理函数 - 移到前面
        const isReactElement = (val: any): boolean => {
          return val && (
            val.$$typeof === Symbol.for('react.element') ||
            val.$$typeof === Symbol.for('react.portal') ||
            val.$$typeof === Symbol.for('react.fragment') ||
            (typeof val === 'object' && val !== null && (
              val.$$typeof || 
              val.$typeof || 
              (val.type && val.props) ||
              (val._owner !== undefined)
            ))
          );
        };

        console.log('✅ [usePayrollDataQuery] API响应数据:', modalDataList.length, '条记录');

        // 深度清理函数，彻底移除React元素
        const deepCleanReactElements = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          
          if (isReactElement(obj)) {
            console.warn(`[深度清理] 发现并移除React元素:`, obj);
            return '[已清理的React元素]';
          }
          
          if (Array.isArray(obj)) {
            return obj.map(item => deepCleanReactElements(item));
          }
          
          if (typeof obj === 'object') {
            const cleaned: any = {};
            Object.entries(obj).forEach(([key, value]) => {
              cleaned[key] = deepCleanReactElements(value);
            });
            return cleaned;
          }
          
          return obj;
        };

        // 安全地展开对象字段的辅助函数
        const safeSpread = (obj: any): Record<string, any> => {
          if (!obj || typeof obj !== 'object') return {};
          
          // 先深度清理React元素
          const cleanedObj = deepCleanReactElements(obj);
          
          const result: Record<string, any> = {};
          Object.entries(cleanedObj).forEach(([key, value]) => {
            // 再次确保所有值都是原始类型
            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                result[key] = value; // 保持数组
              } else {
                try {
                  result[key] = JSON.stringify(value); // 转换普通对象为字符串
                } catch (e) {
                  result[key] = '[无法序列化的对象]';
                }
              }
            } else {
              result[key] = value; // 保持原始类型
            }
          });
          return result;
        };

        // 将模态框数据转换为表格数据格式
        const processedData = modalDataList.map((modalData: any, index: number) => {
          const baseData = {
            id: modalData.薪资条目id || index,
            key: modalData.薪资条目id || `row-${index}`,
            薪资条目id: modalData.薪资条目id,
            员工编号: modalData.基础信息?.员工编号,
            员工姓名: modalData.基础信息?.员工姓名,
            部门名称: modalData.基础信息?.部门名称,
            职位名称: modalData.基础信息?.职位名称,
            人员类别: modalData.基础信息?.人员类别,
            编制: modalData.基础信息?.编制,
            薪资期间名称: modalData.基础信息?.薪资期间名称,
            应发合计: modalData.汇总信息?.应发合计,
            扣除合计: modalData.汇总信息?.扣除合计,
            实发合计: modalData.汇总信息?.实发合计,
            // 添加员工详细信息 - 联系信息
            电话: modalData.员工详细信息?.联系信息?.电话,
            邮箱: modalData.员工详细信息?.联系信息?.邮箱,
            家庭住址: modalData.员工详细信息?.联系信息?.家庭住址,
            紧急联系人: modalData.员工详细信息?.联系信息?.紧急联系人,
            紧急联系电话: modalData.员工详细信息?.联系信息?.紧急联系电话,
            // 添加员工详细信息 - 个人信息
            身份证号: modalData.员工详细信息?.个人信息?.身份证号,
            出生日期: modalData.员工详细信息?.个人信息?.出生日期,
            性别: modalData.员工详细信息?.个人信息?.性别,
            民族: modalData.员工详细信息?.个人信息?.民族,
            民族详情: modalData.员工详细信息?.个人信息?.民族详情,
            婚姻状况: modalData.员工详细信息?.个人信息?.婚姻状况,
            学历: modalData.员工详细信息?.个人信息?.学历,
            政治面貌: modalData.员工详细信息?.个人信息?.政治面貌,
            // 添加员工详细信息 - 工作信息
            入职日期: modalData.员工详细信息?.工作信息?.入职日期,
            首次工作日期: modalData.员工详细信息?.工作信息?.首次工作日期,
            现职位开始日期: modalData.员工详细信息?.工作信息?.现职位开始日期,
            中断服务年限: modalData.员工详细信息?.工作信息?.中断服务年限,
            员工状态: modalData.员工详细信息?.工作信息?.员工状态,
            用工类型: modalData.员工详细信息?.工作信息?.用工类型,
            合同类型: modalData.员工详细信息?.工作信息?.合同类型,
            薪级: modalData.员工详细信息?.工作信息?.薪级,
            薪档: modalData.员工详细信息?.工作信息?.薪档,
            职位等级: modalData.员工详细信息?.工作信息?.职位等级,
            // 添加员工详细信息 - 社保公积金信息
            社保客户号: modalData.员工详细信息?.社保公积金信息?.社保客户号,
            住房公积金客户号: modalData.员工详细信息?.社保公积金信息?.住房公积金客户号,
            // 添加员工详细信息 - 银行账号信息
            开户银行: modalData.员工详细信息?.银行账号信息?.开户银行,
            账户持有人: modalData.员工详细信息?.银行账号信息?.账户持有人,
            银行账号: modalData.员工详细信息?.银行账号信息?.银行账号,
            开户支行: modalData.员工详细信息?.银行账号信息?.开户支行,
            银行代码: modalData.员工详细信息?.银行账号信息?.银行代码,
            账户类型: modalData.员工详细信息?.银行账号信息?.账户类型,
          };

          // 安全地添加应发明细
          const 应发明细 = safeSpread(modalData.应发明细);
          // 安全地添加扣除明细
          const 个人扣缴项目 = safeSpread(modalData.扣除明细?.个人扣缴项目);
          const 单位扣缴项目 = safeSpread(modalData.扣除明细?.单位扣缴项目);
          // 安全地添加计算参数
          const 计算参数 = safeSpread(modalData.计算参数);

          return {
            ...baseData,
            ...应发明细,
            ...个人扣缴项目,
            ...单位扣缴项目,
            ...计算参数
          };
        });

        console.log('✅ [usePayrollDataQuery] 数据转换完成:', processedData.length, '条记录');
        
        // 深度清理数据 - 确保没有React元素进入缓存
        const cleanedData = processedData.map((item: any) => {
          const cleanedItem: any = {};
          Object.keys(item).forEach(key => {
            cleanedItem[key] = deepCleanValue((item as any)[key]);
          });
          return cleanedItem;
        });
        
        // 额外的数据验证 - 确保没有React元素进入最终数据
        const validatedData = cleanedData.map((item: any, index: number) => {
          const validatedItem: any = {};
          Object.keys(item).forEach(key => {
            const value = (item as any)[key];
            // 检查每个值，确保没有React元素
            if (typeof value === 'object' && value !== null) {
              const isReactElement = (value as any).$$typeof || (value as any).$typeof || ((value as any).type && (value as any).props);
              if (isReactElement) {
                console.error(`[数据验证] 在第${index}条记录的字段"${key}"中发现React元素:`, value);
                validatedItem[key] = '[数据错误:React元素]';
              } else {
                validatedItem[key] = value;
              }
            } else {
              validatedItem[key] = value;
            }
          });
          return validatedItem;
        });
        
        console.log('✅ [usePayrollDataQuery] 数据验证完成:', validatedData.length);

        const result: PayrollDataResponse = {
          data: validatedData,
          total: validatedData.length,
          page: filters.page || 1,
          size: filters.size || 100,
        };

        onSuccess?.(result);
        return result;
      } catch (error: any) {
        console.error('❌ [usePayrollDataQuery] 数据获取失败', error);
        
        // 统一错误处理
        const errorMessage = error?.response?.data?.detail?.error?.message 
          || error?.message 
          || t('common.error.fetchFailed');
        
        message.error(errorMessage);
        onError?.(error);
        throw error;
      }
    },
    enabled,
    refetchInterval,
    // 缓存配置 - 优化以避免无限循环
    staleTime: 0, // 🚨 暂时禁用缓存，确保每次都获取新数据
    gcTime: 0, // 🚨 立即清除缓存，避免React元素被持久化
    // 重试配置
    retry: (failureCount, error: any) => {
      // 对于 4xx 错误不重试
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // 最多重试 1 次，减少重试次数
      return failureCount < 1;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // 网络状态管理 - 关键：避免频繁重新获取
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // 关闭重连时自动刷新
    refetchOnMount: true, // 只在组件挂载时获取
    // 错误边界
    throwOnError: false,
  });
}

/**
 * 预加载薪资数据
 * 用于提前缓存可能需要的数据
 */
export function usePrefetchPayrollData() {
  const queryClient = useQueryClient();

  return (filters: PayrollDataFilters) => {
    queryClient.prefetchQuery({
      queryKey: payrollDataQueryKeys.list(filters),
             queryFn: async () => {
         const response = await getPayrollData(filters);
        return {
          data: response.data || [],
          total: response.total || 0,
          page: filters.page || 1,
          size: filters.size || 100,
        };
      },
      staleTime: 3 * 60 * 1000,
    });
  };
}

/**
 * 刷新薪资数据缓存
 */
export function useRefreshPayrollData() {
  const queryClient = useQueryClient();

  return {
    // 刷新所有薪资数据
    refreshAll: () => {
      return queryClient.invalidateQueries({
        queryKey: payrollDataQueryKeys.all,
      });
    },
    // 刷新特定筛选条件的数据
    refreshFiltered: (filters: PayrollDataFilters) => {
      return queryClient.invalidateQueries({
        queryKey: payrollDataQueryKeys.list(filters),
      });
    },
    // 清除所有缓存
    clearCache: () => {
      queryClient.removeQueries({
        queryKey: payrollDataQueryKeys.all,
      });
    },
  };
}

/**
 * 获取缓存状态
 */
export function usePayrollDataCacheStatus() {
  const queryClient = useQueryClient();

  return {
    // 获取缓存的查询数量
    getCacheSize: () => {
      const queries = queryClient.getQueryCache().findAll({
        queryKey: payrollDataQueryKeys.all,
      });
      return queries.length;
    },
    // 获取特定查询的缓存状态
    getQueryStatus: (filters: PayrollDataFilters) => {
      const query = queryClient.getQueryState(payrollDataQueryKeys.list(filters));
      return {
        isCached: !!query,
        isStale: query ? Date.now() - query.dataUpdatedAt > (3 * 60 * 1000) : true,
        lastUpdated: query?.dataUpdatedAt,
        error: query?.error,
      };
    },
  };
}

/**
 * 薪资数据变更 Hook
 * 用于处理数据的增删改操作
 */
export function usePayrollDataMutations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return {
    // 乐观更新：立即更新缓存，如果失败则回滚
    optimisticUpdate: (filters: PayrollDataFilters, updater: (oldData: PayrollDataResponse) => PayrollDataResponse) => {
      const queryKey = payrollDataQueryKeys.list(filters);
      
      // 获取当前数据作为回滚点
      const previousData = queryClient.getQueryData(queryKey);
      
      // 乐观更新
      queryClient.setQueryData(queryKey, updater);
      
      return {
        rollback: () => {
          queryClient.setQueryData(queryKey, previousData);
        },
      };
    },
    
    // 删除数据后更新缓存
    onDeleteSuccess: (filters: PayrollDataFilters, deletedIds: string[]) => {
      queryClient.setQueryData(
        payrollDataQueryKeys.list(filters),
        (oldData: PayrollDataResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.filter(item => !deletedIds.includes(item.id)),
            total: oldData.total - deletedIds.length,
          };
        }
      );
      
      message.success(t('common.success.deleteSuccess'));
    },
    
    // 批量操作后刷新数据
    onBatchOperationSuccess: (filters: PayrollDataFilters) => {
      queryClient.invalidateQueries({
        queryKey: payrollDataQueryKeys.list(filters),
      });
      
      message.success(t('common.success.operationSuccess'));
    },
  };
} 