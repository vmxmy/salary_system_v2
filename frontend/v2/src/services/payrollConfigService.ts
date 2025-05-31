import apiClient from '../api/apiClient';
import type { ApiListResponse } from '../pages/Payroll/types/payrollTypes'; // Corrected path
import type { PayrollComponentDefinition } from '../pages/Payroll/types/payrollTypes';

const PAYROLL_COMPONENTS_ENDPOINT = '/config/payroll-component-definitions';

/**
 * Fetches a list of payroll component definitions.
 * @param params Query parameters for filtering, pagination, etc. (e.g., { is_enabled: true })
 * @returns A promise that resolves to the list of payroll component definitions with metadata.
 */
export const getPayrollComponentDefinitions = async (
  params?: Record<string, any>
): Promise<ApiListResponse<PayrollComponentDefinition>> => {
  try {
    console.log({t('common:auto__payrollconfigservice_api_f09f8c')}, PAYROLL_COMPONENTS_ENDPOINT);
    console.log({t('common:auto__payrollconfigservice__f09f94')}, params);
    
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
      PAYROLL_COMPONENTS_ENDPOINT, 
      { params }
    );
    
    console.log({t('common:auto__payrollconfigservice_api_e29c85')});
    console.log({t('common:auto__payrollconfigservice__f09f93')}, response.data);
    
    return response.data;
  } catch (error: any) {
    console.error({t('common:auto__payrollconfigservice_api_e29d8c')}, error);
    console.error({t('common:auto__payrollconfigservice__e29d8c')}, {
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