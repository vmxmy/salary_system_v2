import apiClient from '../api/apiClient';
import type { ApiListResponse } from '../pages/Payroll/types/payrollTypes'; // Corrected path
import type { PayrollComponentDefinition } from '../pages/Payroll/types/payrollTypes';

const PAYROLL_COMPONENTS_ENDPOINT = '/views-optimized/payroll-component-definitions';

/**
 * Fetches a list of payroll component definitions.
 * @param params Query parameters for filtering, pagination, etc. (e.g., { is_enabled: true })
 * @returns A promise that resolves to the list of payroll component definitions with metadata.
 */
export const getPayrollComponentDefinitions = async (
  params?: Record<string, any>
): Promise<ApiListResponse<PayrollComponentDefinition>> => {
  try {
    
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
      PAYROLL_COMPONENTS_ENDPOINT, 
      { params }
    );
    
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching payroll component definitions:', {
      message: error?.message,
      status: error?.status,
      statusText: error?.statusText,
      config: error?.config,
      response: error?.response,
      responseData: error?.response?.data,
      requestUrl: error?.config?.url,
      requestParams: error?.config?.params
    });
    throw error; // Rethrow to be handled by the caller
  }
}; 