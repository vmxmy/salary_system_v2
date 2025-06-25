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
    
    // 确保status_lookup_value_id是数字类型
    if (params?.status_lookup_value_id) {
      params.status_lookup_value_id = Number(params.status_lookup_value_id);
    }
    
    const response = await apiClient.get<ApiListResponse<PayrollPeriod>>(PAYROLL_PERIODS_ENDPOINT, { params });
    return response.data;
  } catch (error: any) {
    
    // 添加详细错误日志
    if (error.response) {
    } else if (error.request) {
    } else {
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
    
    // ✅ 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30秒超时
    
    const response = await apiClient.get<ApiListResponse<PayrollRun>>(PAYROLL_RUNS_ENDPOINT, { 
      params,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId); // 清除超时计时器
    
    return response.data;
  } catch (error: any) {
    // ✅ 更详细的错误处理
    if (error.name === 'AbortError') {
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
    } else {
      // 设置请求时发生错误
    }
    
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
    const response = await apiClient.get<ApiListResponse<PayrollEntry>>(PAYROLL_ENTRIES_ENDPOINT, { params });
    
    
    // 检查第一条记录的结构
    if (response.data.data.length > 0) {
      const firstEntry = response.data.data[0];
      console.log('First entry:', {
        id: firstEntry.id,
        employee_id: firstEntry.employee_id,
        has_employee: !!firstEntry.employee,
        employee_keys: firstEntry.employee ? Object.keys(firstEntry.employee) : null,
        employee_first_name: firstEntry.employee?.first_name,
        employee_last_name: firstEntry.employee?.last_name,
      });
    }
    
    return response.data;
  } catch (error: any) {
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
    
    // 添加原始API响应日志
    console.log('🌐 [API原始响应] getPayrollEntryById:', {
      entryId,
      status: response.status,
      headers: response.headers,
      data: response.data,
      deductions_details_raw: response.data?.data?.deductions_details,
      deductions_details_keys: response.data?.data?.deductions_details ? Object.keys(response.data.data.deductions_details) : null
    });
    
    // 检查五险一金字段的手动调整信息
    if (response.data?.data?.deductions_details) {
      const socialInsuranceFields = [
        'PENSION_PERSONAL_AMOUNT',
        'MEDICAL_PERSONAL_AMOUNT', 
        'UNEMPLOYMENT_PERSONAL_AMOUNT',
        'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT',
        'HOUSING_FUND_PERSONAL'
      ];
      
      const manualAdjustmentInfo: Record<string, any> = {};
      socialInsuranceFields.forEach(field => {
        const fieldData = response.data.data.deductions_details[field];
        if (fieldData) {
          manualAdjustmentInfo[field] = {
            raw_data: fieldData,
            is_manual: fieldData.is_manual,
            is_manual_type: typeof fieldData.is_manual,
            manual_at: fieldData.manual_at,
            manual_by: fieldData.manual_by,
            manual_reason: fieldData.manual_reason,
            amount: fieldData.amount
          };
        }
      });
      
      console.log('🔍 [API响应] 五险一金手动调整信息:', manualAdjustmentInfo);
    }
    
    return response.data;
  } catch (error) {
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
    
    // 获取apiClient中配置的请求头
    const requestConfig = {
      url: `${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`,
      method: 'PATCH',
      data,
      headers: apiClient.defaults.headers
    };
    
    
    // 验证earnings_details和deductions_details的结构是否符合后端期望
    if (data.earnings_details && Array.isArray(data.earnings_details)) {
    }
    
    if (data.deductions_details && Array.isArray(data.deductions_details)) {
    }
    
    const response = await apiClient.patch<ApiSingleResponse<PayrollEntry>>(`${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`, data);
    
    
    return response.data;
  } catch (error: any) {
    
    // 增加更详细的错误日志
    if (error.response) {
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

    const response = await apiClient.put<ApiSingleResponse<PayrollComponentDefinition>>(
      `${PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT}/${id}`,
      componentData
    );
    // Log successful response
    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    if (error.response) {
    } else if (error.request) {
    } else {
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
    throw error;
  }
};

export const getPayrollPeriodById = async (id: number): Promise<ApiSingleResponse<PayrollPeriod>> => {
  try {
    const response = await apiClient.get<ApiSingleResponse<PayrollPeriod>>(`${PAYROLL_PERIODS_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 