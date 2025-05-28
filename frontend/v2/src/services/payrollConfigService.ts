import apiClient from '../api/apiClient';
import type { ApiListResponse } from '../pages/Payroll/types/payrollTypes'; // Corrected path
import type { PayrollComponentDefinition } from '../pages/Payroll/types/payrollTypes';

const PAYROLL_COMPONENTS_ENDPOINT = '/config/v2/payroll-component-definitions';

/**
 * Fetches a list of payroll component definitions.
 * @param params Query parameters for filtering, pagination, etc. (e.g., { is_enabled: true })
 * @returns A promise that resolves to the list of payroll component definitions with metadata.
 */
export const getPayrollComponentDefinitions = async (
  params?: Record<string, any>
): Promise<ApiListResponse<PayrollComponentDefinition>> => {
  try {
    console.log('🌐 payrollConfigService: 开始API调用', PAYROLL_COMPONENTS_ENDPOINT);
    console.log('🔧 payrollConfigService: 请求参数', params);
    
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
      PAYROLL_COMPONENTS_ENDPOINT, 
      { params }
    );
    
    console.log('✅ payrollConfigService: API调用成功');
    console.log('📦 payrollConfigService: 响应数据', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ payrollConfigService: API调用失败', error);
    console.error('❌ payrollConfigService: 错误详情', {
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