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
} from '../types/payrollTypes';
import i18n from 'i18next';

const PAYROLL_PERIODS_ENDPOINT = '/payroll-periods';
const PAYROLL_RUNS_ENDPOINT = '/payroll-runs';
const PAYROLL_ENTRIES_ENDPOINT = '/payroll-entries';

/**
 * Fetches a list of payroll periods.
 * @param params Query parameters for filtering, pagination, etc.
 * @returns A promise that resolves to the list of payroll periods with metadata.
 */
export const getPayrollPeriods = async (params?: Record<string, any>): Promise<ApiListResponse<PayrollPeriod>> => {
  try {
    const response = await apiClient.get<ApiListResponse<PayrollPeriod>>(PAYROLL_PERIODS_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
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
  payroll_period_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<ApiListResponse<PayrollRun>> => {
  try {
    const response = await apiClient.get<ApiListResponse<PayrollRun>>(PAYROLL_RUNS_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
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
  include_employee_details?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<ApiListResponse<PayrollEntry>> => {
  try {
    const response = await apiClient.get<ApiListResponse<PayrollEntry>>(PAYROLL_ENTRIES_ENDPOINT, { params });
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
    console.log(`准备发送PATCH请求到 ${PAYROLL_ENTRIES_ENDPOINT}/${entryId}，数据:`, JSON.stringify(data, null, 2));
    
    // 获取apiClient中配置的请求头
    const requestConfig = {
      url: `${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`,
      method: 'PATCH',
      data,
      headers: apiClient.defaults.headers
    };
    
    console.log('请求配置:', JSON.stringify(requestConfig, null, 2));
    
    // 验证earnings_details和deductions_details的结构是否符合后端期望
    if (data.earnings_details && Array.isArray(data.earnings_details)) {
      console.error('警告: earnings_details是数组格式，但后端期望对象格式');
    }
    
    if (data.deductions_details && Array.isArray(data.deductions_details)) {
      console.error('警告: deductions_details是数组格式，但后端期望对象格式');
    }
    
    const response = await apiClient.patch<ApiSingleResponse<PayrollEntry>>(`${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`, data);
    
    console.log(`PATCH请求成功，状态码: ${response.status}，响应头:`, response.headers);
    console.log(`响应数据:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error(`Error updating payroll entry ${entryId}:`, error);
    
    // 增加更详细的错误日志
    if (error.response) {
      console.error(`PATCH请求失败，状态码: ${error.response.status}`);
      console.error(`错误详情:`, JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
};

// 测试翻译函数
export const testTranslations = () => {
  // 使用已导入的i18n实例，而不是重新require
  
  // 测试各种访问方式
  const results = {
    direct: {
      withNamespace: i18n.t('periods_page.button.add_period', { ns: 'payroll' }),
      withoutNamespace: i18n.t('periods_page.button.add_period')
    },
    nestedKeys: {
      fullPath: i18n.t('payroll:periods_page.button.add_period'),
      parentPath: i18n.t('payroll:periods_page.button'),
      directKey: i18n.t('add_period', { ns: 'payroll.periods_page.button' })
    },
    alternatives: {
      createPeriod: i18n.t('periods_page.button.create_period', { ns: 'payroll' }),
      commonButton: i18n.t('button.create', { ns: 'common' })
    },
    loadedNamespaces: i18n.options.ns,
    availableLanguages: i18n.options.preload,
    currentLanguage: i18n.language
  };
  
  return results;
}; 