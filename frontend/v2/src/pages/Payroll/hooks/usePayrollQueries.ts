import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  getPayrollPeriods,
  getPayrollRuns,
  getPayrollEntries,
  getPayrollComponentDefinitions,
  createPayrollEntry,
  updatePayrollEntryDetails,
  deletePayrollEntry,
} from '../services/payrollApi';
import type {
  PayrollPeriod,
  PayrollRun,
  PayrollEntry,
  PayrollComponentDefinition,
  CreatePayrollEntryPayload,
  PayrollEntryPatch,
} from '../types/payrollTypes';

// 查询键
export const PAYROLL_QUERY_KEYS = {
  PERIODS: 'payroll-periods',
  RUNS: 'payroll-runs',
  ENTRIES: 'payroll-entries',
  COMPONENTS: 'payroll-component-definitions',
} as const;

// 缓存配置
const CACHE_CONFIG = {
  // 薪资周期 - 相对静态，缓存较长时间
  PERIODS: {
    staleTime: 15 * 60 * 1000, // 15分钟
    gcTime: 30 * 60 * 1000, // 30分钟
  },
  // 薪资字段 - 静态数据，缓存很长时间
  COMPONENTS: {
    staleTime: 30 * 60 * 1000, // 30分钟
    gcTime: 60 * 60 * 1000, // 1小时
  },
  // 薪资记录 - 动态数据，缓存较短时间
  ENTRIES: {
    staleTime: 2 * 60 * 1000, // 2分钟
    gcTime: 5 * 60 * 1000, // 5分钟
  },
  // 薪资批次 - 动态数据
  RUNS: {
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  },
} as const;

/**
 * 获取薪资周期列表
 */
export function usePayrollPeriods(params?: Record<string, any>) {
  return useQuery({
    queryKey: [PAYROLL_QUERY_KEYS.PERIODS, params],
    queryFn: () => getPayrollPeriods(params),
    staleTime: CACHE_CONFIG.PERIODS.staleTime,
    gcTime: CACHE_CONFIG.PERIODS.gcTime,
    retry: 2,
    select: (data) => data.data, // 只返回数据部分
  });
}

/**
 * 获取薪资批次列表
 */
export function usePayrollRuns(params?: {
  page?: number;
  size?: number;
  period_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: [PAYROLL_QUERY_KEYS.RUNS, params],
    queryFn: () => getPayrollRuns(params),
    staleTime: CACHE_CONFIG.RUNS.staleTime,
    gcTime: CACHE_CONFIG.RUNS.gcTime,
    retry: 2,
    enabled: !!params, // 只有在有参数时才启用
  });
}

/**
 * 获取薪资记录列表
 */
export function usePayrollEntries(params?: {
  page?: number;
  size?: number;
  payroll_run_id?: number;
  employee_id?: number;
  status_id?: number;
  period_id?: number;
  department_name?: string;
  personnel_category_name?: string;
  min_gross_pay?: number;
  max_gross_pay?: number;
  min_net_pay?: number;
  max_net_pay?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  include_employee_details?: boolean;
  include_payroll_period?: boolean;
}) {
  return useQuery({
    queryKey: [PAYROLL_QUERY_KEYS.ENTRIES, params],
    queryFn: () => getPayrollEntries(params),
    staleTime: CACHE_CONFIG.ENTRIES.staleTime,
    gcTime: CACHE_CONFIG.ENTRIES.gcTime,
    retry: 2,
    enabled: !!params?.period_id, // 只有在指定周期时才启用
    select: (data) => data.data, // 只返回数据部分
  });
}

/**
 * 获取薪资字段定义
 */
export function usePayrollComponents(params?: {
  component_type?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: [PAYROLL_QUERY_KEYS.COMPONENTS, params],
    queryFn: () => getPayrollComponentDefinitions(params),
    staleTime: CACHE_CONFIG.COMPONENTS.staleTime,
    gcTime: CACHE_CONFIG.COMPONENTS.gcTime,
    retry: 2,
    select: (data) => data.data, // 只返回数据部分
  });
}

/**
 * 创建薪资记录
 */
export function useCreatePayrollEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePayrollEntryPayload) => createPayrollEntry(data),
    onSuccess: (data, variables) => {
      message.success({t('payroll:auto_text_e896aa')});
      
      // 使相关查询失效
      queryClient.invalidateQueries({ 
        queryKey: [PAYROLL_QUERY_KEYS.ENTRIES] 
      });
      
      // 如果指定了周期，也使该周期的查询失效
      if (variables.payroll_period_id) {
        queryClient.invalidateQueries({ 
          queryKey: [PAYROLL_QUERY_KEYS.ENTRIES, { period_id: variables.payroll_period_id }] 
        });
      }
    },
    onError: (error: any) => {
      console.error({t('payroll:auto___e5889b')}, error);
      message.error(`创建失败: ${error.message || {t('payroll:auto_text_e69caa')}}`);
    },
  });
}

/**
 * 更新薪资记录
 */
export function useUpdatePayrollEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: number; data: PayrollEntryPatch }) => 
      updatePayrollEntryDetails(entryId, data),
    onSuccess: () => {
      message.success({t('payroll:auto_text_e896aa')});
      
      // 使相关查询失效
      queryClient.invalidateQueries({ 
        queryKey: [PAYROLL_QUERY_KEYS.ENTRIES] 
      });
    },
    onError: (error: any) => {
      console.error({t('payroll:auto___e69bb4')}, error);
      message.error(`更新失败: ${error.message || {t('payroll:auto_text_e69caa')}}`);
    },
  });
}

/**
 * 删除薪资记录
 */
export function useDeletePayrollEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (entryId: number) => deletePayrollEntry(entryId),
    onSuccess: () => {
      message.success({t('payroll:auto_text_e896aa')});
      
      // 使相关查询失效
      queryClient.invalidateQueries({ 
        queryKey: [PAYROLL_QUERY_KEYS.ENTRIES] 
      });
    },
    onError: (error: any) => {
      console.error({t('payroll:auto___e588a0')}, error);
      message.error(`删除失败: ${error.message || {t('payroll:auto_text_e69caa')}}`);
    },
  });
} 