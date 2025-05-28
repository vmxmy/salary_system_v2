import { create } from 'zustand';
import { getPayrollComponentDefinitions } from '../services/payrollConfigService';
import type { PayrollComponentDefinition, ApiListResponse } from '../pages/Payroll/types/payrollTypes';

interface PayrollConfigState {
  componentDefinitions: PayrollComponentDefinition[];
  loading: boolean;
  error: string | null;
  fetchComponentDefinitions: (params?: Record<string, any>) => Promise<void>;
  getDefinitionByCode: (code: string) => PayrollComponentDefinition | undefined;
  getDefinitionByName: (name: string) => PayrollComponentDefinition | undefined; // name here refers to item.name from PayrollItemDetail
}

const usePayrollConfigStore = create<PayrollConfigState>((set, get) => ({
  componentDefinitions: [],
  loading: false,
  error: null,
  fetchComponentDefinitions: async (params?: Record<string, any>) => {
    console.log('🚀 开始加载薪资字段定义...');
    set({ loading: true, error: null });
    try {
      // 确保加载所有组件定义，设置较大的size参数
      const requestParams = {
        size: 100, // 设置为API允许的最大值100
        is_enabled: true, // v2 API使用is_enabled参数
        ...params
      };
      console.log('🔧 请求参数:', requestParams);
      console.log('🌐 即将调用API: /config/payroll-components');
      
      const response: ApiListResponse<PayrollComponentDefinition> = await getPayrollComponentDefinitions(requestParams);
      
      console.log('📦 API响应:', response);
      console.log(`💼 薪资字段定义加载成功，共 ${response.data.length} 个组件`);
      
      // 检查是否可能还有更多数据
      if (response.data.length === 100 && response.meta?.total && response.meta.total > 100) {
        console.warn(`⚠️ 注意：系统中共有 ${response.meta.total} 个组件定义，但只加载了前100个。如需加载全部，请考虑实现分页加载。`);
      }
      
      if (response.data && response.data.length > 0) {
        console.log('📋 前5个组件定义:', response.data.slice(0, 5).map(def => ({ code: def.code, name: def.name, type: def.type })));
      } else {
        console.warn('⚠️ API返回的组件定义数组为空');
      }
      
      set({ componentDefinitions: response.data, loading: false });
    } catch (err: any) {
      console.error("❌ 加载薪资字段定义失败:", err);
      console.error("❌ 错误详情:", {
        message: err.message,
        status: err.status,
        statusText: err.statusText,
        response: err.response,
        stack: err.stack
      });
      set({ error: err.message || 'Failed to fetch component definitions', loading: false });
      // Optionally, rethrow or handle more gracefully for UI
    }
  },
  getDefinitionByCode: (code: string) => {
    return get().componentDefinitions.find(def => def.code === code);
  },
  // Assuming item.name in PayrollItemDetail corresponds to PayrollComponentDefinition.code or PayrollComponentDefinition.name
  // If item.name from PayrollItemDetail is intended to match PayrollComponentDefinition.code, then getDefinitionByCode is sufficient.
  // If item.name from PayrollItemDetail is actually the human-readable name, then this function is useful.
  // For now, let's assume item.name refers to the unique code for safer matching.
  getDefinitionByName: (name: string) => {
    // In PayrollEntryDetailModal, item.name is used from PayrollItemDetail.
    // This `name` should ideally be the `code` of the PayrollComponentDefinition for a robust match.
    // If `PayrollItemDetail.name` stores the `code`, then this function should be `get().componentDefinitions.find(def => def.code === name);`
    // If `PayrollItemDetail.name` stores the `display_name`, then this is `get().componentDefinitions.find(def => def.name === name);`
    // Let's assume for now that PayrollItemDetail.name is the unique *code* that matches PayrollComponentDefinition.code
    return get().componentDefinitions.find(def => def.code === name);
  }
}));

export default usePayrollConfigStore; 