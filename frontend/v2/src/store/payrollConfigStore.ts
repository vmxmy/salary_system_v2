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
    set({ loading: true, error: null });
    try {
      const response: ApiListResponse<PayrollComponentDefinition> = await getPayrollComponentDefinitions(params);
      set({ componentDefinitions: response.data, loading: false });
    } catch (err: any) {
      console.error("Error fetching payroll component definitions for store:", err);
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