import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getPayrollComponentDefinitions } from '../services/payrollConfigService';
import type { PayrollComponentDefinition, ApiListResponse } from '../pages/Payroll/types/payrollTypes';
import type { RootState } from './index'; // Import RootState for selectors

export interface PayrollConfigState { // Export the interface
  componentDefinitions: PayrollComponentDefinition[];
  loading: boolean;
  error: string | null;
}

const initialState: PayrollConfigState = {
  componentDefinitions: [],
  loading: false,
  error: null,
};

// Async Thunk for fetching payroll component definitions
export const fetchPayrollComponentDefinitions = createAsyncThunk(
  'payrollConfig/fetchComponentDefinitions',
  async (params: Record<string, any> | undefined, { rejectWithValue }) => { // Fix parameter typing
    try {
      // Ensure loading all component definitions, set a larger size parameter
      const requestParams = {
        size: 100, // Set to API allowed max 100
        is_active: true, // 修复：使用is_active替代is_enabled，与后端API匹配
        ...params
      };
      const response: ApiListResponse<PayrollComponentDefinition> = await getPayrollComponentDefinitions(requestParams);

      if (response.data && response.data.length > 0) {
        return response.data;
      } else {
        // Return an empty array if data is empty but not an error
        return [];
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch component definitions');
    }
  }
);

const payrollConfigSlice = createSlice({
  name: 'payrollConfig',
  initialState,
  reducers: {
    // No specific reducers needed for direct state manipulation based on the original store
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollComponentDefinitions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollComponentDefinitions.fulfilled, (state, action: PayloadAction<PayrollComponentDefinition[]>) => {
        state.componentDefinitions = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchPayrollComponentDefinitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch component definitions';
        state.componentDefinitions = []; // Clear definitions on error
      });
  },
});

// Selectors
export const selectPayrollComponentDefinitions = (state: RootState) => state.payrollConfig.componentDefinitions;
export const selectPayrollConfigLoading = (state: RootState) => state.payrollConfig.loading;
export const selectPayrollConfigError = (state: RootState) => state.payrollConfig.error;

export const selectDefinitionByCode = (state: RootState, code: string) =>
  state.payrollConfig.componentDefinitions.find((def: PayrollComponentDefinition) => def.code === code); // Explicitly type def

export const selectDefinitionByName = (state: RootState, name: string) =>
  state.payrollConfig.componentDefinitions.find((def: PayrollComponentDefinition) => def.code === name); // Explicitly type def and assuming name corresponds to code

// Export the reducer
export default payrollConfigSlice.reducer;