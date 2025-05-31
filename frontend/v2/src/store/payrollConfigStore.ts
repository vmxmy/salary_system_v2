import { create } from 'zustand';
import { getPayrollComponentDefinitions } from '../services/payrollConfigService';
import type { PayrollComponentDefinition, ApiListResponse } from '../pages/Payroll/types/payrollTypes';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    console.log(t('common:auto____f09f9a'));
    set({ loading: true, error: null });
    try {
      // 确保加载所有组件定义，设置较大的size参数
      const requestParams = {
        size: 100, // 设置为API允许的最大值100
        is_enabled: true, // v2 API使用is_enabled参数
        ...params
      };
      console.log(t('common:auto____f09f94'), requestParams);
      console.log(t('common:auto__api_config_payroll_component_definitions_f09f8c'));
      
      const response: ApiListResponse<PayrollComponentDefinition> = await getPayrollComponentDefinitions(requestParams);
      
      console.log(t('common:auto__api__f09f93'), response);
      console.log(t('common:auto____response_data_length__f09f92'));
      
      // 检查是否可能还有更多数据
      if (response.data.length === 100 && response.meta?.total && response.meta.total > 100) {
        console.warn(t('common:auto____response_meta_total__100____e29aa0'));
      }
      
      if (response.data && response.data.length > 0) {
        console.log(t('common:auto__5__f09f93'), response.data.slice(0, 5).map(def => ({ code: def.code, name: def.name, type: def.type })));
      } else {
        console.warn(t('common:auto__api_e29aa0'));
      }
      
      set({ componentDefinitions: response.data, loading: false });
    } catch (err: any) {
      console.error(t('common:auto____e29d8c'), err);
      console.error(t('common:auto____e29d8c'), {
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