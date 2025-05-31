import apiClient from '../../../api/apiClient'; // Assuming a global apiClient exists
import type {
  PayrollPeriod,
  ApiListResponse,
  ApiSingleResponse,
  PayrollRun,
  PayrollRunPatch,
  CreatePayrollRunPayload,
  UpdatePayrollRunPayload,
  PayrollEntry,
  PayrollEntryPatch,
  CreatePayrollEntryPayload,
  BulkCreatePayrollEntriesPayload,
  PayrollComponentDefinition,
  BulkCreatePayrollEntriesResult
} from '../types/payrollTypes';

const PAYROLL_PERIODS_ENDPOINT = '/payroll-periods';
const PAYROLL_RUNS_ENDPOINT = '/payroll-runs';
const PAYROLL_ENTRIES_ENDPOINT = '/payroll-entries';
const PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT = '/config/payroll-component-definitions';

/**
 * Fetches a list of payroll periods.
 * @param params Query parameters for filtering, pagination, etc.
 * @returns A promise that resolves to the list of payroll periods with metadata.
 */
export const getPayrollPeriods = async (params?: Record<string, any>): Promise<ApiListResponse<PayrollPeriod>> => {
  try {
    // 添加详细日志
    console.log('Fetching payroll periods with params:', JSON.stringify(params, null, 2));
    console.log('Request URL:', `${apiClient.defaults.baseURL}${PAYROLL_PERIODS_ENDPOINT}`);
    
    // 确保status_lookup_value_id是数字类型
    if (params?.status_lookup_value_id) {
      params.status_lookup_value_id = Number(params.status_lookup_value_id);
      console.log('Converted status_lookup_value_id to Number:', params.status_lookup_value_id, typeof params.status_lookup_value_id);
    }
    
    const response = await apiClient.get<ApiListResponse<PayrollPeriod>>(PAYROLL_PERIODS_ENDPOINT, { params });
    console.log('Payroll periods response:', response.status, response.statusText);
    console.log('Payroll periods data count:', response.data.data.length);
    console.log('[payrollApi.ts] getPayrollPeriods - Full periods received:', JSON.stringify(response.data.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('Error fetching payroll periods:', error);
    
    // 添加详细错误日志
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error; // Rethrow to be handled by the caller
  }
};

/**
 * Creates a new payroll period.
 * @param data The data for the new payroll period.
 * @returns A promise that resolves to the created payroll period.
 */
export const createPayrollPeriod = async (data: Partial<PayrollPeriod>): Promise<ApiSingleResponse<PayrollPeriod>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollPeriod>>(PAYROLL_PERIODS_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error creating payroll period:', error);
    throw error;
  }
};

/**
 * Updates an existing payroll period.
 * @param periodId The ID of the payroll period to update.
 * @param data The data to update the payroll period with.
 * @returns A promise that resolves to the updated payroll period.
 */
export const updatePayrollPeriod = async (periodId: number, data: Partial<PayrollPeriod>): Promise<ApiSingleResponse<PayrollPeriod>> => {
  try {
    const response = await apiClient.put<ApiSingleResponse<PayrollPeriod>>(`${PAYROLL_PERIODS_ENDPOINT}/${periodId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating payroll period ${periodId}:`, error);
    throw error;
  }
};

/**
 * Deletes a payroll period.
 * @param periodId The ID of the payroll period to delete.
 * @returns A promise that resolves when the payroll period is deleted.
 */
export const deletePayrollPeriod = async (periodId: number): Promise<void> => {
  try {
    await apiClient.delete(`${PAYROLL_PERIODS_ENDPOINT}/${periodId}`);
  } catch (error) {
    console.error(`Error deleting payroll period ${periodId}:`, error);
    throw error;
  }
};

// --- Payroll Runs Service Functions ---

/**
 * Fetches a list of payroll runs.
 */
export const getPayrollRuns = async (params?: {
  page?: number;
  size?: number;
  period_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<ApiListResponse<PayrollRun>> => {
  try {
    console.log('[payrollApi.ts] 📡 getPayrollRuns called with params:', params);
    console.log('[payrollApi.ts] 📡 Request URL:', `${apiClient.defaults.baseURL}${PAYROLL_RUNS_ENDPOINT}`);
    
    // ✅ 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[payrollApi.ts] ⏱️ API request timeout after 30 seconds');
      controller.abort();
    }, 30000); // 30秒超时
    
    const response = await apiClient.get<ApiListResponse<PayrollRun>>(PAYROLL_RUNS_ENDPOINT, { 
      params,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId); // 清除超时计时器
    
    console.log('[payrollApi.ts] ✅ getPayrollRuns response:', {
      status: response.status,
      statusText: response.statusText,
      dataCount: response.data.data?.length || 0,
      meta: response.data.meta,
      data: response.data.data
    });
    
    return response.data;
  } catch (error: any) {
    // ✅ 更详细的错误处理
    if (error.name === 'AbortError') {
      console.error('[payrollApi.ts] ❌ getPayrollRuns request aborted (timeout)');
      throw new Error('API request timeout - please check your network connection');
    } else if (error.response) {
      // 服务器返回了错误响应
      console.error('[payrollApi.ts] ❌ getPayrollRuns server error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('[payrollApi.ts] ❌ getPayrollRuns no response received:', error.request);
    } else {
      // 设置请求时发生错误
      console.error('[payrollApi.ts] ❌ getPayrollRuns request setup error:', error.message);
    }
    
    console.error('[payrollApi.ts] ❌ getPayrollRuns full error:', error);
    throw error;
  }
};

/**
 * Creates a new payroll run.
 */
export const createPayrollRun = async (data: CreatePayrollRunPayload): Promise<ApiSingleResponse<PayrollRun>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollRun>>(PAYROLL_RUNS_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error creating payroll run:', error);
    throw error;
  }
};

/**
 * Fetches a specific payroll run by its ID.
 */
export const getPayrollRunById = async (id: number, options?: { include_employee_details?: boolean }): Promise<ApiSingleResponse<PayrollRun>> => {
  try {
    const response = await apiClient.get<ApiSingleResponse<PayrollRun>>(
      `${PAYROLL_RUNS_ENDPOINT}/${id}`, 
      { params: options }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching payroll run ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing payroll run.
 * Note: The backend PUT /v2/payroll-runs/{run_id} expects full replacement or specific fields.
 * If it's a PATCH for partial updates (like just status, or just notes), PayrollRunPatch is correct.
 * If it's a PUT that needs more fields from CreatePayrollRunPayload but all optional, then UpdatePayrollRunPayload is more appropriate.
 * The current implementation in PayrollRunsPage.tsx for edit sends all fields, resembling a PUT, so we'll align updatePayrollRun to accept UpdatePayrollRunPayload.
 */
export const updatePayrollRun = async (id: number, data: UpdatePayrollRunPayload): Promise<ApiSingleResponse<PayrollRun>> => {
  try {
    const response = await apiClient.put<ApiSingleResponse<PayrollRun>>(`${PAYROLL_RUNS_ENDPOINT}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating payroll run ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a payroll run.
 */
export const deletePayrollRun = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`${PAYROLL_RUNS_ENDPOINT}/${id}`);
  } catch (error) {
    console.error(`Error deleting payroll run ${id}:`, error);
    throw error;
  }
};

/**
 * Exports the bank file for a specific payroll run.
 */
export const exportPayrollRunBankFile = async (id: number): Promise<Blob> => {
  try {
    const response = await apiClient.get<Blob>(`${PAYROLL_RUNS_ENDPOINT}/${id}/bank-export`, {
      responseType: 'blob', // Important for file downloads
    });
    return response.data; 
  } catch (error) {
    console.error(`Error exporting bank file for payroll run ${id}:`, error);
    throw error;
  }
};

// --- Payroll Entries Service Functions ---

/**
 * Fetches a list of payroll entries.
 * Can be filtered by payroll_run_id, employee_id, etc.
 * @param params Query parameters for filtering, pagination.
 */
export const getPayrollEntries = async (params?: {
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
}): Promise<ApiListResponse<PayrollEntry>> => {
  try {
    console.log('🔍 [payrollApi] getPayrollEntries called with params:', params);
    const response = await apiClient.get<ApiListResponse<PayrollEntry>>(PAYROLL_ENTRIES_ENDPOINT, { params });
    
    console.log('🔍 [payrollApi] API response status:', response.status);
    console.log('🔍 [payrollApi] API response data count:', response.data.data.length);
    
    // 检查第一条记录的结构
    if (response.data.data.length > 0) {
      const firstEntry = response.data.data[0];
      console.log('🔍 [payrollApi] First entry structure:', {
        id: firstEntry.id,
        employee_id: firstEntry.employee_id,
        has_employee: !!firstEntry.employee,
        employee_keys: firstEntry.employee ? Object.keys(firstEntry.employee) : null,
        employee_first_name: firstEntry.employee?.first_name,
        employee_last_name: firstEntry.employee?.last_name
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll entries:', error);
    throw error;
  }
};

/**
 * Fetches a specific payroll entry by its ID.
 * @param entryId The ID of the payroll entry.
 */
export const getPayrollEntryById = async (entryId: number): Promise<ApiSingleResponse<PayrollEntry>> => {
  try {
    const response = await apiClient.get<ApiSingleResponse<PayrollEntry>>(`${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching payroll entry ${entryId}:`, error);
    throw error;
  }
};

/**
 * Updates details of a specific payroll entry.
 * @param entryId The ID of the payroll entry to update.
 * @param data The data to update, conforming to PayrollEntryPatch.
 */
export const updatePayrollEntryDetails = async (entryId: number, data: PayrollEntryPatch): Promise<ApiSingleResponse<PayrollEntry>> => {
  try {
    console.log({t('payroll:auto_patch_payroll_entries_endpoint_entryid___e58786')}, JSON.stringify(data, null, 2));
    
    // 获取apiClient中配置的请求头
    const requestConfig = {
      url: `${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`,
      method: 'PATCH',
      data,
      headers: apiClient.defaults.headers
    };
    
    console.log({t('payroll:auto___e8afb7')}, JSON.stringify(requestConfig, null, 2));
    
    // 验证earnings_details和deductions_details的结构是否符合后端期望
    if (data.earnings_details && Array.isArray(data.earnings_details)) {
      console.error({t('payroll:auto__earnings_details__e8ada6')});
    }
    
    if (data.deductions_details && Array.isArray(data.deductions_details)) {
      console.error({t('payroll:auto__deductions_details__e8ada6')});
    }
    
    const response = await apiClient.patch<ApiSingleResponse<PayrollEntry>>(`${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`, data);
    
    console.log({t('payroll:auto_patch__response_status___504154')}, response.headers);
    console.log({t('payroll:auto___e5938d')}, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error(`Error updating payroll entry ${entryId}:`, error);
    
    // 增加更详细的错误日志
    if (error.response) {
      console.error({t('payroll:auto_patch__error_response_status__504154')});
      console.error({t('payroll:auto___e99499')}, JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
};

/**
 * Creates a new payroll entry.
 * @param data The data for the new payroll entry.
 * @returns A promise that resolves to the created payroll entry.
 */
export const createPayrollEntry = async (data: CreatePayrollEntryPayload): Promise<ApiSingleResponse<PayrollEntry>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollEntry>>(PAYROLL_ENTRIES_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error creating payroll entry:', error);
    throw error;
  }
};

/**
 * Bulk creates payroll entries.
 * @param data The bulk creation payload with payroll period ID and entries array.
 * @returns A promise that resolves to the bulk creation result.
 */
export const bulkCreatePayrollEntries = async (data: BulkCreatePayrollEntriesPayload): Promise<BulkCreatePayrollEntriesResult> => {
  try {
    const response = await apiClient.post<BulkCreatePayrollEntriesResult>(`${PAYROLL_ENTRIES_ENDPOINT}/bulk`, data);
    return response.data;
  } catch (error) {
    console.error('Error bulk creating payroll entries:', error);
    throw error;
  }
};

/**
 * Deletes a payroll entry.
 * @param entryId The ID of the payroll entry to delete.
 * @returns A promise that resolves when the payroll entry is deleted.
 */
export const deletePayrollEntry = async (entryId: number): Promise<void> => {
  try {
    await apiClient.delete(`${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`);
  } catch (error) {
    console.error(`Error deleting payroll entry ${entryId}:`, error);
    throw error;
  }
};

/**
 * 获取薪资字段定义列表
 * @param params 查询参数，如分类、排序等
 * @returns 包含组件定义列表的Promise
 */
export const getPayrollComponentDefinitions = async (params?: {
  component_type?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  size?: number;
}): Promise<ApiListResponse<PayrollComponentDefinition>> => {
  try {
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
      PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT, 
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll component definitions:', error);
    throw error; // 直接抛出错误，让调用方处理
  }
};

/**
 * 创建新的薪资字段定义
 * @param componentData 组件定义数据
 * @returns 创建的薪资字段定义
 */
export const createPayrollComponentDefinition = async (
  componentData: Partial<PayrollComponentDefinition>
): Promise<ApiSingleResponse<PayrollComponentDefinition>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollComponentDefinition>>(
      PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT,
      componentData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating payroll component definition:', error);
    throw error;
  }
};

/**
 * 更新薪资字段定义
 * @param id 组件定义ID
 * @param componentData 更新的组件定义数据
 * @returns 更新后的薪资字段定义
 */
export const updatePayrollComponentDefinition = async (
  id: number,
  componentData: Partial<PayrollComponentDefinition>
): Promise<ApiSingleResponse<PayrollComponentDefinition>> => {
  try {
    // Log the data being sent to the backend
    console.log('Attempting to update payroll component definition with ID:', id);
    console.log('Data being sent to backend:', JSON.stringify(componentData, null, 2));

    const response = await apiClient.put<ApiSingleResponse<PayrollComponentDefinition>>(
      `${PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT}/${id}`,
      componentData
    );
    // Log successful response
    console.log('Successfully updated payroll component definition. Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error(`Error updating payroll component definition ${id}:`, error);
    // Enhanced error logging
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('Error request - no response received:', error.request);
    } else {
      console.error('Error message - an issue occurred in setting up the request:', error.message);
    }
    throw error;
  }
};

/**
 * 删除薪资字段定义
 * @param id 组件定义ID
 * @returns 操作成功返回true
 */
export const deletePayrollComponentDefinition = async (
  id: number
): Promise<boolean> => {
  try {
    await apiClient.delete(`${PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT}/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting payroll component definition:', error);
    throw error;
  }
}; 